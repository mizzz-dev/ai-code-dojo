# 2026-05-21 Issue #89 handoff

## 完了内容
- `submissions` 旧スキーマDBでの migration順序不整合を修正。
- attempt関連列の存在保証後に attempt関連UNIQUE indexを作成する構成へ変更。
- 旧スキーマ→新スキーマ upgrade を再現する unit test を追加。

## 変更ファイル
- `apps/api/src/db/database.mjs`
- `tests/unit/database-migration-order.test.mjs`
- `docs/current-status.md`
- `docs/active-issues.md`
- `docs/logs/2026-05-21-issue-89-sqlite-attempt-migration-order.md`
- `docs/ai-prompts/2026-05-21-issue-89-sqlite-attempt-migration-order-codex.md`
- `docs/handoff/2026-05-21-issue-89-sqlite-attempt-migration-order-handoff.md`

## 運用メモ
- SQLite UNIQUE + NULL 複数許容は仕様どおりであり、attempt key未設定レコードと両立する。
- completion guard は別Issueで実装継続。
