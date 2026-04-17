# ai-code-dojo

AI生成コードのバグ修正・機能追加を学ぶためのプログラミング練習サイト（MVP）向けモノレポ土台です。

## 目的

- ブラウザで問題を読み、コードを編集し、テスト実行・提出できる学習体験を提供する。
- 問題・言語・実行基盤を将来的に段階拡張できる構成を維持する。
- アプリ本体プロセスと実行環境（runner）を分離し、安全性を担保する。

## モノレポ構成（初期）

- `apps/web`: 学習者向けWebアプリ（土台）
- `apps/api`: 問題取得・提出受付API（土台）
- `apps/worker`: 非同期ジョブ処理（土台）
- `packages/problem-schema`: 問題定義スキーマ
- `packages/runner-sdk`: ランナー共通インターフェース
- `packages/config`: 環境設定ローダ
- `problems/examples`: サンプル問題（visible/hidden test 分離）

## ローカル実行

```bash
npm install
npm run lint
npm run typecheck
npm run test:unit
npm run test:integration
npm run schema:validate
npm run build
```

## ドキュメント

- 要件: `docs/requirements.md`
- アーキテクチャ: `docs/architecture.md`
- 運用指針: `AGENTS.md`
- 作業者向けスキルガイド: `skills.md`
