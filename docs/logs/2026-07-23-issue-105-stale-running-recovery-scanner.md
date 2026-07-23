# Issue #105 stale running recovery scanner 作業ログ

## Summary

lease期限切れの `running` submissionをWorker起動時・定期実行で検出し、new attemptとして安全に回収するstale scannerを実装した。

## Current PR / Issue

- Current Issue: #105
- Issue URL: `https://github.com/mizzz-dev/ai-code-dojo/issues/105`
- Current PR: #108
- PR URL: `https://github.com/mizzz-dev/ai-code-dojo/pull/108`
- Branch: `feat/stale-running-recovery-scanner`
- Related merged PR: #107

## Completed Tasks

- PR #107がmerge済み、Issue #106がClosed / Completedであることを確認した。
- lease期限切れかつlease非NULLのstale候補取得処理を追加した。
- expected attempt / key / lease expiry付きのrecovery transactionを追加した。
- retry上限未満では `retry_pending -> queued(new attempt/key)` を一貫処理するようにした。
- retry上限到達時はcompletion guardを設定して `infra_failed` へ終端化するようにした。
- Worker起動時・periodic scannerを追加した。
- scanner feature flag、interval、batch size、concurrency設定を追加した。
- scanner多重実行を抑止し、候補単位エラー・scan全体エラーでhealth endpointを停止しない構成にした。
- recovery後の再投入失敗時はIssue #106のqueued attempt専用終端化経路を利用した。
- unit / integration testを追加した。
- current-status / active-issues / system-overview / runbookを更新した。
- Linear MIZ-34をIn Progressへ更新し、PR #108を連携した。

## Repository Findings

- DBはNode組み込みの `node:sqlite` `DatabaseSync` を使用している。
- `DatabaseSync` には `better-sqlite3` 形式の `database.transaction()` が存在しない。
- recoveryの原子性は `BEGIN IMMEDIATE` / `COMMIT` / `ROLLBACK` で実装する必要がある。
- attempt idempotency keyはstale recovery後の旧Worker更新を拒否するfencing tokenとして利用できる。
- completion guardはsubmission単位の終端一意化として維持する必要がある。
- leaseがNULLの `legacy_running` はrolling deploy中の旧Workerと区別できないため、自動回収してはいけない。

## Technical Decisions

- stale候補は `running` / completion guard未設定 / lease非NULL / lease期限切れに限定した。
- `updated_at` はstale判定に利用しない。
- recovery transactionの比較条件にsubmission id / expected attempt / expected key / expected lease expiryを含めた。
- stale回収は同一attemptを再利用せず、必ずnew attemptを発行する。
- retry上限は既存 `WORKER_MAX_INFRA_RETRY_ATTEMPTS` と共有する。
- stale recovery有効時はheartbeat有効を必須とした。
- scanner設定値は正の整数とし、concurrencyはbatch size以下に制限した。
- scannerのログはsubmission id、attempt、action、reason、時刻、件数に限定した。
- DB schema / migrationは変更せず、既存lease列を利用した。

## Rejected Alternatives

- `updated_at` の古さだけで回収する案
  - 実行所有権期限ではなく誤回収につながるため不採用。
- Worker起動時に全 `running` を `queued` へ戻す案
  - 正常実行中Workerと競合するため不採用。
- 同一attemptを再利用する案
  - 旧Workerの遅延heartbeat・完了保存をfenceできないため不採用。
- APIからstale回収・採点を実行する案
  - APIで提出コードを直接実行しない不変条件に反するため不採用。
- `database.transaction()` を利用する案
  - 現行 `node:sqlite` APIに存在しないため、明示的transaction制御へ修正した。

## Risks

- SQLiteの `BEGIN IMMEDIATE` によりscan中の書き込み待ちが発生する可能性がある。
- batch size / concurrencyを大きくすると一斉再投入負荷が増加する。
- heartbeat遅延によりleaseが誤失効するとnew attemptが開始されるため、lease durationとheartbeat intervalの監視が必要。
- DB fileを複数ホストから共有する構成は前提にしていない。
- 外部queue導入後もDB側のattempt fencingとcompletion guardは維持する必要がある。

## Test Results

初回CIではunit / integrationが失敗した。

原因:
- `node:sqlite` の `DatabaseSync` に存在しない `database.transaction()` を使用していた。

修正:
- `BEGIN IMMEDIATE` / `COMMIT` / `ROLLBACK` に置き換えた。

修正後のコードheadでは以下を確認した。
- lint: Success
- typecheck: Success
- unit test: Success
- integration test: Success
- schema validation: Success
- build: Success

最終docs反映後にdocs validationを含む全品質ゲートを再確認する。

## Remaining Tasks

- 最終headのdocs validation / app-qualityを確認する。
- PR #108本文へ最終CI結果を反映する。
- PR #108をReady for reviewへ変更する。
- PR #108 merge後にIssue #105とMIZ-34を完了へ同期する。
- merge後にbranch cleanupを確認する。

## Suggested Next Actions

1. PR #108をレビュー・mergeする。
2. stale scannerをfeature flag無効のままdeployする。
3. heartbeat・attempt fencing稼働確認後、限定環境で小さいbatch / concurrencyから有効化する。
4. 次のP1としてqueue運用改善（visibility timeout / DLQ / backoff）の設計へ進む。

## AI Prompts Used

- `docs/ai-prompts/2026-07-23-issue-105-stale-running-recovery-scanner-codex.md`

## Handoff

- `docs/handoff/2026-07-23-issue-105-stale-running-recovery-scanner-handoff.md`
