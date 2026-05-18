# 2026-05-18 Issue #75 AI Prompt Log（Codex）

## 目的
- Issue #73 完了後の Source of Truth 不整合の解消。
- PR #74 で追加された post-merge docs sync checklist の実適用。
- Worker障害時の採点停止・再試行・失敗扱い・復旧方針を docs-only で整理。

## 入力条件（要約）
- runner / Worker 本体、queue、DB schema/migration/seed、auth/admin、API/UI/infra は非変更。
- hidden tests 実データ、secrets、`.data/app.db` は記載・コミット禁止。
- API本体で提出コードを直接実行しない不変条件を維持。

## 実行方針
1. 正本 (`current-status` / `active-issues`) を GitHub 状態に同期。
2. checklist 適用結果を `docs/logs` に記録。
3. Worker failure policy を `docs/reports` と `docs/runbooks` で設計文書化。
4. 次担当向け handoff を作成。

## 出力
- `docs/current-status.md`
- `docs/active-issues.md`
- `docs/logs/2026-05-18-issue-75-worker-failure-retry-policy.md`
- `docs/reports/2026-05-18-worker-failure-retry-policy.md`
- `docs/runbooks/2026-05-18-worker-failure-recovery-runbook.md`
- `docs/handoff/2026-05-18-issue-75-worker-failure-retry-policy-handoff.md`
