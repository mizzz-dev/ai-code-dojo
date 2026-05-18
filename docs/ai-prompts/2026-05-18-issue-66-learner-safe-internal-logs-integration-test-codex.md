# 2026-05-18 Issue #66 Codex 実行プロンプト記録

## 目的
- learner-safe 返却で `result.internal` / `result.logs` が非露出であることを integration test で保証する。
- admin/internal 境界の既存仕様を壊さない。
- docs正本（`current-status` / `active-issues`）を #64 completed / #66 open に同期する。

## 制約
- 変更は最小差分。
- API本体で提出コードを直接実行しない不変条件を維持。
- hidden tests の実データを記載しない。
- DB schema/migration/seed、auth/admin、UI、runner/Worker は原則変更しない。

## 実施方針
1. 既存 integration test（`tests/integration/api-flow.test.mjs`）に境界検証を追加。
2. guest/learner で `result.internal` / `result.logs` 非露出の否定系アサーションを追加。
3. admin で internal 参照可能である既存仕様の維持を確認。
4. docs同期（`docs/current-status.md`, `docs/active-issues.md`）。
