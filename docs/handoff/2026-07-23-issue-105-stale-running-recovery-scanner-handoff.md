# Issue #105 Handoff

## Summary

lease期限切れの `running` submissionをWorker起動時・定期実行で検出し、expected attempt / key / lease expiry付きtransactionに成功した処理だけをnew attemptへ回収する実装を追加した。

## Current State

- GitHub Issue #105: Open / In Progress
- GitHub PR #108: Open / Ready for review / Mergeable
- Branch: `feat/stale-running-recovery-scanner`
- 実装・正本docs・全CI品質ゲート: 完了
- Related completed Issue / PR:
  - Issue #106 / PR #107
  - Issue #102 / PR #104
  - Issue #101 / PR #103
- Linear MIZ-34: In Progress
- Notion: Issue #105実装進捗ページ作成済み

## Implemented Changes

### DB repository

`apps/api/src/repositories/stale-submission-recovery-repository.mjs`

- `listStaleRunningSubmissions`
  - `running`
  - completion guard未設定
  - lease非NULL
  - lease期限切れ
  - lease期限順、作成日時順、limit付き
- `recoverStaleRunningSubmission`
  - `BEGIN IMMEDIATE` / `COMMIT` / `ROLLBACK`
  - expected submission id / attempt / key / lease expiryを再検証
  - retry上限未満は `retry_pending -> queued(new attempt/key)`
  - retry上限到達はcompletion guard付き `infra_failed`
  - processing lease情報をクリア
  - 条件不一致はno-op

### Worker config

`apps/worker/src/config/stale-recovery-config.mjs`

- `WORKER_STALE_RECOVERY_ENABLED`
- `WORKER_STALE_RECOVERY_INTERVAL_MS`
- `WORKER_STALE_RECOVERY_BATCH_SIZE`
- `WORKER_STALE_RECOVERY_CONCURRENCY`
- stale recovery有効時はheartbeat有効を必須化
- 正の整数検証
- concurrency <= batch size

### Worker scanner

`apps/worker/src/services/stale-recovery-scanner.mjs`

- startup / periodic scan
- scan多重実行抑止
- batch / concurrency制御
- 候補単位エラー継続
- scan全体エラーを内部ログ化しhealth endpointを維持
- 回収成功時のみnew attemptをenqueue
- enqueue失敗時はIssue #106のqueued attempt専用終端化経路を利用
- ログから提出コード、hidden tests、secret、attempt keyを除外

### Worker lifecycle

`apps/worker/src/server.mjs`

- processing lease config確定後にstale recovery configを検証
- Worker listen後にqueued回収とstale scannerを起動
- API直接実行やRunner仕様は変更していない

## Tests Added

### Unit

- `tests/unit/stale-recovery-config.test.mjs`
- `tests/unit/stale-submission-recovery.test.mjs`
- `tests/unit/stale-recovery-scanner.test.mjs`

確認内容:
- config既定値と不正値
- heartbeat依存
- stale候補の絞り込み
- unexpired / legacy running除外
- expected lease不一致no-op
- transaction成功は1回のみ
- new attempt / new key
- 旧attempt terminal保存no-op
- retry上限到達時のinfra_failed
- scannerのrequeue / terminal / enqueue failure / no-op集計

### Integration

- `tests/integration/stale-recovery-flow.test.mjs`

確認内容:
- feature flag無効時はstale runningを回収しない
- startup scannerでattempt 1をattempt 2へ回収し、採点完了する
- Worker起動後に作成したstale runningをperiodic scannerで回収する
- terminal後にprocessing lease情報がクリアされる

## CI History

初回CI:
- lint: Success
- typecheck: Success
- schema validation: Success
- unit: Failure
- integration: Failure

原因:
- Node組み込み `node:sqlite` `DatabaseSync` に存在しない `database.transaction()` を使用していた。

修正:
- `BEGIN IMMEDIATE` / `COMMIT` / `ROLLBACK` へ置き換えた。

最終headで確認済み:
- docs validation: Success
- lint: Success
- typecheck: Success
- unit: Success
- integration: Success
- schema validation: Success
- build: Success

## Key Decisions

- stale判定はlease期限のみを利用し、`updated_at` は使用しない。
- lease NULLの `legacy_running` は自動回収しない。
- stale回収は同一attemptを再利用しない。
- attempt idempotency keyをfencing tokenとして維持する。
- retry上限は既存infrastructure retry上限と共有する。
- DB schema / migrationを変更しない。
- scannerはWorker責務とし、APIで採点を行わない。
- scanner有効時はheartbeat有効を必須にする。
- scanエラーはhealth endpointを停止させない。

## Review Focus

- `BEGIN IMMEDIATE` transactionの範囲が必要最小限か。
- expected attempt / key / lease expiry条件が十分か。
- retry上限判定が既存Worker retryと一致するか。
- recoveryと正常terminal保存の競合が一意に収束するか。
- startup / periodic scanの重複抑止と負荷制御が妥当か。
- enqueue失敗時のqueued attempt終端化が正しく再利用されているか。
- learner-safe境界を壊していないか。
- ログへ機密情報が含まれていないか。

## Known Risks

- `BEGIN IMMEDIATE` によりSQLite書き込み待ちが発生する可能性がある。
- batch / concurrencyを大きくすると一斉再投入負荷が増える。
- heartbeat遅延によるlease誤失効を監視する必要がある。
- SQLite DB fileの複数ホスト共有は前提外。
- 外部queue導入時もDB attempt fencingとcompletion guardを維持する必要がある。

## Remaining Tasks

1. PR #108のレビュー指摘へ対応する。
2. PR #108をmergeする。
3. merge後にIssue #105 / Linear MIZ-34を完了へ同期する。
4. merge後にbranch cleanupを確認する。
5. 次のP1としてqueue運用改善の設計へ進む。

## Handoff Notes

- Source of TruthはGitHub Issue #105、PR #108、Repository内docs。
- APIで提出コードを直接実行しないこと。
- hidden tests詳細、提出コード本文、secret、環境変数値をIssue / PR / docs / logsへ記載しないこと。
- challengeはversion追加方式を維持すること。
- 外部queue・DLQ・backoff実装をPR #108へ混在させないこと。
- ADRはIssue #101の既存ADRを使用し、新規ADRは不要。
