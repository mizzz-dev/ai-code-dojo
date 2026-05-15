# Issue #52 Runner隔離PoC error handling（Codex 実行プロンプト記録）

## 指示要約
- `docs/ai-protocol/PROMPT.txt` を最優先で遵守。
- `apps/worker/src/services/js-runner.mjs` で child.stdin error / child process error を捕捉。
- EPIPE / spawn failure を failed submission result に正規化。
- close/error/stdin error の競合で二重resolveしない。
- success path / structured failure payload保持を維持。
- `docs/current-status.md` / `docs/active-issues.md` を #50 completed / #52 open に同期。
- `pnpm -s test:unit` を通す。

## 実施結果
- js-runner の error handling を追加。
- unit test を追加し、EPIPE と spawn failure の失敗正規化を検証。
- status docs を同期。
- 作業ログ/handoff を更新。
