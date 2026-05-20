# 2026-05-20 Issue #83 handoff（Retry state machine 状態語彙・状態遷移確定）

## 完了したこと
- Retry state machine の採用語彙を `queued/running/retry_pending/infra_failed/passed/failed` で確定した。
- 各状態の意味、遷移元、遷移先、終了状態を docs に明記した。
- completion guard は状態でなく、完了保存時の一意完了制約として扱う方針を確定した。
- learner-safe（`retrying` 抽象語彙）と internal/admin（`retry_pending` / `infra_failed`）の境界を整理した。
- `current-status` / `active-issues` / 作業ログ / AI prompt log / handoff を更新した。

## 未実施（意図的に非対象）
- runner / Worker / queue 本体実装変更
- DB schema / migration / seed 変更
- idempotency key / completion guard 実装
- API / UI / auth / infra 変更

## 次アクション候補
1. idempotency key 導入Issue（API/Worker/DB責務分離）
2. completion guard 実装Issue（終端状態一意化）
3. DB拡張Issue（retry観測性カラムと制約）
4. queue本格運用Issue（visibility timeout / DLQ / backoff）
