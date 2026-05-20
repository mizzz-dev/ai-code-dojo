# AI Prompt Log: 2026-05-20 Issue #83

## 目的
- Retry state machine の状態語彙と状態遷移を docs-only で確定する。
- 後続の idempotency key / completion guard / DB拡張 / queue本格運用 の前提境界を固定する。

## 指示要約
- 最優先ルール: `docs/ai-protocol/PROMPT.txt` を遵守。
- `queued/running/retry_pending/infra_failed/passed/failed` の定義と遷移を明記する。
- completion guard を状態として持つか保存制約として扱うかを決定する。
- learner-safe と internal/admin の境界を整理する。
- docs-only の最小差分で、実装・DB・auth・infra 変更は行わない。

## 生成物
- `docs/reports/2026-05-20-retry-state-machine-state-vocabulary-decision.md`
- `docs/current-status.md`
- `docs/active-issues.md`
- `docs/logs/2026-05-20-issue-83-retry-state-machine-state-vocabulary.md`
- `docs/ai-prompts/2026-05-20-issue-83-retry-state-machine-state-vocabulary-codex.md`
- `docs/handoff/2026-05-20-issue-83-retry-state-machine-state-vocabulary-handoff.md`
