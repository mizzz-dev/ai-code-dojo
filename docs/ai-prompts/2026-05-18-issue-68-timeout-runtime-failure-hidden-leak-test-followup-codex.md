# AI Prompt Log: 2026-05-18 Issue #68 follow-up（Codex）

## 依頼要約
- PR #69 レビュー指摘（構文エラー経路では timeout/runtime failure の検証として不十分）を解消する。
- 実際の failure-like submission result を通しつつ learner-safe 境界を再検証する。

## 守る制約
- API で提出コードを直接実行しない。
- hidden tests は internal 専用、学習者向け返却禁止。
- 実装差分は最小化し、test修正中心。
- DB schema/migration/seed・auth/admin・UI・infra は変更しない。

## 実施方針
1. `tests/integration/api-flow.test.mjs` failure系で `RUNNER_ISOLATION_POC=1` を有効化。
2. 構文エラーではなく正常コードを送信し、failure-like 経路の境界検証に寄せる。
3. guest/learner 非露出（`result.logs` / `result.internal`）を維持確認。
4. admin 参照可（`result.logs` / `result.internal`）を維持確認。

## 実施結果（要約）
- integration test を実行経路ベースの境界検証へ修正し、`pnpm -s test:integration` / `pnpm -s test:unit` の成功を確認した。
