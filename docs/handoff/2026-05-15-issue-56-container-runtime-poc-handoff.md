# Handoff: 2026-05-15 Issue #56 container runtime強制PoC

## 実装概要
- `apps/worker/src/services/container-runtime-poc.mjs` を追加。
- `isolation-job-runner.mjs` で `RUNNER_CONTAINER_RUNTIME_POC=1` のとき container runtime経路を使用。
- Docker unavailable/runtime failure/timeout を `failed` 系へ正規化。

## 確認ポイント
1. flag offで従来経路が維持されること。
2. hidden tests詳細が learner-safe に露出しないこと。
3. local環境で docker コマンドが有効な場合に制約付き実行されること。

## rollback
- `RUNNER_CONTAINER_RUNTIME_POC=0`（または未設定）で即時rollback。
