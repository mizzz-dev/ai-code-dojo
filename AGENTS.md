# AGENTS.md

## プロジェクトの目的
AI生成コードのバグ修正・機能追加を学習できる練習プラットフォームの実務運用土台を整備する。

## MVPの対象範囲
- 問題スキーマ、サンプル問題、runner interface、CI/CD土台
- 対象言語優先: TypeScript/JavaScript, Python, SQL, HTML/CSS

## MVPの対象外
- 本番レベルの隔離実行基盤の完成
- 高度な認証認可、課金、分析機能

## 開発時の原則
- 既存コード・既存構成を尊重すること
- 無関係な変更、不要なリファクタ、不要な命名変更は禁止
- 差分は小さく、責務分離し、レビューしやすくする

## 日本語で書く対象
- PR本文
- レビュー向け文面
- 運用ドキュメント

## 問題追加時のルール
- `packages/problem-schema` の定義に準拠する
- `visibleTests` と `hiddenTests` を必ず分離する
- 言語・難易度・タイプ・タグを明示する

## ランナー追加時のルール
- `packages/runner-sdk` の interface を満たす
- API本体で提出コードを直接実行しない
- タイムアウト/メモリ上限/ログ出力方針を明示する

## workflow変更時の注意点
- `develop.yml` の品質ゲート（lint/typecheck/test/schema/build）を維持する
- staging/production は environment secrets/vars 前提で分離する
- 失敗時に原因追跡しやすいログ粒度を保つ

## セキュリティ制約
- 任意コードは分離環境でのみ実行する
- hidden tests はユーザーへ露出しない
- secrets は GitHub Environment 経由で参照する

## テスト追加方針
- unit/integration/schema validation を最低ラインとして追加
- 新機能には成功系と失敗系を含める
