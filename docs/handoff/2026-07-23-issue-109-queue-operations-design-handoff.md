# Issue #109 Handoff

## Summary

現行HTTP queueと将来外部queueについて、delivery / ack / visibility timeout / retry / backoff / DLQ / replay / observabilityの責務境界をdocs-onlyで確定した。

## Current State

- Repository: `mizzz-ivr/ai-code-dojo`
- GitHub Issue #105: Closed / Completed
- GitHub PR #108: Merged
- GitHub Issue #109: Open / In Progress
- GitHub PR #110: Ready for review / Mergeable
- Branch: `docs/queue-operations-design`
- Linear MIZ-34: Done
- Linear Issue #109 mirror: workspace無料Issue上限により未作成
- Notion: `https://app.notion.com/p/3a67322f39fa81c0bd11c9965981d005`

## Repository Rename

- 旧full name: `mizzz-dev/ai-code-dojo`
- 現在のcanonical full name: `mizzz-ivr/ai-code-dojo`
- GitHubは旧URLをredirectするが、正本docsの現行参照先は新full nameへ更新する。
- historical logs / PR本文の旧URLは履歴保全のため一括変更しない。

## Documents Added

- `docs/reports/2026-07-23-queue-operations-visibility-dlq-backoff-design.md`
- `docs/adr/2026-07-23-queue-delivery-and-db-fencing-boundary.md`
- `docs/logs/2026-07-23-issue-109-queue-operations-design.md`
- `docs/ai-prompts/2026-07-23-issue-109-queue-operations-design-codex.md`
- `docs/handoff/2026-07-23-issue-109-queue-operations-design-handoff.md`

## Documents Updated

- `docs/current-status.md`
- `docs/active-issues.md`
- `docs/architecture/system-overview.md`
- `docs/runbooks/2026-05-18-worker-failure-recovery-runbook.md`
- `docs/adr/README.md`
- `docs/reports/README.md`

## Key Findings

- APIはsubmission保存後にWorker `POST /jobs`へ同期HTTP enqueueする。
- Workerの202はprocess内受理であり、durable queue保存・ackではない。
- enqueue通知喪失時はDB queued行とWorker起動時回収が復旧手段となる。
- duplicate deliveryはDB conditional claimで無害化できる。
- running所有権はprocessing lease / heartbeatが担う。
- stale runningはnew attempt / new keyとして回収する。
- terminal保存はcompletion guardで一意化する。
- 現行HTTP queueにはvisibility timeout、delivery count、backoff、DLQがない。

## Key Decisions

- delivery semanticsはat-least-onceを前提とする。
- exactly-onceへ依存しない。
- queue messageは最小参照情報だけを保持する。
- code、hidden tests、secretをqueue / DLQ / logsへ含めない。
- HTTP 202とdurable enqueueを区別する。
- ackはDB永続状態遷移または安全なno-op確認後に行う。
- queue visibility timeoutはavailability、DB lease / fencing / completion guardはcorrectnessを担う。
- external queue導入後もDB側防御を維持する。
- transport retryではgrading attemptを増やさない。
- application retryだけがnew attempt / new keyを発行する。
- DLQとsubmission statusを分離する。
- external queue導入時はtransactional outboxを推奨する。

## Recommended Defaults for Later Implementation

### transport retry

- base delay: 1秒
- multiplier: 2
- max delay: 30秒
- max delivery count: 5
- jitter: full jitter

### application retry

- existing `WORKER_MAX_INFRA_RETRY_ATTEMPTS`をattempt上限の正本とする。
- base delay候補: 5秒
- max delay候補: 60秒
- jitter: full jitter

### DLQ

- retention初期候補: 14日
- same-attempt replayはqueued / guard未設定 / attempt-key一致のみ
- infra_failedからの手動再実行はnew attempt作成として別操作

値は後続実装Issueで環境設定として確定する。

## Follow-up Issue Split

### P1-1 queue port / message contract / HTTP adapter

- behavior changeなし
- producer / consumer contract
- schema validation
- contract test

### P1-2 queue transport observability

- enqueue / delivery / claim / retry / DLQ metrics
- structured internal logs
- alerts / runbook

### P1-3 application retry backoff seam

- immediate retryをdelay注入可能にする。
- config / jitter / injectable clock
- existing attempt max維持

### P1-4 external queue / outbox PoC

- product comparison
- transactional outbox
- visibility / ack / DLQ contract test

### P2 DLQ ops

- replay / purge
- ops authorization
- audit / retention / incident integration

## Test Results

PR #110のdocs反映済みheadで以下を確認済み。

- docs validation: Success
- lint: Success
- typecheck: Success
- unit test: Success
- integration test: Success
- schema validation: Success
- build: Success

Linear / Notion同期結果を反映した最終headでも再確認すること。

## Review Focus

- queueとDBの責務が混同されていないか。
- transport retryとgrading attempt retryが分離されているか。
- ack条件がDB永続化後になっているか。
- external queue導入後もattempt fencing / completion guardを維持しているか。
- message / DLQ / logsの秘匿範囲が十分か。
- transactional outboxの導入順が妥当か。
- rollbackでHTTP adapterへ戻せるか。
- 製品選定・コード実装がIssue #109へ混在していないか。

## Known Risks

- DB / queue dual-write不整合
- duplicate delivery
- poison message retry loop
- visibility timeout誤設定
- retry storm / cost増加
- DLQ内部情報長期保存
- HTTP / external queue併存時の二重配送
- stale scannerとqueue redeliveryの同時発生
- Linear mirrorがないため、GitHub IssueとRepository docsが唯一の進捗正本となる

## External Sync

- Linear MIZ-34をIssue #105完了に合わせてDoneへ更新済み。
- Issue #109の新規Linear mirror作成は無料Issue上限で失敗した。
- NotionにIssue #109の設計進捗ページを作成済み。
- Linear上限解消後にmirrorが必要な場合はGitHub Issue #109 / PR #110を参照して作成する。

## Remaining Tasks

1. 最終headのdocs validation / app-qualityを確認する。
2. PR #110をレビュー・mergeする。
3. merge後にIssue #109をClosedへ同期する。
4. merge後にbranch cleanupを確認する。
5. next P1-1 Issueを作成する。

## Handoff Notes

- `docs/ai-protocol/PROMPT.txt`を最優先とする。
- APIで提出コードを直接実行しない。
- hidden tests詳細、提出コード本文、secret、環境変数値をIssue / PR / docs / logsへ記載しない。
- challengeはversion追加方式を維持する。
- Issue #109はdocs-onlyであり、queue実装・schema変更を混在させない。
