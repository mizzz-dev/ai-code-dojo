# 2026-05-15 Issue #52 Runner隔離PoC error handling 作業ログ

## 概要
- 対象: `runJavaScriptChallengeViaIsolatedJob` の child stdin / child process error handling。
- 目的: EPIPE と spawn failure を failed submission result に正規化し、worker process の unhandled error での異常終了リスクを低減する。

## 実施内容
1. `apps/worker/src/services/js-runner.mjs` に `runJavaScriptChallengeViaIsolatedJobWithSpawn` を追加。
2. `child.stdin` の `error` イベントを捕捉し、`failed` result へ正規化する処理を追加。
3. `child` の `error` イベントを捕捉し、spawn failure を `failed` result へ正規化する処理を追加。
4. `resolveOnce` を導入し、`close / error / stdin error` 競合時の二重resolveを防止。
5. success path と structured failure payload 保持の既存動作を維持。
6. `tests/unit/worker-isolation-poc.test.mjs` に EPIPE / ENOENT（spawn failure）正規化テストを追加。

## 検証
- `pnpm -s test:unit` を実行し成功。
- hidden tests の実データをログ/出力へ含めていないことを確認。

## 非対象
- 本番コンテナランタイム統合。
- DB schema/migration/seed 変更。
- auth/admin/UI 変更。
