# Issue #99 Worker起動時queued submission回収 作業ログ

## Summary
Worker再起動後にDB上へ残った `queued` submissionを回収し、条件付きclaimで二重採点を防ぐ最小実装を追加した。Draft PR #100を作成し、integration testを含むGitHub Actions品質ゲートが全て成功した。

## Current Issue
- GitHub Issue: #99
- URL: `https://github.com/mizzz-dev/ai-code-dojo/issues/99`
- Linear mirror: `MIZ-19`
- 優先度: P1
- 状態: Open / In Progress（PR #100レビュー・merge待ち）

## Pull Request
- PR: #100
- URL: `https://github.com/mizzz-dev/ai-code-dojo/pull/100`
- Branch: `fix/recover-queued-submissions-on-worker-startup`
- 状態: CI成功、レビュー可能

## Completed Tasks
- GitHub上で未CloseだったIssue #96へ完了コメントを追加し、Closed / Completedへ同期した。
- Issue #99を作成し、assignee / labelsを設定した。
- submission repositoryへ `listQueuedSubmissions` を追加した。
- submission repositoryへ `claimSubmissionForProcessing` を追加した。
- Worker起動時にqueued submissionを回収し、既存 `processSubmission` 経路へ渡す処理を追加した。
- 通常enqueueと起動時回収が競合しても、`queued -> running` の条件付きclaimに成功した処理だけが採点を実行するようにした。
- unit / integration testを追加した。
- `.github/workflows/app-quality.yml` にintegration test品質ゲートを追加した。
- current-status / active-issues / Worker failure recovery runbookを更新した。
- Draft PR #100を作成した。
- GitHub Actionsでapp-quality / docs-validationの成功を確認した。

## Repository Findings
- `docs/ai-protocol/PROMPT.txt` の不変条件を確認した。
- `docs/current-status.md` / `docs/active-issues.md` では次のP1がqueue運用改善とされていた。
- GitHub Issue #96はOpenだったが、PR #97 / PR #98で完了条件が実装済みだったため状態不一致を解消した。
- Workerは起動時にDB上のqueued submissionを回収していなかった。
- `processSubmission` は処理開始前に通常の非条件付き更新で `running` へ遷移しており、重複ジョブの同時実行をDB更新で排他できていなかった。
- 既存app-quality workflowにはintegration test jobがなく、Issue #99の回復導線をCIで検証できない状態だった。

## Technical Decisions
- 外部queueを導入せず、現行SQLite上の条件付きUPDATEをclaimとして利用する。
- claim条件は submission id / status=`queued` / completion guard未設定 / grading attempt / attempt idempotency key とする。
- Worker起動時回収も通常enqueueも同じ `processSubmission` を利用する。
- claim失敗時は他処理が取得済みとみなし、採点を開始しない。
- stale `running` は今回の対象外とし、自動で `queued` へ戻さない。
- integration testをapp-qualityの必須依存に追加し、build前の品質ゲートとする。

## Rejected Alternatives
- Redis / BullMQ等の外部queue導入: 差分と運用影響が大きいため対象外。
- `running` をWorker起動時に一律 `queued` へ戻す: 実行中ジョブとの競合・二重実行リスクがあるため不採用。
- API起動時に回収・採点する: APIで提出コードを直接実行しない不変条件に反するため不採用。
- integration testを手動確認のみとする: 回帰検知できないため不採用。

## Test Results
GitHub Actions run #47で以下を確認した。

- `pnpm lint`: Success
- `pnpm typecheck`: Success
- `pnpm test:unit`: Success
- `pnpm test:integration`: Success
- `pnpm schema:validate`: Success
- `pnpm build`: Success
- `scripts/validate-ai-protocol-docs.sh`: Success

## Risks
- 起動時回収は現行DB内のqueued全件を対象とするため、大量滞留時の同時処理数制御は未対応。
- Worker停止時に `running` だったsubmissionは自動復旧しない。
- visibility timeout / DLQ / backoff / lease / heartbeatは未実装。
- ローカル実行環境からGitHubへ直接cloneできなかったため、検証はGitHub Actionsを正本とした。

## Remaining Tasks
- PR #100のレビューを実施する。
- merge後にIssue #99とLinear MIZ-19を完了へ更新する。
- merge後にhead branchを削除する。
- stale `running` recovery設計を後続Issueへ分離する。

## Suggested Next Actions
1. PR #100をレビュー可能状態へ切り替える。
2. レビューで条件付きclaimとretry state machineの整合を確認する。
3. merge後、stale `running` recovery設計Issueを作成する。

## AI Prompts Used
- `docs/ai-prompts/2026-07-22-issue-99-worker-startup-queued-recovery-codex.md`

## Handoff
- `docs/handoff/2026-07-22-issue-99-worker-startup-queued-recovery-handoff.md`
