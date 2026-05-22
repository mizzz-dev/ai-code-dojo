# 2026-05-22 Issue #XX retry state machine 本統合ログ

## 概要
- `running -> retry_pending -> queued` の再投入導線を Worker に実装した。
- 再投入時に `startRetryAttempt` を使用し、attempt increment / idempotency key 更新 / completion guard 解除の一貫性を維持した。
- 最大再試行回数到達時は `infra_failed` を終端として保存し、learner-safe では `failed` に抽象化する。

## 実装内容
- Worker の infrastructure failure 捕捉時に `retry_pending` へ遷移させ、再試行可能なら `startRetryAttempt` で `queued` へ再投入。
- 再投入ジョブは最新 attempt/key を付与して enqueue。
- 再投入失敗または試行上限到達時は `infra_failed` を終端保存。
- API の learner-safe 応答で `retry_pending -> retrying`、`infra_failed -> failed` に抽象化し、internal 状態を非adminに露出しないよう修正。

## テスト
- unit: learner-safe 抽象化（retrying/failed）と admin internal 表示の分離を追加。
- integration: infrastructure failure 発生時に最終的に learner は `failed`、admin は `infra_failed` を観測する経路を追加。

## 非対象
- runner仕様/採点ロジックの変更。
- auth/admin仕様変更。
- queue本格運用（visibility timeout / DLQ / backoff）。
