# Issue #93 completion guard retry compat（Codex 実行プロンプト記録）

- completion guard の重複完了防止を維持しつつ、retry attempt との互換性を回復する。
- `apps/api/src/repositories/submission-repository.mjs` を主対象に最小差分で修正する。
- terminal update no-op 時は古い `current` を返さず、DB最新行を再読込して返す。
- `startRetryAttempt` で必要に応じて `completion_guard_at` を解除し、Workerの早期return条件を誤作動させない。
- retry state machine 本統合・queue運用強化・runner仕様変更は混在させない。
- hidden tests 詳細・提出コード本文・secret を docs / logs / PR に記録しない。
