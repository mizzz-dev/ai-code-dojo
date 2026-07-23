# 2026-05-18 Worker failure recovery runbook（Issue #75）

最終更新: 2026-07-23（Issue #106 retry再投入失敗時のqueued attempt終端化を反映）

## 目的
Worker障害発生時に、採点停止・再試行・失敗確定・手動復旧を一貫運用し、learner-safe境界と監査可能性を維持する。

## 対象外
- runner/queue基盤の大規模変更
- auth/adminロジック変更
- hidden tests仕様変更

## 障害判定フロー
1. 障害イベントを受領（監視/ログ/問い合わせ）。
2. failure分類を判定する。
   - Worker到達不能
   - Worker再起動後の未処理 `queued`
   - Worker実行中断 / stale `running`
   - retry再投入失敗
   - timeout
   - runtime failure
   - infrastructure failure
3. learner-safe返却に内部情報混入がないか確認する。
4. 自動再試行・起動時回収・手動復旧の適用可否を判定する。
5. 最大試行回数超過または再投入失敗時は失敗確定・手動確認へ移行する。

## Worker起動時のqueued自動回収（Issue #99 / 実装済み）
- Worker起動時にDB上の `queued` submissionを取得する。
- 回収対象は既存のWorker採点経路へ渡し、APIプロセスでは実行しない。
- `queued -> running` はsubmission id / grading attempt / attempt idempotency key / completion guard条件を満たす場合のみclaimする。
- claimに失敗した場合は、他のWorkerまたは通常enqueue経路が取得済みとみなし、採点を実行しない。
- 終端済みsubmissionは回収対象に含めず、非終端状態へ戻さない。

## processing lease / heartbeat（Issue #102 / PR #104）

### feature flag
- `WORKER_HEARTBEAT_ENABLED=1` の場合のみprocessing leaseとheartbeatを有効化する。
- 無効時は従来のclaim・採点挙動を維持する。

### 設定値
- `WORKER_LEASE_DURATION_MS`（既定30秒）
- `WORKER_HEARTBEAT_INTERVAL_MS`（既定10秒）
- heartbeat intervalはlease durationの3分の1以下とする。
- 有効時に0以下、NaN、または間隔条件違反がある場合はWorker起動エラーとする。

### claim
- heartbeat有効時のclaim成功時に以下を保存する。
  - `processing_claimed_at`
  - `processing_heartbeat_at`
  - `processing_lease_expires_at`
- claim条件はsubmission id / status=`queued` / completion guard未設定 / grading attempt / attempt idempotency keyとする。

### heartbeat
- Workerはclaim成功後にheartbeat timerを開始する。
- heartbeatはsubmission id / status=`running` / completion guard未設定 / expected attempt / expected key / lease未失効を条件に更新する。
- 更新成功時はheartbeat時刻とlease期限を延長する。
- 更新0件またはDBエラー時は所有権喪失として扱い、そのWorkerは結果保存を行わない。

### fenced update
- Workerの非終端更新・terminal保存はexpected attempt / expected key / lease未失効を条件にする。
- running attemptのterminal保存は `status = running` を必須条件とする。
- terminal保存時はprocessing lease情報をクリアする。
- retry_pending遷移時もprocessing lease情報をクリアする。
- retry attempt開始時は新attempt / 新keyを発行し、旧attemptの遅延更新をno-opにする。
- completion guardはsubmission単位の終端一意化として維持する。

## retry再投入失敗時のqueued attempt終端化（Issue #106 / PR #107）

### 背景
- infrastructure failureで再試行可能な場合、状態は `running -> retry_pending -> queued(new attempt)` へ進む。
- 新attemptをWorkerへ再投入できなかった時点ではsubmissionは `queued` であり、running attempt専用のterminal更新は利用できない。
- queued状態を放置すると、Worker再起動まで結果が確定しないため、現在attemptをfenceした専用終端化が必要となる。

### 更新条件
以下をすべて満たす場合のみ `infra_failed` へ終端化する。
- submission id一致
- `status = queued`
- completion guard未設定
- expected grading attempt一致
- expected attempt idempotency key一致

### 終端処理
- `status = infra_failed` を保存する。
- retry再投入失敗を示すinternalログを保存する。
- completion guardを設定する。
- processing lease関連列をNULLへクリアする。
- learner-safeレスポンスでは `failed` に抽象化し、internalログを返さない。

### no-op条件
- attempt/key不一致
- `running` / `retry_pending` / terminal状態
- completion guard設定済み
- 重複した終端化要求

### 確認手順
1. `WORKER_RETRY_ENQUEUE_BASE_URL` を到達不能な検証用URLへ設定する。
2. infrastructure failureを発生させるsubmissionを投入する。
3. attempt 1が `retry_pending` を経てattempt 2の `queued` へ進むことを確認する。
4. retry enqueue失敗後、attempt 2が `infra_failed` へ到達することを確認する。
5. completion guardが設定されていることを確認する。
6. learner-safeでは `failed` として返り、internalログ・attempt key・lease情報が含まれないことを確認する。
7. admin/internalでは再投入失敗の一般化された内部ログを確認する。

## stale running回収方針（設計確定・scanner未実装）

以下をすべて満たす場合のみstale候補とする。
- `status = running`
- completion guard未設定
- lease期限が存在する
- lease期限が現在時刻以前
- expected attempt / expected key / expected lease条件を含むrecovery CASに成功する

