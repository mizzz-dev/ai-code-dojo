# Issue #99 Worker起動時queued submission回収 作業ログ

## Summary
Worker再起動後にDB上へ残った `queued` submissionを回収し、条件付きclaimで二重採点を防ぐ最小実装に着手した。

## Current Issue
- GitHub Issue: #99
- URL: `https://github.com/mizzz-dev/ai-code-dojo/issues/99`
- Linear mirror: `MIZ-19`
- 優先度: P1

## Completed Tasks
- GitHub上で未CloseだったIssue #96へ完了コメントを追加し、Closed / Completedへ同期した。
- Issue #99を作成し、assignee / labelsを設定した。
- submission repositoryへ `listQueuedSubmissions` を追加した。
- submission repositoryへ `claimSubmissionForProcessing` を追加した。
- Worker起動時にqueued submissionを回収し、既存 `processSubmission` 経路へ渡す処理を追加した。
- 通常enqueueと起動時回収が競合しても、`queued -> running` の条件付きclaimに成功した処理だけが採点を実行するようにした。
- unit / integration testを追加した。
- current-status / active-issues / Worker failure recovery runbookを更新した。

## Repository Findings
- `docs/ai-protocol/PROMPT.txt` の不変条件を確認した。
- `docs/current-status.md` / `docs/active-issues.md` では次のP1がqueue運用改善とされていた。
- GitHub Issue #96はOpenだったが、PR #97 / PR #98で完了条件が実装済みだったため状態不一致を解消した。
- Workerは起動時にDB上のqueued submissionを回収していなかった。
- `processSubmission` は処理開始前に通常の非条件付き更新で `running` へ遷移しており、重複ジョブの同時実行をDB更新で排他できていなかった。

## Technical Decisions
- 外部queueを導入せず、現行SQLite上の条件付きUPDATEをclaimとして利用する。
- claim条件は submission id / status=`queued` / completion guard未設定 / grading attempt / attempt idempotency key とする。
- Worker起動時回収も通常enqueueも同じ `processSubmission` を利用する。
- claim失敗時は他処理が取得済みとみなし、採点を開始しない。
- stale `running` は今回の対象外とし、自動で `queued` へ戻さない。

## Rejected Alternatives
- Redis / BullMQ等の外部queue導入: 差分と運用影響が大きいため対象外。
- `running` をWorker起動時に一律 `queued` へ戻す: 実行中ジョブとの競合・二重実行リスクがあるため不採用。
- API起動時に回収・採点する: APIで提出コードを直接実行しない不変条件に反するため不採用。

## Risks
- 起動時回収は現行DB内のqueued全件を対象とするため、大量滞留時の同時処理数制御は未対応。
- Worker停止時に `running` だったsubmissionは自動復旧しない。
- visibility timeout / DLQ / backoff / lease / heartbeatは未実装。
- ローカル実行環境からGitHubへ直接cloneできなかったため、検証はGitHub Actionsを正本とする。

## Remaining Tasks
- GitHub Actionsで lint / typecheck / unit / integration testを確認する。
- PRレビューで条件付きclaimの競合安全性を確認する。
- CI成功後にPRをmergeし、Issue #99をClose / Completedへ更新する。
- merge後にbranchを削除する。

## Suggested Next Actions
1. PRを作成してCIを実行する。
2. CI失敗時は失敗ジョブのログに基づき最小差分で修正する。
3. merge後、stale `running` recovery設計を次Issueとして切り出す。

## AI Prompts Used
- `docs/ai-prompts/2026-07-22-issue-99-worker-startup-queued-recovery-codex.md`

## Handoff
- `docs/handoff/2026-07-22-issue-99-worker-startup-queued-recovery-handoff.md`
