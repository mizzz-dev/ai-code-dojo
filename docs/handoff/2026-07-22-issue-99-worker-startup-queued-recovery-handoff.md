# Issue #99 Handoff

## Summary
Worker起動時にDB上の `queued` submissionを回収し、SQLiteの条件付きUPDATEで `queued -> running` をclaimする実装を追加した。

## Current State
- GitHub Issue #99: Open / In Progress
- Linear mirror: MIZ-19 / In Progress
- Branch: `fix/recover-queued-submissions-on-worker-startup`
- PR: 作成前

## Completed Tasks
- Issue #96をClosed / Completedへ同期
- Issue #99を作成
- `listQueuedSubmissions` を追加
- `claimSubmissionForProcessing` を追加
- Worker起動時queued回収処理を追加
- `processSubmission`をclaim成功時のみ実行する構造へ変更
- unit / integration testを追加
- current-status / active-issues / runbookを更新
- log / AI prompt / handoffを作成

## Technical Decisions
- 外部queueは導入しない。
- DB schema / migrationは変更しない。
- claim条件はid / queued / completion guard未設定 / attempt / idempotency key。
- stale `running` は自動回収しない。
- API直接実行禁止、hidden tests非露出、challenge version追加方式を維持する。

## Review Focus
- SQLite条件付きUPDATEが同一submissionの二重claimを防げるか。
- `processSubmission`が旧attempt/keyのジョブを無害化できるか。
- 起動時回収と通常enqueueが同時に発生しても一方のみ処理するか。
- infrastructure failure後のretry state machineに回帰がないか。
- workerログへ提出コード・hidden tests・secretが出ないか。

## Validation Required
- `pnpm lint`
- `pnpm typecheck`
- `pnpm test:unit`
- `pnpm test:integration`
- GitHub Actions workflow結果

## Known Risks
- 起動時queued全件をsetImmediateでスケジュールするため、大量滞留時の同時実行制御は未対応。
- stale `running` は復旧しない。
- visibility timeout / DLQ / backoff / lease / heartbeatは未実装。
- ローカル環境ではGitHub cloneがDNS制約で失敗したため、CI結果を検証証跡とする。

## Remaining Tasks
1. PRを作成する。
2. CI結果を確認する。
3. 失敗時は最小差分で修正する。
4. CI成功後にレビュー・mergeする。
5. Issue #99とLinear MIZ-19を完了へ更新する。
6. merge後にbranchを削除する。
7. stale `running` recovery設計を後続Issueへ分離する。

## Handoff Notes
- Source of TruthはGitHub Issue #99とRepository内docs。
- Notion / Linearは追跡用ミラーであり、仕様判断はRepository docsへ戻す。
- 無関係なUI・runner・auth・schema変更を追加しないこと。
