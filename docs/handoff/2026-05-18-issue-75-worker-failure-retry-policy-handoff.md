# 2026-05-18 Issue #75 handoff（Worker failure retry policy）

## このhandoffの目的
Issue #73 完了後の docs 正本整合を回復しつつ、Worker障害時ポリシーを実装前の運用設計として引き継ぐ。

## 完了したこと
- `docs/current-status.md` で Issue #73 を完了反映し、Issue #75 を進行中として明示。
- `docs/active-issues.md` で Issue #73 を Recently Completed へ移動し、Issue #75 を進行中Issueに設定。
- `docs/runbooks/2026-05-18-post-merge-docs-sync-checklist.md` に基づく適用結果を `docs/logs/2026-05-18-issue-75-worker-failure-retry-policy.md` に記録。
- Worker障害時ポリシーを以下に整理:
  - `docs/reports/2026-05-18-worker-failure-retry-policy.md`
  - `docs/runbooks/2026-05-18-worker-failure-recovery-runbook.md`

## 重要な確認ポイント
- API本体で提出コードを直接実行しない不変条件を維持すること。
- hidden tests 実データは learner/API/docs/log に露出しないこと。
- retry と failure確定の境界は learner-safe と監査可能性を優先して設計すること。
- DB schema/migration/seed 変更は別Issue/ADRで切り出すこと。

## 次アクション（提案）
1. Retry state machine と idempotency key を ADR 候補として起票。
2. queue本格運用（visibility timeout/DLQ/backoff）要件を別Issue化。
3. submission状態遷移と監査ログ最小要件を実装計画へ落とし込む。
