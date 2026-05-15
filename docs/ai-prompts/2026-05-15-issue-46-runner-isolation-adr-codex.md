# AI Prompt Log: Issue #46 Runner隔離実行基盤 ADR化

- 日付: 2026-05-15
- 担当: Codex
- 対象Issue: #46

## 目的
Issue #44で整理済みのRunner隔離実行設計をADRとして正式化し、制限値・返却境界・kill policy・rollback方針を後続実装の前提として固定する。

## 制約
- docs/ai-protocol/PROMPT.txt を最優先で遵守。
- API本体で提出コードを直接実行しない。
- hidden tests 詳細を学習者向けに返却しない。
- runner / Worker / auth / DB / migration / UI / infra本番適用は変更しない。

## 出力
- `docs/adr/ADR-001-runner-isolation-container-jobs.md`
- `docs/current-status.md`
- `docs/active-issues.md`
- `docs/logs/2026-05-15-issue-46-runner-isolation-adr.md`
- `docs/handoff/2026-05-15-issue-46-runner-isolation-adr-handoff.md`
