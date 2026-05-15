# Codex Prompt Log: Issue #58

## 目的
container runtime PoC 経路に host-side timeout を追加し、Docker daemon/image pull/runtime stall を failed submission result へ正規化する。

## 制約
- API本体で提出コードを直接実行しない。
- hidden tests は内部専用で learner に返さない。
- 最小差分で実装し、PoC（local-only / non-production）前提を維持。

## 実装方針
- `apps/worker/src/services/container-runtime-poc.mjs` へ host timer を追加。
- timeout 時は `SIGTERM` 後に grace period を経て `SIGKILL`。
- settled フラグで close/error/timeout 競合時の二重 resolve を抑止。
- Alpine互換の timeout invocation (`sh -lc`) へ変更。
