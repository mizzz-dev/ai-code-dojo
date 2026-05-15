# Handoff: 2026-05-15 Issue #52 Runner隔離PoC error handling

## 目的
隔離PoC経路で発生する `child.stdin` と `child process` のエラーを worker process の異常終了に繋げず、failed submission result として正規化する。

## 変更概要
- `apps/worker/src/services/js-runner.mjs`
  - `runJavaScriptChallengeViaIsolatedJobWithSpawn` を追加（テスト可能化）。
  - `stdin error` / `child error` のハンドリングを追加。
  - `resolveOnce` により `close/error/stdin error` 競合時の二重resolveを防止。
  - 既存の success / structured failure payload の復元ロジックは維持。
- `tests/unit/worker-isolation-poc.test.mjs`
  - EPIPE 相当の `stdin error` 正規化テストを追加。
  - ENOENT 相当の `spawn failure` 正規化テストを追加。
- `docs/current-status.md` / `docs/active-issues.md`
  - #50 completed / #52 open に同期。

## 検証結果
- `pnpm -s test:unit`: 成功。

## セキュリティ/境界
- hidden tests の詳細を learner-safe logs に露出しない既存方針を維持。
- internal failure message は最小限（error code/message）に留め、機密情報は出力しない。

## 非対象（実施していない）
- 本番コンテナランタイム統合。
- network deny/read-only rootfs の実強制。
- DB schema/migration/seed、auth/admin/UI の変更。
