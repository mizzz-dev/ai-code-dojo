# project-overview（正本）

最終更新: 2026-05-13

## この文書の目的
`ai-code-dojo` の**全体像と正本ドキュメントの入口**を定義し、会話履歴に依存せずにプロジェクトの現況へ到達できるようにする。

## プロジェクト概要
ai-code-dojo は、AI生成コードのバグ修正・機能追加を、実務フロー（読解→修正→テスト→PR）で学習するための練習プラットフォーム。

## MVPスコープ（現行）
- 問題スキーマ・サンプル問題
- runner interface と採点Worker
- 学習者向けWeb導線（問題一覧/詳細/提出/結果）
- challenge管理の基盤（version管理・publish状態）
- CI/CD土台（lint/typecheck/test/schema/build）

## 非スコープ（現時点）
- 本番レベルの完全隔離実行基盤
- 高度な認証認可・課金・分析基盤
- マルチ言語採点の本格運用

## Canonical Source Rules（正本配置ルール）
- システム概要（本書）: `docs/project-overview.md`
- 現在状態: `docs/current-status.md`
- 進行中Issue/優先順位: `docs/active-issues.md`
- アーキテクチャ概観: `docs/architecture/system-overview.md`
- 作業ログ: `docs/logs/`
- AIプロンプト履歴: `docs/ai-prompts/`
- ADR（設計判断）: `docs/adr/`
- 進捗レポート: `docs/reports/`
- リスク台帳: `docs/risks/`
- Runbook（運用手順）: `docs/runbooks/`

### 更新原則
1. 同一テーマの一次情報は正本へ集約する（重複記述を避ける）。
2. 他文書では要約のみ記述し、正本へのリンクを貼る。
3. 仕様変更時は「背景・判断理由・未確定事項」を明記する。

## 主要コンポーネント
- `apps/web`: 学習者UI
- `apps/api`: challenge/submission/admin API
- `apps/worker`: 非同期採点
- `packages/problem-schema`: 問題スキーマ
- `packages/runner-sdk`: runner契約
- `problems/examples`: 例題

## 重要依存関係
- パッケージ管理: pnpm workspace
- 実行基盤: Node.js
- データ永続化: SQLite（`.data/app.db`）
- テスト実行: `node --test`（現行Runner）

## 触ってはいけない箇所（運用上のガード）
- hidden tests を学習者向けUI/APIへ露出する変更
- API本体で提出コードを直接実行する変更
- challenge version を直接上書きする運用
- 品質ゲート（lint/typecheck/test/schema/build）を外すworkflow変更

## 既存文書との役割分担
- `README.md`: 新規参加者向け導線と起動手順（要点のみ）
- `docs/requirements.md`: 要件定義（何を満たすか）
- `docs/architecture.md`: 実装詳細寄りの補足（履歴を含む）
- `skills.md`: 問題追加・運用手順の実務ノウハウ
