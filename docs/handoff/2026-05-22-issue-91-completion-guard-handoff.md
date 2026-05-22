# Issue #91 completion guard handoff（2026-05-22）

## 目的
同一 submission に対する終端保存の多重成功を防ぎ、最終結果整合性を維持する。

## 完了内容
- `completion_guard_at` 列を `submissions` に追加（後方互換・冪等 migration）。
- 終端結果（`passed`/`failed`/`infra_failed`）の保存は `completion_guard_at IS NULL` 条件で1回だけ許可。
- 重複終端保存は no-op として無害化。
- Worker の開始時ガードで、終端済み submission の重複処理を早期 return。
- unit test を追加し、終端一意性と終端前の非終端更新許可を検証。

## 未完了/次アクション
- retry state machine 本統合（`retry_pending -> queued` 本導線）は本Issue対象外のため未着手。
- queue運用強化（visibility timeout / DLQ / backoff）は未着手。

## 注意事項
- hidden tests 実データや提出コード本文を運用docsへ記載しない方針を継続。
- learner-safe / internal 境界は既存仕様を維持。
