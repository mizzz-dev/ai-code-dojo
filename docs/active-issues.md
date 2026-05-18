# active-issues（正本）

最終更新: 2026-05-17

## この文書の目的
進行中/未解決課題を、優先順位と依存関係付きで管理する。

## 優先度定義
- P0: セキュリティ/可用性/学習継続を阻害
- P1: 直近スプリントで解決すべき重要課題
- P2: 改善課題（計画的に対応）

## 進行中Issue

- #62 SIGKILL escalation unit test flakiness 対応（local-only / non-production）
  - 優先度: P2
  - 状態: Open（fallback close 猶予不足によるCI flaky 懸念の解消を実施中）
  - 位置づけ: #60対応後のレビュー指摘（P2: 低速/高負荷CIでの非決定性）への対応。
  - 非目的（このIssueでは実施しない）: 本番適用、runner/Worker全面置換、DB schema/migration/seed変更、auth/admin実装変更、UI変更、durable queue導入。


## Recently Completed

### #60 container runtime kill escalation hardening（local-only / non-production）
- 優先度: P1
- 状態: 完了
- 完了日: 2026-05-15
- 成果物: `apps/worker/src/services/container-runtime-poc.mjs` / `docs/handoff/2026-05-15-issue-60-container-runtime-kill-escalation-handoff.md`。

### #58 container runtime timeout hardening（local-only / non-production）
- 優先度: P1
- 状態: 完了
- 完了日: 2026-05-15
- 成果物: `apps/worker/src/services/container-runtime-poc.mjs` / `docs/handoff/2026-05-15-issue-58-container-runtime-timeout-hardening-handoff.md`。
