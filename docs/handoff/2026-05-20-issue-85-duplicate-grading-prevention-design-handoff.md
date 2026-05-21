# 2026-05-20 Issue #85 handoff（重複採点防止設計）

## 完了したこと
- Retry state machine 確定語彙（Issue #83）と整合する形で、重複ジョブ投入・重複実行・重複完了の定義を確定した。
- idempotency key 相当（attempt単位）と completion guard（submission終端一意化）の責務差分を確定した。
- API / Worker / DB の責務境界、および将来の contract 影響を docs-only で整理した。
- `current-status` / `active-issues` / report / log / ai-prompt / handoff を更新・作成した。

## 未実施（意図的に非対象）
- runner / Worker / queue 本体実装変更
- DB schema / migration / seed 変更
- idempotency key / completion guard 実装
- API/UI/auth/infra 変更

## 次アクション候補
1. idempotency key 導入実装Issue（attempt採番・識別子保存・再投入制御）
2. completion guard 実装Issue（終端保存一意制約）
3. DB schema/migration Issue（attempt / key / guard 関連カラムと制約）
4. queue運用 Issue（visibility timeout / DLQ / backoff）
