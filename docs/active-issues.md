# active-issues（正本）

最終更新: 2026-05-20（Issue #85反映）

## この文書の目的
進行中/未解決課題を、優先順位と依存関係付きで管理する。

## 優先度定義
- P0: セキュリティ/可用性/法令順守を阻害
- P1: 直近スプリントで解決すべき重要課題
- P2: 改善課題（計画的に対応）

## 進行中Issue

- （なし）

※ Issue #85 は docs-only 完了済み（2026-05-20）。

## Recently Completed

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

1. idempotency key 実装Issue（P1・次着手推奨）
   - 優先理由: Issue #85 で確定した attempt 単位識別の方針を API/Worker/DB で実装担保するため。
2. completion guard 実装Issue（P1）
   - 優先理由: 終端状態（passed/failed/infra_failed）の一意完了制約を実装で担保し、重複完了を防止するため。
3. DB拡張Issue（P2）
   - 優先理由: attempt / idempotency key / guard 判定を保持するカラム・制約を段階導入し、監査ログと整合させるため。

## Branch Cleanup

- PR #78 の head branch 削除状態は GitHub 上で最終確認する。
- docs同期作業時点では、branch cleanup 結果を repository 内から確証できないため「確認保留」とする。
