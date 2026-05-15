# active-issues（正本）

最終更新: 2026-05-15

## この文書の目的
進行中/未解決課題を、優先順位と依存関係付きで管理する。

## 優先度定義
- P0: セキュリティ/可用性/学習継続を阻害
- P1: 直近スプリントで解決すべき重要課題
- P2: 改善課題（計画的に対応）

## 進行中Issue

- #58 container runtime timeout hardening（local-only / non-production）
  - 優先度: P1
  - 状態: Open（host-side timeout / kill policy / Alpine timeout互換性のhardeningを実施中）
  - 位置づけ: #56のPoC実装に対するレビュー指摘（host timeout不足・BusyBox timeout互換性）への対応。
  - 非目的（このIssueでは実施しない）: 本番適用、runner/Worker全面置換、DB schema/migration/seed変更、auth/admin実装変更、UI変更、durable queue導入。


## Recently Completed

### #56 container runtime強制の最小実装PoC（local-only / non-production）
- 優先度: P1
- 状態: 完了
- 完了日: 2026-05-15
- 成果物: `apps/worker/src/services/container-runtime-poc.mjs` / `docs/handoff/2026-05-15-issue-56-container-runtime-poc-handoff.md`。

### #54 runtime制約の実強制方針PoC（local-only / non-production）
- 優先度: P1
- 状態: 完了
- 完了日: 2026-05-15
- 成果物: `docs/reports/2026-05-15-runtime-constraints-poc.md` / `docs/risks/2026-05-15-runtime-constraints-poc-risks.md` / `docs/handoff/2026-05-15-issue-54-runtime-constraints-poc-handoff.md`。

### #52 Runner隔離PoC stdin / child error handling
- 優先度: P1
- 状態: 完了
- 完了日: 2026-05-15
- 成果物: `docs/logs/2026-05-15-issue-52-runner-isolation-poc-error-handling.md` / `docs/handoff/2026-05-15-issue-52-isolation-poc-error-handling-handoff.md`。

### #50 Runner隔離実行PoC hardening
- 優先度: P0
- 状態: 完了
- 完了日: 2026-05-15
- 成果物: payload stdin化、structured failure payload保持、production guard適用、および関連ログ/handoff。

### #48 Runner隔離実行PoC
- 優先度: P0
- 状態: 完了
- 完了日: 2026-05-15
- 成果物: `docs/reports/2026-05-15-runner-isolation-poc.md` / `docs/risks/2026-05-15-runner-isolation-poc-risks.md` / `docs/handoff/2026-05-15-issue-48-runner-isolation-poc-handoff.md`。

### #46 Runner隔離実行基盤 ADR正式化
- 優先度: P0
- 状態: 完了
- 完了日: 2026-05-15
- 成果物: `docs/adr/ADR-001-runner-isolation-container-jobs.md` / `docs/logs/2026-05-15-issue-46-runner-isolation-adr.md`。

### #44 Runner隔離実行基盤 設計整理
- 優先度: P0
- 状態: 完了
- 完了日: 2026-05-15
- 成果物: `docs/reports/2026-05-15-runner-isolation-design.md` / `docs/risks/2026-05-15-runner-isolation-risks.md` / `docs/logs/2026-05-15-issue-44-runner-isolation-design.md`。

### #41 Source of Truth再整合（Issue #37の意味付け是正）
- 優先度: P1
- 状態: 完了
- 完了日: 2026-05-14
- 成果物: `docs/current-status.md` / `docs/active-issues.md` の #37 記述を GitHub 正本（Runner安全性レビュー）に再整合。


### #14 Source of Truth同期漏れの是正
- 優先度: P1
- 状態: 完了
- 完了日: 2026-05-14
- 成果物: PR #15 マージ後の docs 正本更新漏れを解消し、同期運用の是正方針を確定。

### #10 正本docs同期運用の初期整備
- 優先度: P1
- 状態: 完了
- 完了日: 2026-05-14
- 成果物: docs 正本運用の初期ルールと同期更新フローを整備。

### #29 Repository整備（正本docs骨格）
- 優先度: P1
- 状態: 完了
- 完了日: 2026-05-13
- 成果物: `project-overview` / `current-status` / `active-issues` / `system-overview` と docs骨格の整備。

### #31 Repository整備（docs/logs 正本化）
- 優先度: P2
- 状態: 完了
- 完了日: 2026-05-14
- 成果物: `docs/logs/README.md` の整備と関連docs導線の確立。

## 継続監視トピック
- 実行隔離の強化（簡易Runnerからの移行）
- queueの本格運用方式
- SQLiteから将来RDBへの移行計画
- hidden tests保護運用の監査強化

## Branch Cleanup
- `issue-14` 系作業branchは PR #15 マージ済みのため削除対象。
- 削除保留時は「ローカル検証ログ採取中」など具体理由を作業ログへ記録する。

## 更新ルール（stale防止）
1. **Issue完了時（必須）**
   - `進行中Issue` から対象Issueを削除し、`Recently Completed` へ移動する。
   - 同時に `docs/current-status.md` の `直近完了事項` と `優先順位（直近）` を更新する。
2. **PRマージ時（必須）**
   - 変更対象が docs 正本に関わる場合、PR本文チェックリストに `current-status/active-issues同期` を含める。
   - 必要に応じて `docs/logs/` へ実施ログを追記し、恒久ルール化が必要なら `docs/runbooks/` へ移管する。
3. **新規Issue追加時（必須）**
   - 優先度・背景・依存関係・非目的を明記し、重複Issueがないか確認する。
4. **週次見直し（推奨）**
   - 優先度と着手順を棚卸しし、`進行中Issue` の状態表記を更新する。
