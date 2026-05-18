# 2026-05-18 Issue #68 follow-up handoff（timeout/runtime failure hidden leak test）

## 今回の対応
- PR #69 レビュー指摘に対応し、failure系 integration test を「構文エラー依存」から「隔離実行経路を通る境界検証」へ修正。
- 対象: `tests/integration/api-flow.test.mjs` の `timeout/runtime failure 経路でも learner-safe 境界を維持する`。

## 変更点
- worker 起動envに `RUNNER_ISOLATION_POC=1` を追加。
- submission code を正常コードへ変更（構文エラー依存を除去）。
- guest/learner の `result.logs` / `result.internal` 非露出を継続検証。
- admin の `result.logs` / `result.internal.hiddenTestResults` 参照可を継続検証。

## 検証観点
- learner-safe 返却へ hidden由来詳細文字列が混入しない。
- learner/guest で `result.logs` / `result.internal` が露出しない。
- admin/internal 境界の既存仕様が壊れていない。

## 未完了/次アクション
- Issue #68 の open 状態は維持。
- CI 上の結果確認後、クローズ可否を最終判断。
