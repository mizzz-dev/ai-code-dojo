# current-status（正本）

最終更新: 2026-05-19

## この文書の目的
「今どこまで実装済みか」を短時間で把握するための現況スナップショット。

## 今の状態（要約）
- ai-code-dojo は、AI生成コードのバグ修正・機能追加を実務フローで学ぶ練習プラットフォームとしてMVP運用を継続中。
- docs正本（`current-status` / `active-issues`）は ai-code-dojo 文脈を Source of Truth とし、他プロダクト文脈の混入を禁止する。
- Issue #75（Worker障害時再試行方針）は docs-only で完了済み。
- Issue #77 は reopen 済みで進行中。目的は Source of Truth 復旧と、Retry state machine / idempotency key / completion guard のADR候補整理。
- 不変条件（API本体で提出コードを直接実行しない、hidden testsは内部専用、challengeはversion追加方式）を維持する。

## 稼働中の運用基盤
- Canonical Source: `README.md` / `docs/project-overview.md` / `docs/current-status.md` / `docs/active-issues.md` / `docs/architecture/system-overview.md`
- 採点系は API→Worker 非同期連携を維持し、API直接実行は禁止。
- learner-safe / internal 境界を維持し、hidden tests 詳細は学習者向け返却禁止。
- PR本文、レビュー文面、運用docsは日本語で統一する。

## 直近完了事項
- Issue #75（Worker failure retry policy）を完了し、再試行判断・停止条件・監査ログ方針を docs-only で整理。
- `docs/reports/2026-05-18-worker-failure-retry-policy.md` / `docs/runbooks/2026-05-18-worker-failure-recovery-runbook.md` / `docs/handoff/2026-05-18-issue-75-worker-failure-retry-policy-handoff.md` を正本補助資料として整備。

## 優先順位（直近）
1. Issue #77: 正本docsのSource of Truth復旧（混入文脈の除去）
2. Issue #77: Retry state machine / idempotency key / completion guard のADR候補整理（docs-only）
3. 実装着手前に、DB schema/queue運用拡張が必要な論点を別Issueへ分離

## branch cleanup 状態
- PR #78 に紐づく作業branchの削除有無は、GitHub UI 上の最終状態確認を maintainer へ引き継ぐ。
- 本作業では repository docs の正本復旧を優先し、branch cleanup 実行自体は非対象。

## 参照先
- 進行中Issue: `docs/active-issues.md`
- 設計根拠（Issue #75）: `docs/reports/2026-05-18-worker-failure-retry-policy.md`
- runbook: `docs/runbooks/2026-05-18-worker-failure-recovery-runbook.md`
