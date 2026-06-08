# 2026-05-22 Issue #96 retry再投入導線 follow-up ログ

## 概要
- PR #95 merge後に残った retry再投入導線のP1不整合を最小差分で修正した。
- Workerのretry再投入先を、Worker自身の実待受 `WORKER_PORT` 由来URLまたは明示 `WORKER_RETRY_ENQUEUE_BASE_URL` に統一し、API向け `RUNNER_API_BASE_URL` との意味混線を避けた。
- `completion_guard_at` 設定済みsubmissionへの非終端更新を no-op 化し、終端済み結果を `retry_pending` などで上書きしないよう補強した。
- docs上に残っていた 旧番号プレースホルダを PR #95 / Issue #96 として追跡可能な表記へ移行した。

## 実装内容
- APIのenqueue helperに、呼び出し側が再投入先URLを明示できる引数を追加。
- Workerのretry再投入では `WORKER_RETRY_ENQUEUE_BASE_URL` があればそれを優先し、未設定時は `WORKER_PORT` から `http://localhost:<port>` を組み立てる。
- repository更新で、終端保存済みsubmissionに対する非終端patchをDBへ反映しないようにし、DB更新条件にも `completion_guard_at IS NULL` を付けて同一attemptの重複ジョブが終端直後に非終端状態へ戻す競合を抑止した。
- `startRetryAttempt` は終端保存済みsubmissionでは `null` を返し、retry再投入の後続処理を進めない。

## テスト
- unit: 終端後の `startRetryAttempt` が発火しないこと、終端済みsubmissionが `retry_pending` で上書きされないことを追加確認。
- integration: Workerのretry再投入先が `RUNNER_API_BASE_URL` 未設定でも実待受 `WORKER_PORT` と整合し、最終的に `infra_failed` へ到達する経路を確認。

## 非対象
- runner仕様/採点ロジックの変更。
- hidden tests仕様の変更や実データ露出。
- auth/admin仕様変更。
- queue本格運用（visibility timeout / DLQ / backoff）。
- DB schema / migration / seed の変更。
