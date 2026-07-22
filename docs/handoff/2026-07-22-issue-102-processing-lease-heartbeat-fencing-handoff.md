# Issue #102 Handoff

## Summary

submission claimへprocessing leaseとheartbeatを追加し、Workerのheartbeat・状態更新・terminal保存をattempt/key/lease期限でfenceする実装を追加した。

## Current State

- GitHub Issue #102: Open / In Progress
- GitHub PR #104: Draft
- Linear mirror: MIZ-27 / In Progress
- Branch: `feat/submission-processing-lease-heartbeat`
- 前提設計: Issue #101 / PR #103

## Completed Tasks

- processing lease関連nullable列のadditive migration
- lease付きclaim
- heartbeat repository関数
- heartbeat feature flag / duration / interval検証
- Worker heartbeat lifecycle
- non-terminal / terminal fenced update
- retry attempt開始時のlease情報クリア
- completion guard維持
- migration / repository / config / integration test追加・更新
- current-status / active-issues / system-overview / runbook更新
- log / AI prompt / handoff追加

## Key Decisions

- heartbeatはfeature flag有効時だけ開始する。
- feature flag無効時は従来挙動を維持する。
- attempt idempotency keyをfencing tokenとして利用する。
- heartbeat・状態更新・terminal保存はexpected attempt/keyとlease未失効を条件とする。
- heartbeat更新0件またはエラー時は所有権喪失として結果を保存しない。
- completion guardはsubmission単位の終端一意化として維持する。
- terminal / retry_pending / retry開始時にlease情報をクリアする。
- stale scannerは本Issueへ含めない。

## Review Focus

- `processing_lease_expires_at` のISO日時文字列比較がSQLite運用条件内で妥当か。
- lease期限切れ後のheartbeat・terminal保存が確実にno-opになるか。
- heartbeat無効時に既存retry flowが変わらないか。
- retry_pending遷移とnew attempt開始時のfencingが競合しないか。
- completion guardとattempt fencingの条件順が妥当か。
- heartbeat timer停止と非同期heartbeatの競合が無害か。
- learner-safe DTOへlease・attempt keyが露出しないか。

## Validation Required

- docs validation
- lint
- typecheck
- unit test
- integration test
- schema validation
- build

確認対象:
- 旧DB migrationの冪等性
- lease付きclaim
- heartbeat延長
- attempt/key不一致のno-op
- lease期限切れ後のno-op
- retry後の旧attempt terminal拒否
- terminal保存後のleaseクリア
- learner-safe境界

## Known Risks

- heartbeat有効化後のSQLite書き込み頻度増加
- event loop遅延によるlease失効
- heartbeat失敗後にscanner実装までrunningが残る
- 大量stale時のbatch size・同時実行数未確定
- SQLite単一ホスト前提

## Remaining Tasks

1. 最終headのCI結果を確認する。
2. PR #104をReady for reviewへ変更する。
3. レビュー後にmergeする。
4. Issue #102 / Linear MIZ-27を完了へ更新する。
5. branch cleanupを確認する。
6. stale候補一覧 / recovery transaction / periodic scannerの後続Issueを作成する。

## Handoff Notes

- Source of TruthはGitHub Issue #102とRepository内docs。
- stale scannerや自動recoveryをPR #104へ追加しないこと。
- APIで提出コードを直接実行しないこと。
- hidden tests詳細、提出コード本文、secret、環境変数値をIssue / PR / docs / logsへ記載しないこと。
