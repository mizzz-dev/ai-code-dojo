# Issue #109 queue運用設計 作業ログ

## Summary

PR #108 / Issue #105のmerge後処理を確認し、次のP1として現行HTTP queueと将来外部queueのvisibility timeout・DLQ・backoff運用方針をdocs-onlyで確定した。

## Current PR / Issue

- Completed Issue: #105
- Merged PR: #108
- Current Issue: #109
- Issue URL: `https://github.com/mizzz-ivr/ai-code-dojo/issues/109`
- Current PR: #110
- PR URL: `https://github.com/mizzz-ivr/ai-code-dojo/pull/110`
- Branch: `docs/queue-operations-design`
- Repository canonical name: `mizzz-ivr/ai-code-dojo`
- Notion: `https://app.notion.com/p/3a67322f39fa81c0bd11c9965981d005`

## Completed Tasks

- PR #108がmerged、Issue #105がClosed / Completedであることを確認した。
- PR #108のhead branchがbranch検索で見つからず、削除済み相当であることを確認した。
- Repository ownerが `mizzz-dev` から `mizzz-ivr` へ変更されていることを確認した。
- queue運用に使える既存open Issueがないことを確認し、Issue #109を作成した。
- 現行API→Worker HTTP enqueue、Worker 202受理、DB conditional claim、processing lease、stale scannerを確認した。
- queue deliveryとDB fencingの責務境界を詳細設計レポート・ADRとして記録した。
- transport retryとgrading attempt retryを分離した。
- message contract、ack、visibility timeout、backoff、DLQ、replay、retention、observabilityを定義した。
- transactional outboxを将来推奨構成として整理した。
- 現行HTTP改善と外部queue移行を段階Issueへ分割した。
- current-status / active-issues / system-overview / runbook / ADR index / reports indexを更新した。
- PR #110を作成し、Ready for reviewへ変更した。
- Linear MIZ-34をIssue #105完了に合わせてDoneへ更新した。
- Issue #109のLinear新規mirror作成を試行したが、workspace無料Issue上限により作成できなかった。
- NotionにIssue #109の設計進捗ページを作成した。

## Repository Findings

- APIはsubmissionをSQLiteへ保存後、Worker `POST /jobs`へ同期HTTPでenqueueする。
- Workerの202はprocess内受理であり、durable queueへの保存・ackではない。
- enqueue失敗時もDB上にqueued行が残り、Worker起動時回収が復旧経路となる。
- duplicate deliveryはDB conditional claimで一件だけrunningへ進める。
- running所有権はprocessing lease / heartbeatで管理する。
- stale runningはnew attempt / new keyとして回収する。
- terminal保存はcompletion guardで一意化する。
- 現行queueにはdurable message、ack、visibility timeout、delivery count、backoff、DLQがない。

## Technical Decisions

- delivery semanticsはat-least-onceを前提とする。
- exactly-onceを前提にしない。
- queue messageはschema version、submission ID、attempt、attempt key、optional correlation IDに限定する。
- code、hidden tests、secretをqueue / DLQ / logsへ含めない。
- HTTP 202はbest effort受理であり、durable enqueueと区別する。
- consumer ackはDB状態遷移・安全なno-op確認後に行う。
- queue visibility timeoutはavailability、DB processing leaseはcorrectnessを担う。
- 外部queue導入後もattempt fencing / completion guardを維持する。
- transport retryではattemptを増やさない。
- application retryだけがnew attempt / new keyを発行する。
- backoffはtransport / applicationで別設定にする。
- DLQとsubmission statusを分離する。
- DLQ replay前にDB current stateを再検証する。
- 外部queue導入時はtransactional outboxを推奨する。

## Rejected Alternatives

- exactly-once delivery前提
- queue messageへ提出コード・testsを含める
- message受信直後のack
- redeliveryごとのattempt increment
- 外部queue導入後のDB fencing削除
- DLQをsubmission statusとして表現
- 製品選定と本番実装を同一PRへ混在

## Risks

- DB / queue dual-write不整合
- duplicate delivery
- poison messageによるretry loop
- visibility timeout誤設定
- retry storm・コスト増加
- DLQの内部情報長期保存
- HTTP / external queue併存期間の二重配送
- stale scannerとqueue redeliveryの同時発生
- Linear新規mirrorを作成できず、GitHub IssueとRepository docsへの依存が高い

## Test Results

PR #110のdocs反映済みheadで以下を確認した。

- docs validation: Success
- lint: Success
- typecheck: Success
- unit test: Success
- integration test: Success
- schema validation: Success
- build: Success

Linear / Notion同期結果を反映した最終headでも同じ品質ゲートを再確認する。

コード・schema変更は行っていないが、既存app-qualityを通してdocs変更が既存品質ゲートを壊していないことを確認した。

## Remaining Tasks

- 最終headのdocs validation / app-qualityを確認する。
- PR #110 merge後にIssue #109をClosedへ同期する。
- merge後にbranch cleanupを確認する。
- 後続P1-1 queue port / message contract / HTTP adapter Issueを作成する。
- Linear workspaceのIssue上限解消後、必要ならIssue #109のmirrorを作成する。

## Suggested Next Actions

1. Issue #109のdocs-only PR #110をレビュー・mergeする。
2. 後続P1-1としてqueue port / message contract / HTTP adapter整理Issueを作成する。
3. transport observabilityを別Issueで実装する。
4. application retry backoff seamを別Issueで実装する。
5. external queue / outbox製品選定は別ADR・PoCへ分離する。

## AI Prompts Used

- `docs/ai-prompts/2026-07-23-issue-109-queue-operations-design-codex.md`

## Handoff

- `docs/handoff/2026-07-23-issue-109-queue-operations-design-handoff.md`
