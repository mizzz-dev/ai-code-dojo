# 2026-05-20 Issue #85 AI Prompt Log（Codex）

## User Request（要約）
- `docs/ai-protocol/PROMPT.txt` を最優先で遵守。
- Issue #83 / PR #84 で確定した Retry state machine 状態語彙を前提に、重複ジョブ投入・重複実行・重複完了を防ぐ設計を docs-only で整理。
- idempotency key 相当、completion guard との差分、API / Worker / DB 責務境界、submission単位/attempt単位の方針を確定。
- 指定 docs の更新・新規作成（current-status, active-issues, report, logs, ai-prompt, handoff）を実施。

## Constraints（要約）
- 実装禁止: runner/Worker/queue/DB/API/UI/auth/infra の実装変更。
- hidden tests 実データ、secret、`.data/app.db` を記載・コミットしない。
- 変更は最小差分で docs-only。

## Assistant Execution Notes
- Canonical docs と Issue #83 関連資料を確認して整合性を担保。
- 重複防止設計を report に集約し、active/current を更新。
- 作業ログ・handoff・prompt log を保存。
