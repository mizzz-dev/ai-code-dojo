# 2026-05-19 Issue #77 handoff（Source of Truth復旧 + Idempotency ADR候補）

## 完了したこと
- `docs/current-status.md` を ai-code-dojo 文脈へ復旧し、Issue #75完了/Issue #77進行中を反映。
- `docs/active-issues.md` から混入文脈を除去し、Issue #77を進行中、Issue #75をRecently Completedへ整理。
- `docs/reports/2026-05-19-retry-state-machine-idempotency-adr-candidate.md` を新規作成し、Retry state machine / idempotency key / completion guard のADR候補を整理。
- 作業ログ・AI prompt log を保存。

## 未実施（意図的に非対象）
- runner/Worker/queue実装変更
- DB schema/migration/seed 変更
- auth/admin/API/UI/infra 変更

## 次アクション提案
1. ADR候補をレビューし、採用案の範囲（状態遷移・重複完了防止・監査ログ）を確定。
2. DB拡張要否（retry_count / idempotency_key / completion_guard）を別Issue化。
3. queue運用論点（visibility timeout / DLQ / backoff）を別Issueで設計確定。


## 関連ログ
- `docs/logs/2026-05-19-issue-77-source-of-truth-recovery-and-idempotency-adr.md`
