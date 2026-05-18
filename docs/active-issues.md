# active-issues（正本）

最終更新: 2026-05-18

## この文書の目的
進行中/未解決課題を、優先順位と依存関係付きで管理する。

## 優先度定義
- P0: セキュリティ/可用性/学習継続を阻害
- P1: 直近スプリントで解決すべき重要課題
- P2: 改善課題（計画的に対応）

## 進行中Issue

- #66 learner-safe 返却で `result.internal` / `result.logs` の非露出を integration test で保証
  - 優先度: P1
  - 状態: Open
  - 位置づけ: Issue #64 のレビュー完了後 follow-up（HT-64-01 の回帰検知自動化）。
  - ゴール: `GET /api/submissions/:id` の learner/guest 返却で `result.internal` と `result.logs` が非露出であることを否定系 integration test で保証し、admin 境界の既存仕様を壊さない。
  - 非目的（このIssueでは実施しない）: 本番適用、runner/Worker全面置換、DB schema/migration/seed変更、auth/admin実装変更、UI変更、durable queue導入。

## Recently Completed

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

### #60 container runtime kill escalation hardening（local-only / non-production）
- 優先度: P1
- 状態: 完了
- 完了日: 2026-05-15
- 成果物: `apps/worker/src/services/container-runtime-poc.mjs` / `docs/handoff/2026-05-15-issue-60-container-runtime-kill-escalation-handoff.md`。
