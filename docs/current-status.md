# current-status（正本）

最終更新: 2026-05-22（Issue #93反映）

## この文書の目的
「今どこまで実装済みか」を短時間で把握するための現況スナップショット。

## 今の状態（要約）
- ai-code-dojo は、AI生成コードのバグ修正・機能追加を実務フローで学ぶ練習プラットフォームとしてMVP運用を継続中。
- docs正本（`current-status` / `active-issues`）は ai-code-dojo 文脈を Source of Truth とし、他プロダクト文脈の混入を禁止する。
- Issue #85 / PR #86 で確定した設計を前提に、Issue #87 の attempt単位 idempotency key 実装、Issue #89 のSQLite既存DB migration順序不整合修正に続き、Issue #91 で submission単位 completion guard を実装した。
- 不変条件（API本体で提出コードを直接実行しない、hidden testsは内部専用、challengeはversion追加方式）を維持する。

## 稼働中の運用基盤
- Canonical Source: `README.md` / `docs/project-overview.md` / `docs/current-status.md` / `docs/active-issues.md` / `docs/architecture/system-overview.md`
- 採点系は API→Worker 非同期連携を維持し、API直接実行は禁止。
- learner-safe / internal 境界を維持し、hidden tests 詳細は学習者向け返却禁止。
- PR本文、レビュー文面、運用docsは日本語で統一する。

## 直近完了事項
- Issue #91（completion guard実装）を完了し、同一submissionの終端結果（passed/failed/infra_failed）保存を一度だけ許可する一意完了制約を導入。重複終端保存は idempotent no-op とし、Worker側でも終端済みsubmissionを無害化する早期returnを追加。
- Issue #93（completion guard retry互換修正）を完了し、terminal update no-op時の返却をDB最新行へ修正。retry attempt開始時の `completion_guard_at` 解除を導入し、Workerの早期returnが正しいretryを阻害しないよう是正。
- Issue #89（SQLite migration順序修正）を完了し、既存DBで `grading_attempt` / `attempt_idempotency_key` 列追加後に index 作成が行われるよう修正。旧スキーマ再現unit testを追加して起動不能リスクを解消。
- Issue #87（attempt単位 idempotency key 実装）を完了し、初回attempt=1保存、Workerへのattempt/key連携、重複・古いattempt実行抑止を実装した（completion guardは未実装のまま分離維持）。
- Issue #83（Retry state machine 状態語彙・状態遷移確定）を docs-only で完了し、`retry_pending` / `infra_failed` / terminal states / learner-safe 境界 / completion guard の扱いを確定。
- Issue #77（Source of Truth 復旧 + Retry state machine/idempotency ADR候補整理）を完了し、PR #80 merge 後の欠落ログ補完を含めて正本docs同期を完了。
- Issue #75（Worker failure retry policy）完了時に整備した retry 方針・runbook 資産を継続利用可能な状態で維持。

## 優先順位（直近）
1. 次Issue候補（最優先）: retry state machine への本統合（`retry_pending -> queued` で attempt increment を実導線へ接続）。
2. 次Issue候補: queue運用改善（visibility timeout / DLQ / backoff）。
3. 次Issue候補: completion guard の運用監査ログ粒度拡張（必要最小限の内部監査情報整備）。

## branch cleanup 状態
- PR #78 に紐づく作業branchの削除有無は、GitHub UI 上の最終状態確認を maintainer へ引き継ぐ。
- 本作業では repository docs の正本同期を優先し、branch cleanup 実行自体は非対象。

## 参照先
- 進行中Issue: `docs/active-issues.md`
- 設計根拠（Issue #85）: `docs/reports/2026-05-20-duplicate-grading-prevention-design.md`
- 設計根拠（Issue #83）: `docs/reports/2026-05-20-retry-state-machine-state-vocabulary-decision.md`
- runbook: `docs/runbooks/2026-05-18-worker-failure-recovery-runbook.md`
