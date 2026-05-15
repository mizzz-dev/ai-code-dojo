# Log: Issue #50 isolation PoC hardening

- 日付: 2026-05-15
- 担当: Codex

## 実施内容
- isolation PoC の payload 受け渡しを spawn 引数から stdin へ変更。
- isolation child が返す `{ ok: false, result: ... }` を親プロセス側で保持するよう修正。
- `NODE_ENV=production` かつ `RUNNER_ISOLATION_POC=1` を起動時に拒否する guard を追加。
- unit test を追加し、failure payload 保持と production guard を検証。

## 非実施
- 本番コンテナランタイム統合。
- DB schema/migration/seed 変更。
- auth/admin 実装変更。
