# AI Prompt Log: 2026-05-19 Issue #77

## 目的
- 正本docsから他プロダクト文脈混入を除去し、ai-code-dojo 現況へ復旧する。
- Retry state machine / idempotency key / completion guard のADR候補を docs-only で整理する。

## 指示要約
- 最優先ルール: `docs/ai-protocol/PROMPT.txt` を遵守。
- 実装禁止事項（runner/Worker/queue/DB/auth/API/UI/infra 変更禁止）を厳守。
- Issue #75 は完了扱い、Issue #77 は進行中扱い。
- 作業ログ、AIプロンプトログ、handoff を保存。

## 生成物
- `docs/current-status.md`
- `docs/active-issues.md`
- `docs/reports/2026-05-19-retry-state-machine-idempotency-adr-candidate.md`
- `docs/logs/2026-05-19-issue-77-source-of-truth-recovery-and-idempotency-adr.md`
- `docs/handoff/2026-05-19-issue-77-source-of-truth-recovery-and-idempotency-adr-handoff.md`
