# Log: Issue #60 container runtime kill escalation

- 日付: 2026-05-15
- 対象: `apps/worker/src/services/container-runtime-poc.mjs`

## 実施内容
- host timeout 到達時に即 finalize しないように変更し、`close` / `error` でのみ resolve する流れへ修正。
- host timeout 到達時は `SIGTERM` を送信し、3秒後に未終了なら `SIGKILL` を送信する escalation を維持。
- `clearKillTimer()` を `close` / `error` 側で実行し、不要タイマーの残留を防止。
- `hostTimedOut` フラグで close/error/timeout 競合時も learner-safe な `timeout` failed result へ正規化。
- 二重 resolve 防止は `settled` ガードを維持。

## 検証
- `pnpm -s test:unit` 実行でユニットテスト成功。
