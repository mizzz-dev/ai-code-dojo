# Issue #96 retry再投入導線 follow-up handoff（2026-05-22）

## 目的
- PR #95 merge後のP1 follow-upとして、retry再投入先のポート不整合リスクと、終端済みsubmissionの非終端上書きリスクを解消する。

## 完了内容
- Workerのretry再投入先を `WORKER_RETRY_ENQUEUE_BASE_URL` または実待受 `WORKER_PORT` 由来URLに統一。
- API用enqueue helperは既存既定値を維持しつつ、Workerから明示URLを渡せるように変更。
- `completion_guard_at` 設定済みsubmissionへの非終端更新を no-op 化。
- 終端済みsubmissionでは `startRetryAttempt` が `null` を返すようにし、終端後のretry再投入を止めた。
- 旧番号プレースホルダをPR #95 / Issue #96に補正し、旧番号プレースホルダを含む資料名は `pr-95` 資料名へ移行。

## 確認済み
- `pnpm lint`
- `pnpm typecheck`
- `pnpm test:unit`
- `pnpm test:integration`

## 未完了/次アクション
- queue本格運用（visibility timeout / DLQ / backoff）は別Issueで対応。
- retry判断理由やcompletion guard監査ログ粒度の拡張は別Issueで対応。

## 注意事項
- hidden tests 実データ、secrets、提出コード本文を docs/logs/PR へ記録しない。
- learner-safe では `infra_failed` や内部障害詳細を返さない既存境界を維持する。
- DB schema / migration / seed は本Issueでは変更していない。
