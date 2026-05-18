# 2026-05-17 Issue #62 SIGKILL escalation test flakiness 対応ログ

## 背景
- PR #61 / Issue #60 の修正後、`runNodeTestsInContainer host timeout escalates to SIGKILL and resolves on close` テストの fallback close 猶予が 9s と短く、低速CIで flaky になる懸念がレビュー指摘（P2）として残っていた。

## 対応内容（最小差分）
- `tests/unit/worker-isolation-poc.test.mjs` の fallback close タイマーを `9000ms` から `20000ms` に拡大。
- テスト解決後に fallback タイマーを `clearTimeout` して、不要な待機ハンドルを残さないようにした。

## 判断理由
- production logic は変更せず、テスト側の safety margin のみ調整することで、#60 の挙動検証（SIGTERM → SIGKILL）を維持したまま非決定性要因を低減できるため。
- fake timer 導入より差分が小さく、既存テスト構造を崩さずレビューしやすい。

## 非対応（Issue #62の非目的）
- 本番 runtime 実装の挙動変更
- auth/admin、DB schema/migration/seed、UI の変更

## 実行コマンド
- `pnpm -s test:unit`
