# active-issues（正本）

最終更新: 2026-05-18

## この文書の目的
進行中/未解決課題を、優先順位と依存関係付きで管理する。

## 優先度定義
- P0: セキュリティ/可用性/学習継続を阻害
- P1: 直近スプリントで解決すべき重要課題
- P2: 改善課題（計画的に対応）

## 進行中Issue

- #71 post Issue #68 docs同期（Source of Truth整合）
  - 優先度: P1
  - 状態: Open
  - 位置づけ: Issue #68 / PR #69 / PR #70 完了後に、正本 docs 側の状態不整合を是正する同期タスク。
  - ゴール: `docs/current-status.md` と `docs/active-issues.md` が GitHub 側完了状態（Issue #68 closed、PR #70 merged）と一致し、次タスクを1件に絞って handoff 可能な状態にする。
  - 非目的（このIssueでは実施しない）: runner/Worker 本体変更、hidden tests 仕様変更、DB schema/migration/seed変更、auth/admin実装変更、UI変更、infra変更。

## Recently Completed

### #68 timeout/runtime failure 経路で hidden由来文字列が learner-safe 返却に混入しないことを integration/E2E test で保証
- 優先度: P1
- 状態: 完了
- 完了日: 2026-05-18
- 成果物: `tests/integration/api-flow.test.mjs` / `docs/logs/2026-05-18-issue-68-timeout-runtime-failure-hidden-leak-test.md` / `docs/logs/2026-05-18-issue-68-timeout-runtime-failure-hidden-leak-test-followup.md` / `docs/handoff/2026-05-18-issue-68-timeout-runtime-failure-hidden-leak-test-followup-handoff.md`。
- 補足: PR #69 のレビュー指摘（構文エラー経路依存）を PR #70 で follow-up 修正し、隔離実行経路を通す検証に更新。

### #66 learner-safe 返却で `result.internal` / `result.logs` の非露出を integration test で保証
- 優先度: P1
- 状態: 完了
- 完了日: 2026-05-18
- 成果物: `tests/integration/api-flow.test.mjs` / `docs/handoff/2026-05-18-issue-66-learner-safe-internal-logs-integration-test-handoff.md`。

### #64 hidden tests / internal artifact / learner-safe レスポンス境界レビュー
- 優先度: P1
- 状態: 完了
- 完了日: 2026-05-18
- 成果物: `docs/reports/2026-05-18-hidden-tests-artifact-boundary-review.md` / `docs/risks/2026-05-18-hidden-tests-artifact-boundary-risks.md` / `docs/runbooks/2026-05-18-hidden-tests-artifact-boundary-runbook.md` / `docs/handoff/2026-05-18-issue-64-hidden-tests-artifact-boundary-review-handoff.md`。

### #62 SIGKILL escalation unit test flakiness 対応（local-only / non-production）
- 優先度: P2
- 状態: 完了
- 完了日: 2026-05-17
- 成果物: `tests/unit/worker-isolation-poc.test.mjs` / `docs/handoff/2026-05-17-issue-62-sigkill-test-flakiness-handoff.md`。
