# active-issues（正本）

最終更新: 2026-05-19

## この文書の目的
進行中/未解決課題を、優先順位と依存関係付きで管理する。

## 優先度定義
- P0: セキュリティ/可用性/法令順守を阻害
- P1: 直近スプリントで解決すべき重要課題
- P2: 改善課題（計画的に対応）

## 進行中Issue

- #77 Source of Truth 復旧 + Retry state machine/idempotency ADR候補整理
  - 優先度: P1
  - 状態: Open（reopened）
  - 目的:
    - `docs/current-status.md` / `docs/active-issues.md` を ai-code-dojo 文脈へ復旧
    - Retry state machine / idempotency key / completion guard を docs-only で整理
  - 非目的:
    - runner/Worker/queue実装変更
    - DB schema/migration/seed変更
    - auth/admin/API/UI/infra変更

## Recently Completed

### #75 （完了済み）
- 優先度: P1
- 状態: Closed / Completed
- 完了日: 2026-05-18
- 関連資料:
  - `docs/reports/2026-05-18-worker-failure-retry-policy.md`
  - `docs/runbooks/2026-05-18-worker-failure-recovery-runbook.md`
  - `docs/handoff/2026-05-18-issue-75-worker-failure-retry-policy-handoff.md`
- 反映内容: Worker障害時の再試行可否、停止条件、監査ログ最小要件を docs-only で整理。

## Next Issue Candidates

1. Retry state machine の実装化に向けた状態遷移確定Issue（P1候補）
2. idempotency key / completion guard 導入時のDB拡張検討Issue（P1候補）
3. queue本格運用（visibility timeout / DLQ / backoff）設計Issue（P1候補）

## Branch Cleanup

- PR #78 の head branch 削除状態は GitHub 上で最終確認する。
- docs同期作業時点では、branch cleanup 結果を repository 内から確証できないため「確認保留」とする。
