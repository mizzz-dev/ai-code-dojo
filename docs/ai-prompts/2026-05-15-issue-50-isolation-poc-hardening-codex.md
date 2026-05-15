# AI Prompt Log: Issue #50 isolation PoC hardening

- 日付: 2026-05-15
- ツール: Codex
- 要点:
  - docs/ai-protocol/PROMPT.txt を最優先で遵守
  - PoC payload を spawn 引数から stdin へ移行
  - structured failure payload を親側 submission result へ保持
  - production で `RUNNER_ISOLATION_POC=1` を拒否
  - docs/current-status.md / docs/active-issues.md を #48 completed / #50 open に同期
