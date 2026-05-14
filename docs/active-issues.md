# active-issues（正本）

最終更新: 2026-05-14

## この文書の目的
進行中/未解決課題を、優先順位と依存関係付きで管理する。

## 優先度定義
- P0: セキュリティ/可用性/学習継続を阻害
- P1: 直近スプリントで解決すべき重要課題
- P2: 改善課題（計画的に対応）

## 進行中Issue

### #33 docs同期運用の整備（本件）
- 優先度: P1
- 状態: 進行中
- 目的: `current-status` / `active-issues` を現状へ同期し、Issue / PR 完了後に stale 化しない運用ルールを明文化する。
- 成果物: `docs/current-status.md` と `docs/active-issues.md` の同期更新、必要に応じた docs 運用READMEの追記。
- 非目的: runner/Worker/採点ロジック、auth/admin、DB schema/migration、hidden tests仕様の変更。
- 依存関係: #29 / #31 の正本化成果を前提として更新する。

### 高リスク領域の次Issue候補（要件定義フェーズ）
- 優先度: P1
- 状態: 候補整理中
- 候補A: 位置情報・走行履歴のデータ分類と保持期間の要件整理
- 候補B: 交通情報・オービス情報の出典管理と表示責務の整理
- 候補C: 画像投稿・コミュニティ機能における違反報告/監査ログ境界の整理
- 注意: 本Issueでは仕様追加を行わず、次Issueの論点整理のみを対象とする。

## Recently Completed

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
