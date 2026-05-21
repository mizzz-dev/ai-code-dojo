# 2026-05-20 Issue #85 作業ログ（重複採点防止設計）

## Summary
- Issue #83 で確定した状態語彙を前提に、重複ジョブ投入・重複実行・重複完了の定義を整理した。
- idempotency key 相当と completion guard の責務差分を明文化した。
- API / Worker / DB の責務境界、attempt単位/ submission単位の切り分け、将来の contract/DB 影響を docs-only で整理した。

## 実施内容
1. 正本 docs と Issue #85 要件を照合。
2. `docs/reports/2026-05-20-duplicate-grading-prevention-design.md` を新規作成。
3. `docs/current-status.md` / `docs/active-issues.md` を Issue #85 反映で更新。
4. 本作業ログ、AI prompt log、handoff を作成。

## 非対象（実施していないこと）
- runner / Worker / queue 本体実装変更
- DB schema / migration / seed 変更
- idempotency key / completion guard の実装
- API仕様 / UI / auth / infra 変更
- hidden tests 仕様変更

## セキュリティ/プライバシー確認
- hidden tests 実データ・期待値・内部検証内容は記載していない。
- secret / 認証情報 / `.data/app.db` は変更・記載・コミットしていない。
- learner-safe と internal/admin 境界（`infra_failed` 非露出）を維持した。

## テスト/確認結果
- `rg "Issue #85|#85" docs/current-status.md docs/active-issues.md` で #85 の反映を確認。
- `test -f docs/logs/2026-05-20-issue-85-duplicate-grading-prevention-design.md` を確認。
- `test -f docs/ai-prompts/2026-05-20-issue-85-duplicate-grading-prevention-design-codex.md` を確認。
- `test -f docs/handoff/2026-05-20-issue-85-duplicate-grading-prevention-design-handoff.md` を確認。
