# 2026-05-20 Issue #83 作業ログ（Retry state machine 状態語彙・状態遷移確定）

## Summary
- Retry state machine の状態語彙を docs-only で確定した。
- `queued/running/retry_pending/infra_failed/passed/failed` の意味・遷移元・遷移先・終了状態を明文化した。
- completion guard は状態ではなく「完了保存時の一意完了制約」として扱う方針を確定した。

## 実施内容
1. 既存正本docs（`current-status` / `active-issues`）と Issue #83 与件を照合。
2. Retry state machine 確定資料を `docs/reports` に新規作成。
3. `docs/current-status.md` と `docs/active-issues.md` を Issue #83 反映で更新。
4. 作業ログ / AI prompt log / handoff を保存。

## 非対象（実施していないこと）
- runner / Worker 本体実装変更
- queue実装変更
- DB schema / migration / seed 変更
- idempotency key / completion guard の実装
- API / UI / auth / infra 変更
- hidden tests 仕様変更・実データ記載

## セキュリティ/プライバシー確認
- hidden tests 実データは記載していない。
- secrets / 認証情報 / `.data/app.db` は変更・コミット対象に含めていない。
- learner-safe と internal/admin の状態境界を docs 上で分離した。

## テスト/確認結果
- `rg "Issue #83|#83" docs/current-status.md docs/active-issues.md` で #83 の反映を確認。
- `test -f docs/logs/2026-05-20-issue-83-retry-state-machine-state-vocabulary.md` を確認。
- `test -f docs/ai-prompts/2026-05-20-issue-83-retry-state-machine-state-vocabulary-codex.md` を確認。
- `test -f docs/handoff/2026-05-20-issue-83-retry-state-machine-state-vocabulary-handoff.md` を確認。
