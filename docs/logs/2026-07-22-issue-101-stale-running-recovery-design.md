# Issue #101 stale running recovery設計 作業ログ

## Summary

Issue #99 / PR #100完了後の次P1として、Worker停止後に残る stale `running` submissionのlease / heartbeat / attempt fencing / recovery方針をdocs-onlyで整理した。

## Current PR / Issue

- 完了PR: #100 `Worker再起動後にqueued submissionを回収して採点を再開する`
- 完了Issue: #99
- Current Issue: #101
- URL: `https://github.com/mizzz-dev/ai-code-dojo/issues/101`
- Linear mirror: `MIZ-25`
- Branch: `docs/stale-running-recovery-design`

## Completed Tasks

- PR #100がMergedであることを確認した。
- Issue #99がClosed / Completedであることを確認した。
- Linear MIZ-19をDoneへ更新した。
- GitHub Issue #101を作成した。
- Linear MIZ-25をIn Progressで作成した。
- stale `running` recovery設計レポートを作成した。
- stale `running` recovery ADRを作成した。
- `docs/adr/README.md`へADR導線を追加した。
- `docs/current-status.md` / `docs/active-issues.md`を更新した。
- `docs/architecture/system-overview.md`へlease / heartbeat / recovery責務を反映した。
- Worker failure recovery runbookを更新した。
- 後続実装Issue #102を作成した。

## Repository Findings

- PR #100で `queued` の起動時回収と条件付きclaimは実装済み。
- 現行 `running` 状態にはlease期限・heartbeat・所有者を示す永続情報がない。
- 現行terminal保存はcompletion guardを条件にするが、expected attempt / attempt idempotency keyを条件に含めていない。
- stale回収で新attemptへ進んだ後、旧Workerの遅延完了を拒否するにはattempt fencingが必要。
- Runnerは子プロセス実行であり、Worker本体からheartbeatを更新できる構成である。

## Technical Decisions

- stale判定には `updated_at` ではなく専用lease期限を利用する。
- lease列候補は `processing_claimed_at` / `processing_heartbeat_at` / `processing_lease_expires_at` とする。
- 既存のattempt idempotency keyをfencing tokenとして利用し、MVPではlease tokenを別途追加しない。
- heartbeat・非終端更新・terminal保存・recoveryはexpected attempt/keyを条件とする。
- stale回収では同一attemptを再利用せず、新attemptと新keyを発行する。
- completion guardとattempt fencingを併用する。
- stale scannerはAPIではなくWorker責務とする。
- leaseがNULLの `legacy_running` は自動回収しない。
- stale scannerより先にlease / heartbeat / fenced completionを実装する。

## Rejected Alternatives

- `updated_at` のみでstale判定する案
- Worker起動時に全runningをqueuedへ戻す案
- stale回収で同じattemptを再利用する案
- completion guardだけで旧Workerの遅延完了を防ぐ案
- APIがstale回収後に直接採点する案
- MVPでlease tokenとattempt keyを二重管理する案

## Risks

- heartbeat遅延による誤回収
- 複数scannerによる回収競合
- 旧Workerの遅延heartbeat・完了保存
- migration直後のlegacy running誤回収
- 大量staleの一斉再投入
- feature flag有効化順序の誤り

## Remaining Tasks

- docs validationを含むCIを確認する。
- PRを作成してレビュー可能状態へする。
- PR merge後にIssue #101とLinear MIZ-25を完了へ更新する。
- merge後にbranch cleanupを確認する。
- 後続Issue #102でlease / heartbeat / fenced completionを実装する。
- stale scanner / recovery transactionはIssue #102完了後に別Issueへ分離する。

## Suggested Next Actions

1. Issue #101のdocs-only PRを作成する。
2. CIでdocs validation・既存品質ゲートの回帰がないことを確認する。
3. merge後、Issue #102へ着手する。

## AI Prompts Used

- `docs/ai-prompts/2026-07-22-issue-101-stale-running-recovery-design-codex.md`

## Handoff

- `docs/handoff/2026-07-22-issue-101-stale-running-recovery-design-handoff.md`
