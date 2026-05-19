# active-issues（正本）

最終更新: 2026-05-19

## この文書の目的
進行中/未解決課題を、優先順位と依存関係付きで管理する。

## 優先度定義
- P0: セキュリティ/可用性/法令順守を阻害
- P1: 直近スプリントで解決すべき重要課題
- P2: 改善課題（計画的に対応）

## 進行中Issue

- #65 PR #64 / Issue #63 マージ後の Source of Truth 同期
  - 優先度: P1
  - 状態: Open（Docs Sync Final Check）
  - 目的: `current-status` / `active-issues` / logs / ai-prompts を、Issue #63 完了・PR #64 merge 済みの状態に同期する。
  - 非目的: 実装コード追加、技術スタック確定、DB/API/認証/インフラ設計の確定。

## Recently Completed

### #63 （完了済み）
- 優先度: P1
- 状態: 完了
- 完了日: 2026-05-18
- 関連PR: #64（merged）
- 反映内容: main で残存していた「#63 Active 扱い」を解消し、Source of Truth を最新化。
- 補足: 仕様確定前の実装は行わず、docs 整合のみを対象に運用。

## Next Issue Candidates（高リスク領域）

1. 位置情報/走行履歴のデータ最小化・保持期間・削除要件整理（P0候補）
2. 交通情報/オービス情報の配信境界と法令・利用規約整合の整理（P0候補）
3. 画像投稿/コミュニティ機能のモデレーション・通報・監査ログ要件整理（P1候補）

## Branch Cleanup

- PR #64 の head branch: 状態確認保留。
- 保留理由: docs 同期作業環境では GitHub 側の最終削除状態を確証できないため。
- 次対応: maintainer が GitHub 上で deleted/active を確認し、必要なら削除実施後に記録を更新する。
