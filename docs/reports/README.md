# reports

最終更新: 2026-07-23

## 目的
このディレクトリの保管対象を定義し、情報の散逸を防ぐ。

## 保管ルール
- ファイル名は `YYYY-MM-DD-<topic>.md` を基本とする。
- 先頭に「目的 / 背景 / 決定事項 / 未確定事項（必要時）」を記載する。
- 正本と重複する説明は避け、必要時は正本リンクを貼る。

## 主要レポート

- `2026-07-23-queue-operations-visibility-dlq-backoff-design.md`
  - 現行HTTP queueと将来外部queueのdelivery / ack / visibility timeout / retry / backoff / DLQ / replay / migration設計
  - 関連Issue: #109
  - ADR: `docs/adr/2026-07-23-queue-delivery-and-db-fencing-boundary.md`
- `2026-07-22-stale-running-lease-recovery-design.md`
  - stale runningのlease / heartbeat / attempt fencing / recovery設計
  - 関連Issue: #101
- `2026-05-20-duplicate-grading-prevention-design.md`
  - duplicate enqueue / execution / completionとidempotency / completion guard設計
  - 関連Issue: #85
- `2026-05-18-worker-failure-retry-policy.md`
  - Worker障害分類とretry / failure確定の運用方針
  - 関連Issue: #75
