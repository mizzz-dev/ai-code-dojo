# 2026-05-18 Worker failure recovery runbook（Issue #75）

最終更新: 2026-07-23（Issue #105 stale running自動回収を反映）

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
4. 自動再試行・起動時回収・stale自動回収・手動復旧の適用可否を判定する。
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

### claim / heartbeat / fenced update
- claim成功時に `processing_claimed_at` / `processing_heartbeat_at` / `processing_lease_expires_at` を保存する。
- claim条件はsubmission id / status=`queued` / completion guard未設定 / grading attempt / attempt idempotency keyとする。
- heartbeatはsubmission id / status=`running` / completion guard未設定 / expected attempt / expected key / lease未失効を条件に更新する。
- heartbeat更新0件またはDBエラー時は所有権喪失として扱い、そのWorkerは結果保存を行わない。
- Workerの非終端更新・terminal保存はexpected attempt / expected key / lease未失効を条件にする。
- running attemptのterminal保存は `status = running` を必須条件とする。
- terminal / retry_pending / retry開始時にprocessing lease情報をクリアする。
- retry attempt開始時は新attempt / 新keyを発行し、旧attemptの遅延更新をno-opにする。
- completion guardはsubmission単位の終端一意化として維持する。

## retry再投入失敗時のqueued attempt終端化（Issue #106 / PR #107）
- infrastructure failureの再試行は `running -> retry_pending -> queued(new attempt)` へ進む。
- new attemptをWorkerへ再投入できなかった場合は、queued attempt専用の条件付き更新を使用する。
- 更新条件はsubmission id / `status = queued` / completion guard未設定 / expected attempt / expected keyとする。
- 成功時は `infra_failed`、内部向け一般化ログ、completion guardを保存し、processing lease情報をクリアする。
- attempt/key不一致、running、retry_pending、terminal、completion guard設定済み、重複要求はno-opとする。
- learner-safeレスポンスでは `failed` に抽象化し、内部ログ・attempt key・lease情報を返さない。

## stale running自動回収（Issue #105 / PR #108）

### feature flag / 設定値
- `WORKER_STALE_RECOVERY_ENABLED=1` の場合のみscannerを有効化する。
- stale recovery有効時は `WORKER_HEARTBEAT_ENABLED=1` を必須とする。
- `WORKER_STALE_RECOVERY_INTERVAL_MS`（既定15秒）
- `WORKER_STALE_RECOVERY_BATCH_SIZE`（既定10件）
- `WORKER_STALE_RECOVERY_CONCURRENCY`（既定2件）
- interval / batch size / concurrencyは正の整数とする。
- concurrencyはbatch size以下とする。
- feature flag無効時はstartup / periodic scannerを実行しない。

### stale候補
以下をすべて満たす場合のみ候補とする。
- `status = running`
- completion guard未設定
- lease期限がNULLではない
- lease期限が現在時刻以前

`updated_at` が古いことだけではstaleと判定しない。
lease期限がNULLの既存running行は `legacy_running` とし、自動回収しない。

### recovery transaction
- SQLiteの `BEGIN IMMEDIATE` transactionを利用する。
- 比較条件にsubmission id / expected attempt / expected attempt idempotency key / expected lease expiryを含める。
- transaction内で現在行を再検証し、条件不一致はno-opとする。
- 複数scannerが同じ候補を取得しても、先にtransactionを完了した1件だけが回収する。

retry上限未満:

```text
running(attempt=N, lease expired)
  -> retry_pending(attempt=N)
  -> queued(attempt=N+1, new attempt idempotency key)
  -> Workerへ再投入
```

retry上限到達:

```text
running(attempt=max, lease expired)
  -> infra_failed（completion guard設定）
```

- stale回収では同一attemptを再利用しない。
- new attempt発行時にprocessing lease情報をクリアする。
- 旧attemptのheartbeat・状態更新・terminal保存はattempt/key不一致でno-opとなる。
- recovery後の再投入失敗はIssue #106のqueued attempt専用終端化経路を利用する。
- learner-safeでは `infra_failed` を `failed` に抽象化する。

### scanner lifecycle
- Worker起動時にstartup scanを実行する。
- その後、設定間隔でperiodic scanを実行する。
- 前回scan実行中は次scanをskipし、多重実行を抑止する。
- batch sizeとconcurrencyで一回あたりの負荷を制御する。
- 候補単位エラーは他候補の処理を継続する。
- scan全体エラーは内部ログへ記録し、Workerのhealth endpointは停止しない。

### 内部ログ
記録してよい項目:
- submission id
- previous / next attempt番号
- action（requeued / infra_failed）
- reason（lease_expired / enqueue_failed）
- scan trigger（startup / periodic）
- 件数とUTC時刻

