# Issue #113 queue transport observability 作業ログ

## Summary

Issue #111 / PR #112のmerge後処理を確認し、次のP1として現行HTTP queueのenqueue / delivery / claim / retry / recoveryを機微情報なしの構造化eventとして実装した。

## Current PR / Issue

- Completed Issue: #111
- Merged PR: #112
- Current Issue: #113
- Issue URL: `https://github.com/mizzz-ivr/ai-code-dojo/issues/113`
- Current PR: #114
- PR URL: `https://github.com/mizzz-ivr/ai-code-dojo/pull/114`
- Branch: `feat/queue-transport-observability`

## Completed Tasks

- PR #112がmerged、Issue #111がClosed / Completedであることを確認した。
- PR #112のhead branchがbranch検索で見つからず、削除済み相当であることを確認した。
- queue observabilityに使える既存open Issueがないことを確認し、Issue #113を作成した。
- `packages/queue/src/queue-event-logger.mjs`を追加した。
- event nameと出力fieldをallowlist化した。
- stdout / stderrへJSON Linesを出力するloggerを追加した。
- logger sink失敗を業務処理へ伝播しないようにした。
- HTTP enqueue success / failure / contract rejectionをevent化した。
- Worker delivery accepted / rejectedをevent化した。
- conditional claim success / no-opをevent化した。
- heartbeat failure、application retry、queued startup recoveryをevent化した。
- stale recovery candidate / scan結果を同じevent contractへ統一した。
- logger / HTTP producer / Worker integration testを追加・更新した。
- current-status / active-issues / system-overviewを更新した。
- queue observability専用runbookを追加した。
- Draft PR #114を作成した。

## Repository Findings

- 既存HTTP producerはbooleanだけを返し、成功・非2xx・network errorの運用上の区別がログ契約として固定されていなかった。
- Worker `/jobs`は400 / 202を返すが、delivery accepted / rejectedを安定したevent名で記録していなかった。
- conditional claimのno-op理由はruntime上で分岐していたが、運用者が時系列で追える共通eventがなかった。
- stale scannerはconsoleへobjectを出していたが、他のqueue経路とfield / event語彙が統一されていなかった。
- attempt key、code、hidden tests、raw error messageは観測eventへ不要であり、allowlistから除外すべきである。

## Technical Decisions

- queue固有observabilityを`packages/queue`へ置く。
- 一event一JSON objectのJSON Linesとする。
- event nameは定数として固定する。
- context fieldはallowlist方式とし、unknown / nested / non-primitive fieldを出力しない。
- stringは最大256文字に制限する。
- raw error messageを出さず、generalized `reason` / `errorType`だけを記録する。
- attempt idempotency keyはmessage contractには必要だが、event logへは出さない。
- logger sink失敗でenqueue / grading / recoveryを失敗させない。
- empty periodic stale scanはログ量抑制のため出力せず、startup / candidateあり / errorありを記録する。
- metric backend / dashboard / alert本番設定は別Issueへ分離する。

## Rejected Alternatives

- 既存console logを文字列検索で運用する案
  - event名・fieldが安定せず、監視契約として利用できないため不採用。
- request bodyやraw errorをログへ出す案
  - code / hidden tests / secret漏洩リスクがあるため不採用。
- submission IDをmetric labelにする案
  - cardinalityが増加するため不採用。ログ調査fieldとしてのみ扱う。
- 本IssueでPrometheus / OpenTelemetryを導入する案
  - 運用基盤選定と差分が大きくなるため別Issueへ分離。
- observability失敗時に採点を停止する案
  - observabilityはcorrectnessの前提ではないため不採用。

## Risks

- event volume増加によるログ保存コスト。
- submission IDを含む内部ログのアクセス制御不足。
- allowlist追加時のレビュー漏れ。
- empty periodic scanを出さないため、scan livenessはhealth / startup eventと併用が必要。
- 現時点ではmetrics backend / dashboard / alert通知が未実装。
- event loggerの出力先障害は業務処理へ伝播しないため、別途ログ収集基盤のhealth監視が必要。

## Test Results

コード変更時点の初回app-qualityは成功した。

- lint: Success
- typecheck: Success
- unit test: Success
- integration test: Success
- schema validation: Success
- build: Success

正本docs・runbook・ログ反映後の最終headでdocs validationとapp-qualityを再確認する。

## Remaining Tasks

- AIプロンプトログ / handoffを追加する。
- final headのdocs validation / app-qualityを確認する。
- PR #114本文をテスト結果込みで確定する。
- PR #114をReady for reviewへ変更する。
- GitHub Issue #113へ実装・テスト結果をコメントする。
- Linear / Notion同期可否を確認する。

## Suggested Next Actions

1. PR #114をレビュー・mergeする。
2. application retry backoff seamを次のP1として実装する。
3. queue eventをmetrics backend / dashboard / alertへ接続するIssueをP2で進める。
4. external queue / transactional outbox PoCを別Issueで進める。

## AI Prompts Used

- `docs/ai-prompts/2026-07-24-issue-113-queue-transport-observability-codex.md`

## Handoff

- `docs/handoff/2026-07-24-issue-113-queue-transport-observability-handoff.md`
