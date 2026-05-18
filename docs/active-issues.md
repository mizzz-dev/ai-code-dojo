# active-issues（正本）

最終更新: 2026-05-18

## この文書の目的
進行中/未解決課題を、優先順位と依存関係付きで管理する。

## 優先度定義
- P0: セキュリティ/可用性/学習継続を阻害
- P1: 直近スプリントで解決すべき重要課題
- P2: 改善課題（計画的に対応）

## 進行中Issue

- #73 post Issue #71 docs同期漏れ防止チェックリスト固定化
  - 優先度: P1
  - 状態: Open（In Progress）
  - 位置づけ: PR #72 merge / Issue #71 close 後に発生した Source of Truth 不整合の再発防止として、merge後処理の docs 同期チェックリストをリポジトリ内 runbook に固定化する。
  - ゴール: Issue/PR 完了時に `current-status` / `active-issues` / `logs` / `ai-prompts` / `handoff` の同期が漏れない再利用可能手順を整備し、監査可能な運用にする。
  - 非目的（このIssueでは実施しない）: runner/Worker 本体変更、hidden tests 仕様変更、DB schema/migration/seed変更、auth/admin実装変更、API/UI/infra変更、challenge 既存version上書き。

## Recently Completed

### #71 post Issue #68 docs同期（Source of Truth整合）
- 優先度: P1
- 状態: 完了
- 完了日: 2026-05-18
- 成果物: `docs/current-status.md` / `docs/active-issues.md` / `docs/logs/2026-05-18-issue-71-post-issue-68-docs-sync.md` / `docs/handoff/2026-05-18-issue-71-post-issue-68-docs-sync-handoff.md` / `docs/ai-prompts/2026-05-18-issue-71-post-issue-68-docs-sync-codex.md`。
- 補足: PR #72 merged / Issue #71 closed を受け、次タスクとして Issue #73（merge後 docs 同期漏れ防止チェックリスト固定化）へ接続。

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
