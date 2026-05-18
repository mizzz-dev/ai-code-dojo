# 2026-05-18 Issue #68 handoff（timeout/runtime failure hidden leak test）

## 1. 変更概要
- `tests/integration/api-flow.test.mjs` に timeout/runtime failure 経路の learner-safe 境界検証を追加。
- guest/learner では `result.internal` / `result.logs` が露出しないことを維持確認。
- admin では logs/internal が参照可能である既存仕様を維持確認。
- 正本docsを #66 completed / #68 open に同期。

## 2. 変更ファイル
- `tests/integration/api-flow.test.mjs`
- `docs/current-status.md`
- `docs/active-issues.md`
- `docs/logs/2026-05-18-issue-68-timeout-runtime-failure-hidden-leak-test.md`
- `docs/ai-prompts/2026-05-18-issue-68-timeout-runtime-failure-hidden-leak-test-codex.md`
- `docs/handoff/2026-05-18-issue-68-timeout-runtime-failure-hidden-leak-test-handoff.md`

## 3. 境界確認結果
- guest/learner: failure 経路でも `result.internal` / `result.logs` 非露出。
- admin: `result.logs` / `result.internal` を参照可能。
- hidden tests 実データは test/docs/log へ記載していない。

## 4. 非変更範囲
- runner / Worker
- DB schema / migration / seed
- auth / admin 権限ロジック
- hidden tests 仕様
- UI / infra

## 5. テスト
- integration: 実行
- unit: 実行

## 6. ロールバック
- 問題発生時は `tests/integration/api-flow.test.mjs` の Issue #68 追加テスト/ヘルパーをrevert。
- docs は同コミットを revert して整合を復元。
