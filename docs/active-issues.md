# active-issues（正本）

最終更新: 2026-05-13

## この文書の目的
進行中/未解決課題を、優先順位と依存関係付きで管理する。

## 優先度定義
- P0: セキュリティ/可用性/学習継続を阻害
- P1: 直近スプリントで解決すべき重要課題
- P2: 改善課題（計画的に対応）

## 進行中Issue

### #29 Repository整備（本件）
- 優先度: P1
- 状態: 進行中（正本docs整備）
- 目的: 会話非依存で現状把握できるリポジトリへ移行
- 成果物: `project-overview` / `current-status` / `active-issues` / `system-overview` と docs骨格
- 要確認: 既存docsの重複統合方針（段階的移行）

### #31 Repository整備（docs/logs 正本化）
- 優先度: P2
- 状態: 進行中
- 目的: `docs/logs/` の実体化とログ運用導線の確立
- 成果物: `docs/logs/README.md` と関連docsの最小導線修正
- 依存関係: #29 で定義した Canonical Source Rules

## 継続監視トピック
- 実行隔離の強化（簡易Runnerからの移行）
- queueの本格運用方式
- SQLiteから将来RDBへの移行計画
- hidden tests保護運用の監査強化

## 更新ルール
- Issue完了時: 状態を「完了」に更新し、必要なら `docs/reports/` へ成果サマリを移管
- 新規Issue追加時: 優先度・背景・依存関係・非目的を明記
- 週次見直し: 優先度と着手順の棚卸しを実施
