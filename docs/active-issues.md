# active-issues（正本）

最終更新: 2026-05-18

## この文書の目的
進行中/未解決課題を、優先順位と依存関係付きで管理する。

## 優先度定義
- P0: セキュリティ/可用性/学習継続を阻害
- P1: 直近スプリントで解決すべき重要課題
- P2: 改善課題（計画的に対応）

## 進行中Issue

- #75 Worker障害時の採点停止・再試行・失敗扱い・復旧方針の設計/運用ドキュメント化
  - 優先度: P1
  - 状態: Open（In Progress）
  - 位置づけ: Issue #73 完了後の Source of Truth 不整合を是正し、PR #74 で追加された post-merge docs sync checklist を実運用で適用したうえで、次の安全性・運用性強化として Worker failure policy を実装前に文書化する。
  - ゴール: Worker到達不能/実行中断/timeout/runtime failure/infrastructure failure の分類、採点停止条件、再試行可否と最大試行回数、idempotency 方針、learner-safe 境界、admin/internal ログ粒度、queue/DB 本格運用への移行前提を整理する。
  - 非目的（このIssueでは実施しない）: runner/Worker本体変更、queue実装変更、DB schema/migration/seed変更、hidden tests仕様変更、auth/admin実装変更、API/UI/infra変更、challenge既存version上書き。

## Recently Completed

### #73 post Issue #71 docs同期漏れ防止チェックリスト固定化
- 優先度: P1
- 状態: 完了
- 完了日: 2026-05-18
- 成果物: `docs/runbooks/2026-05-18-post-merge-docs-sync-checklist.md` / `docs/current-status.md` / `docs/active-issues.md` / `docs/logs/2026-05-18-issue-73-post-issue-71-docs-sync-checklist.md` / `docs/ai-prompts/2026-05-18-issue-73-post-issue-71-docs-sync-checklist-codex.md` / `docs/handoff/2026-05-18-issue-73-post-issue-71-docs-sync-checklist-handoff.md`。
- 補足: PR #74 merged / Issue #73 closed を起点に、merge後 docs 同期チェックリスト運用を標準手順化。

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
