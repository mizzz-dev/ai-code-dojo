# 2026-05-18 Issue #68 follow-up ログ（timeout/runtime failure hidden leak test）

## 背景
- PR #69 の failure系 integration test が構文エラー相当経路になっており、timeout/runtime failure 由来の分岐検証として弱い指摘を受領。

## 対応方針
- 実装変更は最小化し、`tests/integration/api-flow.test.mjs` の failure系ケースを修正。
- worker を `RUNNER_ISOLATION_POC=1` で起動し、通常（非isolated）実行ではなく隔離実行経路を通す。
- learner/guest の `result.logs` / `result.internal` 非露出と、admin の internal/logs 可視性を同時確認する。

## 実施内容
1. failure系テストの worker 起動envに `RUNNER_ISOLATION_POC=1` を追加。
2. submission code を正常コードに統一し、構文エラー依存の検証を除去。
3. guest/learner で `result.logs` / `result.internal` 非露出を継続検証。
4. admin で `result.logs` と `result.internal.hiddenTestResults` が参照可能である既存境界を継続検証。

## 影響範囲
- integration test と運用ドキュメントのみ。
- runner/worker 本体、DB schema/migration/seed、auth/admin ロジック変更なし。

## 備考
- hidden tests の実データや詳細文字列は docs/test/log に記載していない。
- Issue #68 は open 継続（review反映後の最終判断待ち）。
