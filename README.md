# ai-code-dojo

ai-code-dojo は、**AI生成コードのバグ修正・機能追加を実務フローで学ぶ**ための練習プラットフォームです。  
単なるアルゴリズム問題ではなく、既存コード読解・テスト実行・差分確認・PR文面作成までを学習体験に含めます。

## このリポジトリで学べること
- 既存コードに対する **bugfix / feature add / SQL修正** の進め方
- visible tests / hidden tests を分けた問題運用の考え方
- 提出コードを本体アプリから分離して扱う runner 設計
- CI/CD と PR運用を含む実務寄りの開発フロー

## モノレポ構成（MVP土台）
- `apps/web`: 学習者向けWeb UI（画面機能は今後実装）
- `apps/api`: 問題取得・提出受付API（実行は runner に委譲）
- `apps/worker`: 非同期処理（採点ジョブ制御の土台）
- `packages/problem-schema`: 問題定義の型・スキーマ
- `packages/runner-sdk`: ランナー共通インターフェース
- `packages/config`: 環境設定ローダ
- `problems/examples`: サンプル問題（visible/hidden 分離）
- `docs`: 要件・設計・運用方針
- `.github/workflows`: CI / deploy ワークフロー

## ローカルセットアップ
```bash
npm install
```

## よく使うコマンド
```bash
npm run lint
npm run typecheck
npm run test:unit
npm run test:integration
npm run schema:validate
npm run build
```

## ドキュメント
- MVP要件: `docs/requirements.md`
- 初期アーキテクチャ: `docs/architecture.md`
- 開発運用ルール: `AGENTS.md`
- 問題追加・ランナー追加ガイド: `skills.md`

## 今後の拡張方針（概要）
- Web/API/Worker の実装具体化（認証、提出管理、実行履歴）
- runner の分離実行基盤（container/job queue）接続
- 問題管理機能（版管理・難易度調整・レビュー運用）
- staging / production へのデプロイ実装具体化
