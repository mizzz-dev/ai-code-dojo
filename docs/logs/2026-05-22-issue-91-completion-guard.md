# 2026-05-22 Issue #91 completion guard 実装ログ

## 概要
- 同一 submission に対する終端結果（`passed` / `failed` / `infra_failed`）保存を一度だけ許可する completion guard を実装。
- attempt単位 idempotency key（Issue #87）と責務分離を維持。

## 実装内容
- `submissions` テーブルに `completion_guard_at` 列を後方互換で追加（既存SQLiteに対して冪等）。
- repository の `updateSubmission` で、終端結果保存時のみ `completion_guard_at IS NULL` 条件付き UPDATE を実施。
- 既に終端保存済みなら後続の終端保存は no-op（既存状態を返却）として idempotent に無害化。
- Worker は処理開始時に `completionGuardAt` を確認し、終端済み submission への再処理を抑止。

## テスト
- unit test で以下を追加:
  - 終端保存が初回のみ成功し、2回目以降は上書きされないこと。
  - 非終端更新（`running`）は終端前に阻害されないこと。

## セキュリティ/境界
- hidden tests 詳細の learner-safe 境界は既存仕様を維持。
- API本体で提出コードを直接実行しない不変条件を維持。
