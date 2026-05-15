# Handoff: Issue #60 container runtime kill escalation

## 変更要約
- host timeout 直後の `finalize('timeout')` を除去し、SIGKILL escalation がキャンセルされない構造へ変更。
- host timeout 後は `SIGTERM`、3秒後未終了なら `SIGKILL` を送信。
- `close` / `error` で kill timer を解除し、不要タイマー残留を防止。
- `hostTimedOut` により timeout結果を learner-safe failed result へ正規化。

## 確認ポイント
- close / error / timeout 競合で二重 resolve しないこと。
- timeout時に hidden tests 詳細が返却されないこと。
- feature flag off 経路へ影響がないこと。

## テスト
- `pnpm -s test:unit`
