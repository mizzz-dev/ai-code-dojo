# 2026-05-21 Issue #89: SQLite attempt migration順序修正ログ

## 背景
PR #88 で導入した attempt 単位 idempotency key 実装において、既存SQLite DB（`submissions` に `grading_attempt` / `attempt_idempotency_key` が未追加）を起動すると、index作成が先行して `no such column` で API / Worker 起動失敗するリスクが確認された。

## 再現条件
- 既存 `submissions` テーブルが旧スキーマ（attempt関連2カラムなし）。
- 起動時 migration が `CREATE UNIQUE INDEX ... grading_attempt` を先に実行。

## 実施した修正
- `apps/api/src/db/database.mjs` で migration責務を整理。
  - テーブル作成 (`migrateSchema`) 後に `ensureSubmissionColumns` を実行。
  - 列追加完了後に `ensureSubmissionIndexes` で index 作成。
- `tests/unit/database-migration-order.test.mjs` を追加し、旧スキーマDBからの upgrade で列追加→index作成が成功することを検証。

## 技術判断
- `attempt_idempotency_key` の UNIQUE index は SQLite 仕様上 `NULL` 複数行を許容する。
- 本要件は「attemptキーが存在する行の重複防止」であり、`NULL` 許容は初期/未採番行との整合が取れるため許容する。

## 確認結果
- 旧スキーマ再現テストで migration 成功。
- lint / typecheck / unit / integration を実行し成功。

## 非対象（明示）
- completion guard 実装
- retry state machine 本統合
- queue本格運用
- auth/admin仕様変更