記録禁止:
- 提出コード本文
- hidden tests実データ
- secret / token / password
- attempt idempotency key
- learnerへ不要な内部endpoint情報

## 確認手順

### queued起動時回収
1. Worker停止中にDB上で対象submissionが `queued` であることを確認する。
2. Workerを起動する。
3. 回収件数だけをログで確認する。
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

### stale recovery
1. heartbeatを有効、stale recoveryを無効にした状態で期限切れleaseの `running` を準備する。
2. scanner無効時は状態が変わらないことを確認する。
3. stale recoveryを有効にしてWorkerを起動する。
4. startup scanでattemptがincrementし、新keyのqueued attemptとして再投入されることを確認する。
5. Worker起動後に別の期限切れrunningを準備し、periodic scanで回収されることを確認する。
6. leaseがNULLの `legacy_running` が回収されないことを確認する。
7. expected lease、attempt、keyのいずれかが不一致の場合にno-opとなることを確認する。
8. 同一候補へ重複recoveryを実行し、1件だけ成功することを確認する。
9. retry上限到達時は `infra_failed` とcompletion guardが保存されることを確認する。
10. learner-safeでは `failed`、admin/internalでは一般化された `infra_failed` を確認する。

## rollout
1. nullableなlease関連列のadditive migrationを適用する。
2. heartbeat・attempt fencing・queued retry failure終端化対応Workerを、stale recovery無効でdeployする。
3. migration、通常採点、queued起動時回収、retry経路の回帰がないことを確認する。
4. 限定環境でheartbeatを有効化する。
5. claim・heartbeat・fenced completionを確認する。
6. stale recoveryを小さいbatch / concurrencyで有効化する。
7. stale候補数、requeued数、infra_failed数、no-op数、error数を監視する。
8. 安定後にinterval / batch / concurrencyを運用負荷に合わせて調整する。

## rollback
- `WORKER_STALE_RECOVERY_ENABLED` を無効化する。
- 必要に応じてheartbeatも無効化する。
- nullable列は残し、destructive downgradeを行わない。
- rollback後のlease期限切れrunningは運用者確認後の手動復旧対象とする。
- `legacy_running` は引き続き自動回収しない。

## 再試行判断マトリクス
- Worker到達不能: 再試行可（既存上限に従う）
- Worker再起動後の `queued`: 起動時自動回収
- retry再投入失敗: 現在のqueued attemptを `infra_failed` へ終端化
- Worker実行中断 / stale `running`（lease非NULL・期限切れ）: stale scannerでnew attempt回収
- `legacy_running`（lease NULL）: 自動回収せず手動判断
- infrastructure failure: 再試行可（既存上限・基盤復旧確認に従う）
- timeout: 原則失敗確定
- runtime failure: 原則再試行しない
- hidden tests境界侵害の疑い: 自動再試行を停止し、セキュリティ確認へ移行

## 手動復旧手順
1. submission id / correlation idで対象を特定する。
2. status、completion guard、attempt、lease期限を確認する。
3. `queued` かつcompletion guard未設定の場合はWorker再起動による自動回収を優先する。
4. `running` かつlease非NULL・期限切れの場合はscanner有効状態と直近scanログを確認する。
5. leaseがNULLなら `legacy_running` として自動回収しない。
6. scannerが連続失敗している場合はfeature flagを無効化し、運用者承認でnew attemptまたは失敗確定を行う。
7. learner向け表示は一般化文言を維持する。
8. 復旧結果を監査ログへ記録する。

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
- stale scanのerror / no-opが急増する。
- 回収後のqueuedが減少しない。
- 重複完了・attempt不一致・整合性異常の兆候がある。
- hidden tests境界侵害の疑いがある。

## 連携先
- Issue #105: `https://github.com/mizzz-dev/ai-code-dojo/issues/105`
- PR #108: `https://github.com/mizzz-dev/ai-code-dojo/pull/108`
- Issue #106: `https://github.com/mizzz-dev/ai-code-dojo/issues/106`
- PR #107: `https://github.com/mizzz-dev/ai-code-dojo/pull/107`
- Issue #102: `https://github.com/mizzz-dev/ai-code-dojo/issues/102`
- PR #104: `https://github.com/mizzz-dev/ai-code-dojo/pull/104`
- stale running設計: `docs/reports/2026-07-22-stale-running-lease-recovery-design.md`
- stale running ADR: `docs/adr/2026-07-22-stale-running-lease-recovery.md`
- Worker failure retry policy: `docs/reports/2026-05-18-worker-failure-retry-policy.md`
