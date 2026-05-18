# 2026-05-18 Issue #68 作業ログ（timeout/runtime failure hidden leak test）

- 目的: timeout/runtime failure 経路で hidden由来文字列が learner-safe 返却に混入しないことを integration test で検証する。
- 方針: 実装変更は最小化し、`tests/integration/api-flow.test.mjs` へ失敗経路の検証を追加。
- 実施:
  - learner-safe 境界共通アサーション `assertLearnerSafeBoundary` を追加。
  - 無限ループ提出コードで failure 経路を作り、guest/learner で `result.internal` / `result.logs` 非露出を検証。
  - admin では internal/logs が維持されること、および hidden系ログ文字列が admin 側のみで確認できることを検証。
- 非実施:
  - runner/Worker 本体ロジック変更
  - DB schema/migration/seed 変更
  - auth/admin 境界変更
