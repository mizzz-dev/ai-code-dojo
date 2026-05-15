# Handoff: Issue #58 container runtime timeout hardening

## 変更要約
- container runtime PoC に host-side timeout を追加。
- host timeout 時の kill policy（SIGTERM -> 3s -> SIGKILL）を実装。
- `node:20-alpine` で動作する timeout command へ変更。
- timeout/unavailable/runtime failure の failed 正規化を維持。

## 確認ポイント
- `RUNNER_CONTAINER_RUNTIME_POC=1` で docker run が stall しても Promise が未解決で残らないこと。
- learner-safe / internal 境界（hidden tests 非露出）が維持されていること。

## テスト
- `pnpm -s test:unit`
