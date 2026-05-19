# current-status（正本）

最終更新: 2026-05-19

## この文書の目的
「今どこまで実装済みか」を短時間で把握するための現況スナップショット。

## 今の状態（要約）
- RouteGarage はウォーターフォール開発・Issue駆動で進行中。
- 現在フェーズは要件定義〜基本設計前であり、仕様確定前の実装は行わない。
- PR #64 は merge 済み、Issue #63 は完了済みとして Source of Truth を同期した。
- docs正本（`current-status` / `active-issues`）および `docs/logs/` / `docs/ai-prompts/` の証跡運用を継続する。
- AI生成物は人間レビュー必須の運用を継続する。

## 稼働中の運用基盤
- Repository内 docs を Source of Truth として扱う。
- PR本文、Issueコメント、作業ログ、AIプロンプトログ、handoff、各種ドキュメントは日本語で統一する。
- merge 後は docs 正本同期と branch cleanup 確認を必須化する。

## 直近完了事項
- Issue #63 完了後の docs 同期（Issue #65）を実施し、`active-issues` から #63 を除外、Recently Completed へ移動。
- PR #64 merge 済み状態を `current-status` / `active-issues` / 作業ログへ反映。

## 既知の高リスク領域（仕様追加は未実施）
- 位置情報
- 走行履歴
- 交通情報
- オービス情報
- 画像投稿
- コミュニティ機能

## 優先順位（直近）
1. 高リスク領域の要件棚卸し Issue（位置情報・走行履歴のデータ境界/保持方針）
2. 高リスク領域の公開範囲定義 Issue（交通情報・オービス情報の表示/非表示ルール）
3. 高リスク領域の投稿系統制 Issue（画像投稿・コミュニティ機能のモデレーション/監査ログ方針）
4. docs 正本運用の継続（merge後同期チェック + branch cleanup記録）

## branch cleanup 状態
- PR #64 に紐づく作業branchは、削除状況の最終確認が未取得のため「確認保留」。
- 保留理由: 本Issueは repository docs 同期を主目的とし、GitHub UI 側の branch 削除実行権限/実行結果がこの作業環境からは確証できないため。
- 対応方針: maintainer が PR #64 の head branch 状態（deleted / active）を確認し、`docs/active-issues.md` の branch cleanup 記録へ追記する。

## 参照先
- 進行中Issue: `docs/active-issues.md`
- 作業ログ: `docs/logs/2026-05-19-issue-65.md`
- AIプロンプトログ: `docs/ai-prompts/2026-05-19-issue-65-status-sync.md`
