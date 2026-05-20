# current-status（正本）

最終更新: 2026-05-20

## この文書の目的
「今どこまで実装済みか」を短時間で把握するための現況スナップショット。

## 今の状態（要約）
- ai-code-dojo は、AI生成コードのバグ修正・機能追加を実務フローで学ぶ練習プラットフォームとしてMVP運用を継続中。
- docs正本（`current-status` / `active-issues`）は ai-code-dojo 文脈を Source of Truth とし、他プロダクト文脈の混入を禁止する。
- PR #80 は merged、Issue #77 は Closed / Completed となり、Source of Truth 復旧・欠落ログ補完・Retry state machine / idempotency key / completion guard のADR候補整理は docs-only で完了した。
- 不変条件（API本体で提出コードを直接実行しない、hidden testsは内部専用、challengeはversion追加方式）を維持する。

## 稼働中の運用基盤
- Canonical Source: `README.md` / `docs/project-overview.md` / `docs/current-status.md` / `docs/active-issues.md` / `docs/architecture/system-overview.md`
- 採点系は API→Worker 非同期連携を維持し、API直接実行は禁止。
- learner-safe / internal 境界を維持し、hidden tests 詳細は学習者向け返却禁止。
- PR本文、レビュー文面、運用docsは日本語で統一する。

## 直近完了事項
- Issue #77（Source of Truth 復旧 + Retry state machine/idempotency ADR候補整理）を完了し、PR #80 merge 後の欠落ログ補完を含めて正本docs同期を完了。
- `docs/reports/2026-05-19-retry-state-machine-idempotency-adr-candidate.md` / `docs/logs/2026-05-19-issue-77-source-of-truth-recovery-and-idempotency-adr.md` / `docs/handoff/2026-05-19-issue-77-source-of-truth-recovery-and-idempotency-adr-handoff.md` を正本補助資料として整備。
- Issue #75（Worker failure retry policy）完了時に整備した retry 方針・runbook 資産を継続利用可能な状態で維持。

## 優先順位（直近）
1. 次Issue候補（最優先1件）: Retry state machine の状態遷移確定Issueを起票し、`queued/running/retry_pending/infra_failed/passed/failed` と completion guard の採用語彙を確定する（理由: 実装着手前に状態語彙を固定しないと、API/Worker/DB/監査ログの変更境界が曖昧になり、review可能な最小差分を維持できないため）。

## branch cleanup 状態
- PR #78 に紐づく作業branchの削除有無は、GitHub UI 上の最終状態確認を maintainer へ引き継ぐ。
- 本作業では repository docs の正本同期を優先し、branch cleanup 実行自体は非対象。

## 参照先
- 進行中Issue: `docs/active-issues.md`
- 設計根拠（Issue #77）: `docs/reports/2026-05-19-retry-state-machine-idempotency-adr-candidate.md`
- runbook: `docs/runbooks/2026-05-18-worker-failure-recovery-runbook.md`
