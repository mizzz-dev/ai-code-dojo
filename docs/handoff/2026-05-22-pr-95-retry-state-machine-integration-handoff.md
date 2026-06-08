# PR #95 retry state machine integration handoff（2026-05-22）

## 目的
- retry state machine の本統合として `retry_pending -> queued` 再投入導線を実装し、attempt/key/guard 整合を実運用コードへ接続する。

## 完了内容
- Worker で infrastructure failure を `retry_pending` 扱いにし、再試行可能時は `startRetryAttempt` で `queued` 再投入する実装を追加。
- `startRetryAttempt` による attempt increment / idempotency key 更新 / completion guard 解除をそのまま使用し、互換性を維持。
- 最大試行回数到達または再投入失敗時は `infra_failed` 終端を保存。
- learner-safe 応答を調整し、非adminには `retry_pending`/`infra_failed` を返さないよう抽象化。
- unit/integration test を追加して状態遷移と境界を検証。

## 未完了/次アクション
- queue本格運用（visibility timeout / DLQ / backoff）は別Issueで対応。
- retry 判断理由など監査ログ粒度の拡張は別Issueで対応。

## 注意事項
- hidden tests 実データ、secrets、提出コード本文を docs/logs/PR へ記録しない。
- completion guard は状態語彙ではなく終端保存制約として維持する。