`updated_at` が古いことだけではstaleと判定しない。
lease期限がNULLの既存running行は `legacy_running` とし、自動回収しない。

後続実装予定:

```text
running(attempt=N, lease expired)
  -> retry_pending
  -> queued(attempt=N+1, new attempt idempotency key)
```

- stale回収では同一attemptを再利用しない。
- attempt上限到達時は `infra_failed` へ終端化し、learner-safeでは `failed` として返す。
- stale scannerはAPIではなくWorkerが起動時・定期的に実行する。
- Issue #105はIssue #106 / PR #107の完了後に着手する。

## 確認手順

### queued起動時回収
1. Worker停止中にDB上で対象submissionが `queued` であることを確認する。
2. Workerを起動する。
3. 回収件数だけをログで確認する。提出コード本文、hidden tests、secretは記録しない。
4. 対象submissionが `running` を経て終端状態へ遷移することを確認する。
5. 重複ジョブでも条件付きclaimにより一方のみが処理することを確認する。

### lease / heartbeat
1. heartbeat feature flagを有効にする。
2. claim時にclaimed/heartbeat/lease期限が保存されることを確認する。
3. 実行中にheartbeat時刻とlease期限が延長されることを確認する。
4. terminal保存後にprocessing lease情報がNULLになることを確認する。
5. attempt/key不一致のheartbeat・terminal保存がno-opになることを確認する。
6. lease期限切れ後のheartbeat・terminal保存がno-opになることを確認する。
7. learner-safe APIにlease・heartbeat・attempt key・hidden tests詳細が出ないことを確認する。

## rollout
1. nullableなlease関連列のadditive migrationを適用する。
2. heartbeat feature flag無効のまま新Workerをdeployする。
3. migration、既存claim、通常採点、retry経路の回帰がないことを確認する。
4. queued retry attempt終端化を含むWorkerを先にdeployする。
5. 限定環境でheartbeat feature flagを有効化する。
6. claim・heartbeat・fenced completion・retry enqueue failure終端化を確認する。
7. stale scannerはIssue #105で実装・有効化する。

## rollback
- heartbeat feature flagを無効化する。
- nullable列は残し、destructive downgradeを行わない。
- stale scannerは未実装のため、自動回収は開始しない。
- `legacy_running` は運用者確認後の手動復旧対象とする。
- Issue #106の変更をrollbackする場合、retry再投入失敗時にqueuedが残る既知リスクを運用上明示する。

## 再試行判断マトリクス
- Worker到達不能: 再試行可（既存上限に従う）
- Worker再起動後の `queued`: 起動時自動回収
- retry再投入失敗: 現在のqueued attemptを `infra_failed` へ終端化
- Worker実行中断 / stale `running`: scanner実装前は手動判断
- infrastructure failure: 再試行可（既存上限・基盤復旧確認に従う）
- timeout: 原則失敗確定
- runtime failure: 原則再試行しない
- hidden tests境界侵害の疑い: 自動再試行を停止し、セキュリティ確認へ移行

## 手動復旧手順
1. submission id / correlation idで対象を特定する。
2. status、completion guard、attempt、lease期限を確認する。
3. `queued` かつcompletion guard未設定の場合はWorker再起動による自動回収を優先する。
4. retry再投入失敗後も `queued` が残る場合はIssue #106対応版が稼働しているか確認する。
5. `running` の場合は実行中Worker・子プロセスの有無を確認する。
6. leaseがNULLなら `legacy_running` として自動回収しない。
7. lease期限切れでもscanner実装前は自動で状態変更しない。
8. 再実行可の場合のみ運用者承認で新attemptとして再投入する。
9. learner向け表示は一般化文言を維持する。
10. 復旧結果を監査ログへ記録する。

## 監査ログ最小要件
- submission id
- attempt番号
- failure分類
- retry / recovery判断理由
- claim / heartbeat / enqueue / recovery / completionの結果
- 内部処理種別
- 時刻（UTC）

禁止事項:
- hidden tests実データ
- 提出コード本文
- secret / token / password
- learner向けのattempt key、lease期限、worker情報

## エスカレーション基準
- 同分類障害が短時間に多発する。
- retry再投入失敗が連続する。
- heartbeat失敗が連続する。
- lease期限切れ `running` が増加する。
- 起動時回収後も `queued` が減少しない。
- 重複完了・attempt不一致・整合性異常の兆候がある。
- hidden tests境界侵害の疑いがある。

## 連携先
- Issue #106: `https://github.com/mizzz-dev/ai-code-dojo/issues/106`
- PR #107: `https://github.com/mizzz-dev/ai-code-dojo/pull/107`
- Issue #105: `https://github.com/mizzz-dev/ai-code-dojo/issues/105`
- Issue #102: `https://github.com/mizzz-dev/ai-code-dojo/issues/102`
- PR #104: `https://github.com/mizzz-dev/ai-code-dojo/pull/104`
- stale running設計: `docs/reports/2026-07-22-stale-running-lease-recovery-design.md`
- stale running ADR: `docs/adr/2026-07-22-stale-running-lease-recovery.md`
- Worker failure retry policy: `docs/reports/2026-05-18-worker-failure-retry-policy.md`