# active-issues（正本）

最終更新: 2026-05-22（Issue #93反映）

## この文書の目的
進行中/未解決課題を、優先順位と依存関係付きで管理する。

## 優先度定義
- P0: セキュリティ/可用性/法令順守を阻害
- P1: 直近スプリントで解決すべき重要課題
- P2: 改善課題（計画的に対応）

## 進行中Issue

- （現在の進行中P1はなし。次着手は retry state machine 本統合を想定）

## Recently Completed

### #93 （完了済み）
- 優先度: P1
- 状態: Closed / Completed
- 完了日: 2026-05-22
- 関連資料:
  - `docs/logs/2026-05-22-issue-93-completion-guard-retry-compat.md`
  - `docs/ai-prompts/2026-05-22-issue-93-completion-guard-retry-compat-codex.md`
  - `docs/handoff/2026-05-22-issue-93-completion-guard-retry-compat-handoff.md`
- 反映内容: completion guard の終端保存一意化を維持したまま、terminal update no-op時返却をDB最新行へ修正。`startRetryAttempt` で `completion_guard_at` を解除し、retry attempt が Worker で即時returnされないよう互換性を回復。

### #91 （完了済み）
- 優先度: P1
- 状態: Closed / Completed
- 完了日: 2026-05-22
- 関連資料:
  - `docs/logs/2026-05-22-issue-91-completion-guard.md`
  - `docs/ai-prompts/2026-05-22-issue-91-completion-guard-codex.md`
  - `docs/handoff/2026-05-22-issue-91-completion-guard-handoff.md`
- 反映内容: submission単位 completion guard を実装。終端結果（passed/failed/infra_failed）保存を一度だけ許可し、後続終端保存を idempotent no-op 化。Workerの重複完了経路も無害化。


### #89 （完了済み）
- 優先度: P1
- 状態: Closed / Completed
- 完了日: 2026-05-21
- 関連資料:
  - `docs/logs/2026-05-21-issue-89-sqlite-attempt-migration-order.md`
  - `docs/ai-prompts/2026-05-21-issue-89-sqlite-attempt-migration-order-codex.md`
  - `docs/handoff/2026-05-21-issue-89-sqlite-attempt-migration-order-handoff.md`
- 反映内容: SQLite既存DBの `submissions` 旧スキーマで、attempt列追加前にUNIQUE index作成が走る順序不整合を解消。列追加後にindex作成するよう migration を整理し、再現unit testを追加。

### #87 （完了済み）
- 優先度: P1
- 状態: Closed / Completed
- 完了日: 2026-05-21
- 関連資料:
  - `docs/logs/2026-05-21-issue-87-idempotency-key-implementation.md`
  - `docs/ai-prompts/2026-05-21-issue-87-idempotency-key-implementation-codex.md`
  - `docs/handoff/2026-05-21-issue-87-idempotency-key-implementation-handoff.md`
- 反映内容: `submission + attempt` 単位の idempotency key 相当を API/DB/Worker に実装。初回attempt=1、retry向けattempt increment関数、Workerのattempt/key照合を追加。completion guard は未実装で分離維持。


### #85 （完了済み）
- 優先度: P1
- 状態: Closed / Completed（docs-only）
- 完了日: 2026-05-20
- 関連資料:
  - `docs/reports/2026-05-20-duplicate-grading-prevention-design.md`
  - `docs/logs/2026-05-20-issue-85-duplicate-grading-prevention-design.md`
  - `docs/ai-prompts/2026-05-20-issue-85-duplicate-grading-prevention-design-codex.md`
  - `docs/handoff/2026-05-20-issue-85-duplicate-grading-prevention-design-handoff.md`
- 反映内容: 重複ジョブ投入・重複実行・重複完了の定義、idempotency key 相当（attempt単位）と completion guard（submission終端一意化）の責務分離、API/Worker/DB 境界を整理。

### #83 （完了済み）
- 優先度: P1
- 状態: Closed / Completed（docs-only）
- 完了日: 2026-05-20
- 関連資料:
  - `docs/reports/2026-05-20-retry-state-machine-state-vocabulary-decision.md`
  - `docs/logs/2026-05-20-issue-83-retry-state-machine-state-vocabulary.md`
  - `docs/handoff/2026-05-20-issue-83-retry-state-machine-state-vocabulary-handoff.md`
- 反映内容: Retry state machine の状態語彙と状態遷移を確定し、`retry_pending` / `infra_failed` の使い分け、terminal states、completion guard（状態ではなく保存制約）を整理。

### #77 （完了済み）
- 優先度: P1
- 状態: Closed / Completed
- 完了日: 2026-05-20（PR #80 merged 後の正本docs同期完了）
- 関連資料:
  - `docs/reports/2026-05-19-retry-state-machine-idempotency-adr-candidate.md`
  - `docs/logs/2026-05-19-issue-77-source-of-truth-recovery-and-idempotency-adr.md`
  - `docs/handoff/2026-05-19-issue-77-source-of-truth-recovery-and-idempotency-adr-handoff.md`
- 反映内容: Source of Truth 復旧、欠落ログ補完、Retry state machine / idempotency key / completion guard のADR候補整理を docs-only で完了。

## Next Issue Candidates

1. retry state machine 本統合Issue（P1・次着手推奨）
   - 優先理由: `retry_pending -> queued` の実導線と attempt increment を一貫動作させるため。
2. queue運用改善Issue（P1）
   - 優先理由: visibility timeout / DLQ / backoff を運用要件に合わせて強化するため。
3. 監査ログ整備Issue（P2）
   - 優先理由: completion guard の重複完了判定を必要最小限の監査情報として可視化するため。

## Branch Cleanup

- PR #78 の head branch 削除状態は GitHub 上で最終確認する。
- docs同期作業時点では、branch cleanup 結果を repository 内から確証できないため「確認保留」とする。
