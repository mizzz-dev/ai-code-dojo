# Issue #99 Handoff

## Summary
Worker起動時にDB上の `queued` submissionを回収し、SQLiteの条件付きUPDATEで `queued -> running` をclaimする実装を追加した。PR #100を作成し、integration testを含むGitHub Actions品質ゲートは全て成功している。

## Current State
- GitHub Issue #99: Open / In Progress
- Linear mirror: MIZ-19 / In Progress
- Branch: `fix/recover-queued-submissions-on-worker-startup`
- PR: #100
- PR URL: `https://github.com/mizzz-dev/ai-code-dojo/pull/100`
- CI: app-quality / docs-validation Success
- 次状態: Ready for review → review → merge

## Completed Tasks
- Issue #96をClosed / Completedへ同期
- Issue #99を作成
- `listQueuedSubmissions` を追加
- `claimSubmissionForProcessing` を追加
- Worker起動時queued回収処理を追加
- `processSubmission`をclaim成功時のみ実行する構造へ変更
- unit / integration testを追加
- app-quality workflowへintegration test jobを追加
- current-status / active-issues / runbookを更新
- log / AI prompt / handoffを作成
- PR #100を作成
- lint / typecheck / unit / integration / schema / build / docs-validationの成功を確認

## Technical Decisions
- 外部queueは導入しない。
- DB schema / migrationは変更しない。
- claim条件はid / queued / completion guard未設定 / attempt / idempotency key。
- stale `running` は自動回収しない。
- API直接実行禁止、hidden tests非露出、challenge version追加方式を維持する。
- integration testをbuildの前提品質ゲートへ追加する。

## Review Focus
- SQLite条件付きUPDATEが同一submissionの二重claimを防げるか。
- `processSubmission`が旧attempt/keyのジョブを無害化できるか。
- 起動時回収と通常enqueueが同時に発生しても一方のみ処理するか。
- infrastructure failure後のretry state machineに回帰がないか。
- Workerログへ提出コード・hidden tests・secretが出ないか。
- queued大量滞留時の負荷を今回の非対象として許容できるか。

## Validation Results
- `pnpm lint`: Success
- `pnpm typecheck`: Success
- `pnpm test:unit`: Success
- `pnpm test:integration`: Success
- `pnpm schema:validate`: Success
- `pnpm build`: Success
- docs-validation: Success

## Known Risks
- 起動時queued全件をsetImmediateでスケジュールするため、大量滞留時の同時実行制御は未対応。
- stale `running` は復旧しない。
- visibility timeout / DLQ / backoff / lease / heartbeatは未実装。
- ローカル環境ではGitHub cloneがDNS制約で失敗したため、GitHub Actionsを検証証跡とした。

## Remaining Tasks
1. PR #100をレビュー可能状態にする。
2. 条件付きclaim・retry state machine・learner-safe境界をレビューする。
3. merge後にIssue #99とLinear MIZ-19を完了へ更新する。
4. merge後にhead branchを削除する。
5. stale `running` recovery設計を後続Issueへ分離する。

## Handoff Notes
- Source of TruthはGitHub Issue #99とRepository内docs。
- Notion / Linearは追跡用ミラーであり、仕様判断はRepository docsへ戻す。
- 無関係なUI・runner・auth・schema変更を追加しないこと。
- Issue #99完了後の第一候補はstale `running` recoveryのdocs-only設計。
