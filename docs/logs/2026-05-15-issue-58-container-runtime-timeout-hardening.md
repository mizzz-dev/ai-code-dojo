# Issue #58 container runtime timeout hardening 作業ログ

- 日付: 2026-05-15
- 対象: `RUNNER_CONTAINER_RUNTIME_POC=1` の PoC 経路

## 実施内容
- `runNodeTestsInContainer` に host-side timeout を追加。
- host timeout 発火時は `SIGTERM` を送信し、3秒猶予後に `SIGKILL` を送る kill policy を実装。
- close / error / host timeout の競合で二重 resolve しないように `settled` ガードを維持。
- `node:20-alpine` 互換のため、container 内 command を `sh -lc "timeout -s TERM -k 3s ..."` 形式へ変更。
- unit test を追加し、timeout 正規化・二重 resolve 防止の回帰を確認。

## 非実施（Issueスコープ外）
- 本番適用
- runner/Worker 全面置換
- DB schema/migration/seed 変更
- auth/admin/UI 変更
