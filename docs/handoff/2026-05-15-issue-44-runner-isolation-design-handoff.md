# Handoff: Issue #44 Runner隔離実行基盤 設計整理

- 日付: 2026-05-15
- 対象Issue: #44
- 状態: 設計方針の文書化完了（実装未着手）

## 実施済み
- Runner隔離実行基盤の採用案/却下案/トレードオフをレポート化。
- リスク台帳を作成し、監視指標候補を整理。
- Issue #37 → #44 のフォローアップ関係を明記。

## 未実施（意図的に分離）
- runner / Worker 実装修正
- queue / DB schema / migration 変更
- auth/adminロジック変更
- infra本番適用

## 次アクション（推奨順）
1. ADR草案作成（隔離方式・制限値・artifact返却境界を固定）
2. follow-up Issue起票（隔離実行PoC）
3. follow-up Issue起票（冪等化・durable queue）
4. runbook追記（timeout/OOM/kill対応手順）

## 注意事項
- hidden tests の実データは継続して文書・ログへ記載しない。
- learner-safe/internal 境界を維持し、internal artifact は admin 限定閲覧前提で設計する。
