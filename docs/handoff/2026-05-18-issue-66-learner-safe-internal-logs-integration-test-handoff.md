# 2026-05-18 Issue #66 handoff（learner-safe internal/logs integration test）

## 1. 変更概要
- `GET /api/submissions/:id` に対し、role別レスポンス境界の integration test を追加。
- learner/guest では `result.internal` / `result.logs` が返らないことを明示検証。
- admin では `result.logs` と `result.internal.*` が参照可能である既存仕様を維持確認。
- 正本docsの issue 状態を #64 completed / #66 open に同期。

## 2. 変更ファイル
- `tests/integration/api-flow.test.mjs`
- `docs/current-status.md`
- `docs/active-issues.md`
- `docs/logs/2026-05-18-issue-66-learner-safe-internal-logs-integration-test.md`
- `docs/ai-prompts/2026-05-18-issue-66-learner-safe-internal-logs-integration-test-codex.md`
- `docs/handoff/2026-05-18-issue-66-learner-safe-internal-logs-integration-test-handoff.md`

## 3. 境界確認結果
- guest: `result.internal` 非露出、`result.logs` 非露出。
- learner: `result.internal` 非露出、`result.logs` 非露出。
- admin: `result.logs` と `result.internal.hiddenTestResults/fullTestResults` が参照可能。

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
- 問題発生時は `tests/integration/api-flow.test.mjs` の Issue #66 追加アサーションをrevert。
- docs は同コミットを revert して整合を戻す。
