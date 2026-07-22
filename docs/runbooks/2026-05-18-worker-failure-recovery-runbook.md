# 2026-05-18 Worker failure recovery runbook（Issue #75）

最終更新: 2026-07-22（Issue #101 stale running recovery設計反映）

## 目的
Worker障害発生時に、採点停止・再試行・失敗確定・手動復旧を一貫運用し、learner-safe境界と監査可能性を維持する。

## 対象外
- runner/Worker/queue/DB schemaの大規模変更
- auth/adminロジック変更
- hidden tests仕様変更

## 障害判定フロー
1. 障害イベントを受領（監視/ログ/問い合わせ）
2. failure分類を判定
   - Worker到達不能
   - Worker再起動後の未処理 `queued`
   - Worker実行中断 / stale `running`
   - timeout
   - runtime failure
   - infrastructure failure
3. learner-safe返却に内部情報混入がないか確認
4. 自動再試行・起動時回収・手動復旧の適用可否を判定
5. 最大試行回数超過時は失敗確定・手動復旧へ移行

## Worker起動時のqueued自動回収（Issue #99 / 実装済み）
- Worker起動時にDB上の `queued` submissionを取得する。
- 回収対象は既存のWorker採点経路へ渡し、APIプロセスでは実行しない。
- `queued -> running` はsubmission id / grading attempt / attempt idempotency key / completion guard条件を満たす場合のみclaimする。
- claimに失敗した場合は、他のWorkerまたは通常enqueue経路が取得済みとみなし、採点を実行しない。
- 終端済みsubmissionは回収対象に含めず、非終端状態へ戻さない。

## queued起動時回収の確認手順
1. Worker停止中にDB上で対象submissionが `queued` であることを確認する。
2. Workerを起動する。
3. Workerログで回収件数のみを確認する。提出コード本文、hidden tests、secretはログへ出さない。
4. 対象submissionが `running` を経て終端状態へ遷移することを確認する。
5. 同一submissionへ重複ジョブを投入しても、条件付きclaimにより一方のみが処理することを確認する。
6. learner-safe APIでinternal logs・hidden test結果・attempt idempotency keyが返らないことを確認する。

## stale running回収方針（Issue #101 / 設計確定・未実装）

### stale判定

以下をすべて満たす場合のみstale候補とする。

- `status = running`
- completion guard未設定
- lease期限が存在する
- lease期限が現在時刻以前
- expected attempt / attempt idempotency key / lease条件を含むrecovery CASに成功する

`updated_at` が古いことだけではstaleと判定しない。

lease期限がNULLの既存running行は `legacy_running` とし、自動回収しない。

### 実装後の自動回収予定

```text
running(attempt=N, lease expired)
  -> retry_pending
  -> queued(attempt=N+1, new attempt idempotency key)
```

- stale回収では同一attemptを再利用しない。
- heartbeat・terminal保存・recoveryはexpected attempt/keyでfenceする。
- 旧Workerの遅延heartbeat・遅延完了はno-opとする。
- attempt上限到達時は `infra_failed` へ終端化し、learner-safeでは `failed` として返す。
- stale scannerはAPIではなくWorkerが起動時・定期的に実行する。

### 現時点の運用

Issue #101はdocs-onlyであり、lease / heartbeat / stale scannerは未実装である。

実装完了までは、`running` を自動で `queued` へ戻さない。以下の手動復旧手順を利用する。

## 再試行判断マトリクス
- Worker到達不能: 再試行可（既存上限に従う）
- Worker再起動後の `queued`: 起動時自動回収
- Worker実行中断 / stale `running`: lease実装前は手動判断、実装後は新attemptとして自動回収候補
- infrastructure failure: 再試行可（既存上限・基盤復旧確認に従う）
- timeout: 原則失敗確定（必要時のみ運用承認で単発再実行）
- runtime failure: 原則再試行しない
- hidden tests境界侵害の疑い: 自動再試行を停止し、セキュリティ確認へ移行

## 手動復旧手順
1. 対象submissionの一意識別（submission id / correlation id）
2. 現在状態、completion guard、attempt番号を確認する。
3. `queued` の場合はWorker再起動による自動回収を優先する。
4. `running` の場合は実行中Worker・子プロセスの有無を確認する。
5. lease列がNULLの場合は `legacy_running` として自動回収しない。
6. 実行中処理がないことを確認した後、失敗分類と過去attemptを確認する。
7. 再実行可の場合のみ運用者承認で新attemptとして再投入する。
8. learner向け表示は一般化文言を維持し、内部情報を表示しない。
9. 復旧結果を監査ログに記録する。

## lease実装後の確認手順
1. claim時にlease開始時刻・heartbeat時刻・lease期限が保存されることを確認する。
2. 実行中にheartbeatが更新され、lease期限が延長されることを確認する。
3. heartbeat停止後、lease期限経過前は回収されないことを確認する。
4. lease期限経過後、recovery CASに成功した1処理だけが新attemptを開始することを確認する。
5. 旧attemptのheartbeat・terminal保存がno-opになることを確認する。
6. recoveryと正常完了が競合してもcompletion guardとattempt fencingで結果が一意になることを確認する。
7. learner-safe APIにlease・heartbeat・attempt key・worker情報・hidden tests詳細が出ないことを確認する。

## 監査ログ最小要件
- submission id
- attempt番号
- failure分類
- retry / recovery判断理由
- claim / heartbeat / recovery / completionの結果
- 復旧担当者または内部処理種別
- 時刻（UTC）

worker instance IDを扱う場合はhashまたは短期識別子とし、生のインフラ情報をlearnerへ返さない。

## セキュリティ境界チェック
- hidden tests実データをログ/通知に含めない。
- 提出コード本文を起動時回収・heartbeat・stale回収ログへ含めない。
- secret / token / passwordを記録しない。
- internal stack traceはadmin/internalのみとする。
- learner向けには抽象化エラーのみ表示する。
- attempt idempotency key、lease期限、heartbeat、worker情報をlearnerへ返さない。

## エスカレーション基準
- 同分類障害が短時間に多発する。
- infrastructure failureが継続する。
- 起動時回収後も `queued` が減少しない。
- stale `running` / `legacy_running` が残存する。
- heartbeat失敗またはrecovery失敗が連続する。
- 重複完了・attempt不一致・整合性異常の兆候がある。
- hidden tests境界侵害の疑いがある。

## 連携先
- Issue #101: `https://github.com/mizzz-dev/ai-code-dojo/issues/101`
- stale running設計: `docs/reports/2026-07-22-stale-running-lease-recovery-design.md`
- stale running ADR: `docs/adr/2026-07-22-stale-running-lease-recovery.md`
- Issue #99: `https://github.com/mizzz-dev/ai-code-dojo/issues/99`
- Worker failure retry policy: `docs/reports/2026-05-18-worker-failure-retry-policy.md`
- docs同期手順: `docs/runbooks/2026-05-18-post-merge-docs-sync-checklist.md`
