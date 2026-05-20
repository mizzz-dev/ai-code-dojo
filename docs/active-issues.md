# active-issues（正本）

最終更新: 2026-05-20

## この文書の目的
進行中/未解決課題を、優先順位と依存関係付きで管理する。

## 優先度定義
- P0: セキュリティ/可用性/法令順守を阻害
- P1: 直近スプリントで解決すべき重要課題
- P2: 改善課題（計画的に対応）

## 進行中Issue

- （なし）

## Recently Completed

### #77 （完了済み）
- 優先度: P1
- 状態: Closed / Completed
- 完了日: 2026-05-20（PR #80 merged 後の正本docs同期完了）
- 関連資料:
  - `docs/reports/2026-05-19-retry-state-machine-idempotency-adr-candidate.md`
  - `docs/logs/2026-05-19-issue-77-source-of-truth-recovery-and-idempotency-adr.md`
  - `docs/handoff/2026-05-19-issue-77-source-of-truth-recovery-and-idempotency-adr-handoff.md`
- 反映内容: Source of Truth 復旧、欠落ログ補完、Retry state machine / idempotency key / completion guard のADR候補整理を docs-only で完了。

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

1. Retry state machine の状態遷移確定Issue（P1・次着手推奨）
   - 優先理由: idempotency key / completion guard / queue運用拡張の前提となる状態語彙を先に固定し、後続Issueの差分境界を明確化するため。

## Branch Cleanup

- PR #78 の head branch 削除状態は GitHub 上で最終確認する。
- docs同期作業時点では、branch cleanup 結果を repository 内から確証できないため「確認保留」とする。
