# current-status（正本）

最終更新: 2026-05-21（Issue #87反映）

## この文書の目的
「今どこまで実装済みか」を短時間で把握するための現況スナップショット。

## 今の状態（要約）
- ai-code-dojo は、AI生成コードのバグ修正・機能追加を実務フローで学ぶ練習プラットフォームとしてMVP運用を継続中。
- docs正本（`current-status` / `active-issues`）は ai-code-dojo 文脈を Source of Truth とし、他プロダクト文脈の混入を禁止する。
- Issue #85 / PR #86 で確定した設計を前提に、Issue #87 で attempt単位 idempotency key 相当（`submission + attempt`）を API/DB/Worker へ最小実装した。
- 不変条件（API本体で提出コードを直接実行しない、hidden testsは内部専用、challengeはversion追加方式）を維持する。

## 稼働中の運用基盤
- Canonical Source: `README.md` / `docs/project-overview.md` / `docs/current-status.md` / `docs/active-issues.md` / `docs/architecture/system-overview.md`
- 採点系は API→Worker 非同期連携を維持し、API直接実行は禁止。
- learner-safe / internal 境界を維持し、hidden tests 詳細は学習者向け返却禁止。
- PR本文、レビュー文面、運用docsは日本語で統一する。

## 直近完了事項
- Issue #87（attempt単位 idempotency key 実装）を完了し、初回attempt=1保存、Workerへのattempt/key連携、重複・古いattempt実行抑止を実装した（completion guardは未実装のまま分離維持）。
- Issue #83（Retry state machine 状態語彙・状態遷移確定）を docs-only で完了し、`retry_pending` / `infra_failed` / terminal states / learner-safe 境界 / completion guard の扱いを確定。
- Issue #77（Source of Truth 復旧 + Retry state machine/idempotency ADR候補整理）を完了し、PR #80 merge 後の欠落ログ補完を含めて正本docs同期を完了。
- Issue #75（Worker failure retry policy）完了時に整備した retry 方針・runbook 資産を継続利用可能な状態で維持。

## 優先順位（直近）
1. 次Issue候補（最優先）: completion guard 実装分離Issue（理由: 終端保存の一意化を submission 単位で担保するため）。
2. 次Issue候補: retry state machine への本統合（`retry_pending -> queued` で attempt increment を実導線へ接続）。
3. 次Issue候補: queue運用改善（visibility timeout / DLQ / backoff）。

## branch cleanup 状態
- PR #78 に紐づく作業branchの削除有無は、GitHub UI 上の最終状態確認を maintainer へ引き継ぐ。
- 本作業では repository docs の正本同期を優先し、branch cleanup 実行自体は非対象。

## 参照先
- 進行中Issue: `docs/active-issues.md`
- 設計根拠（Issue #85）: `docs/reports/2026-05-20-duplicate-grading-prevention-design.md`
- 設計根拠（Issue #83）: `docs/reports/2026-05-20-retry-state-machine-state-vocabulary-decision.md`
- runbook: `docs/runbooks/2026-05-18-worker-failure-recovery-runbook.md`
