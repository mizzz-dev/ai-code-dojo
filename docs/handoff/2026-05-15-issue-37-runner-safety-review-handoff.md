# Handoff: Issue #37 Runner安全性レビュー

- 日付: 2026-05-15
- 状態: レビュー記録完了（実装変更なし）

## 完了したこと
- Runner / Worker / submission / hidden tests / auth境界の現況レビューを実施。
- リスク優先度（P0/P1/P2）を定義し、暫定対策と恒久対策候補を整理。
- follow-up Issue 候補を優先度付きで提示。

## 次担当への推奨アクション
1. P0: 分離実行基盤の設計Issueを起票（要求: CPU/メモリ/ネットワーク/FS制限）。
2. P1: Workerジョブ冪等化と再試行ポリシー設計Issueを起票。
3. P1: durable queue 導入計画Issueを起票し、障害復旧runbookとセットで整備。
4. P1: submissionログの秘匿ポリシー（マスキング/保持期間/監査）を定義。

## 未対応
- いずれも設計・実装は未着手（本Issueの非目的）。
