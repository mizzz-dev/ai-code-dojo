# 2026-05-22 PR #95 retry state machine integration prompt（Codex）

## 指示要約
- `docs/ai-protocol/PROMPT.txt` の不変条件を最優先で遵守する。
- retry state machine を本統合し、`retry_pending -> queued` 再投入導線を実装する。
- attempt increment / idempotency key / completion guard の整合を維持する。
- timeout/runtime failure は安易に retry しない。
- learner-safe 返却では internal 状態や内部障害詳細を露出しない。

## 実施方針
- Worker に infrastructure failure 用の retry 制御を追加。
- 再投入は `startRetryAttempt` 経由で attempt と key を更新。
- API応答の learner-safe マッピングを追加。
- unit/integration test と正本docsを同期更新。
