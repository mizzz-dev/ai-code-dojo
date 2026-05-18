# 2026-05-18 Issue #66 作業ログ（learner-safe internal/logs integration test）

## 概要
- Issue #66 対応として、`GET /api/submissions/:id` の learner/guest レスポンスで `result.internal` / `result.logs` が非露出であることを否定系 integration test で追加。
- admin レスポンスで internal 情報が引き続き参照可能であることも同一テストで確認。

## 実施内容
1. `tests/integration/api-flow.test.mjs` を更新。
   - guest 取得: `result.internal === undefined` と `result.logs === undefined` を検証。
   - learner 取得（`x-web-user: learner:*`）: 同様に非露出を検証。
   - admin 取得（`x-web-user: admin:*`）: `result.logs` / `result.internal.hiddenTestResults` / `result.internal.fullTestResults` を検証。
2. `docs/current-status.md` / `docs/active-issues.md` を #64 completed / #66 open に同期。

## 非実施（意図的に変更していない項目）
- runner / Worker 実装
- DB schema / migration / seed
- auth / admin 権限ロジック
- hidden tests 仕様
- UI / infra / deployment

## テスト
- `pnpm -s test:integration`
- `pnpm -s test:unit`

## セキュリティ観点メモ
- hidden tests の実データ・詳細ログは本ログに記載しない。
- learner-safe 境界で internal/logs の非露出回帰をCIで検知可能にした。
