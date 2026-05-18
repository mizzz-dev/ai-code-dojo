# 2026-05-18 Issue #68 Codex 実行プロンプト記録

## 目的
- timeout/runtime failure 経路の learner-safe 返却に hidden由来文字列が混入しないことを integration/E2E で検証する。
- 既存の learner-safe / internal 境界（guest/learner 非露出、admin 参照可）を維持する。
- docs正本（`current-status` / `active-issues`）を #66 completed / #68 open に同期する。

## 制約
- API本体で提出コードを直接実行しない。
- hidden tests の実データを test/docs/log に書かない。
- runner/Worker、DB schema/migration/seed、auth/admin、UI は原則変更しない。
- 差分は最小化し、テスト追加中心で進める。

## 実施方針
1. `tests/integration/api-flow.test.mjs` に failure 経路の検証ケースを追加。
2. guest/learner の `result.internal` / `result.logs` 非露出を否定系で確認。
3. admin の既存仕様（logs/internal 参照可）を維持確認。
4. `docs/current-status.md` / `docs/active-issues.md` を #66 completed / #68 open に同期。
5. handoff/log を作成し、回帰検知観点を明記。
