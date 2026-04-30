# ai-code-dojo

ai-code-dojo は、**AI生成コードのバグ修正・機能追加を実務フローで学ぶ**ための練習プラットフォームです。

## 今回のMVPでできること
- 問題一覧表示（Web/API）
- 問題詳細表示（背景・issue・acceptance criteria・out of scope）
- starter code の編集と提出
- Worker による非同期採点（APIプロセスで直接実行しない）
- visible tests 実行結果の表示
- hidden tests を内部実行し、詳細を非公開で集計のみ返却
- 提出結果（pass/fail, ログ, 実行時間）表示

## 今回のMVPで未対応
- 認証・課金・ランキング
- 本番レベルの完全サンドボックス
- JavaScript以外の本格採点ランナー
- 管理画面

## モノレポ構成
- `apps/web`: 問題一覧/詳細/提出結果の最小UI
- `apps/api`: challenge取得・submission作成/取得API
- `apps/worker`: submission採点ジョブ処理
- `packages/problem-schema`: 問題定義スキーマ/型
- `packages/runner-sdk`: runner interface / normalize
- `problems/examples`: サンプル問題

## ローカル起動方法
```bash
pnpm install
```

### 1. Worker起動
```bash
pnpm dev:worker
```

### 2. API起動（別ターミナル）
```bash
RUNNER_API_BASE_URL=http://localhost:8081 pnpm dev:api
```

### 3. Web起動（別ターミナル）
```bash
API_BASE_URL=http://localhost:8080 pnpm dev:web
```

### 4. ブラウザでアクセス
- `http://localhost:3000`

## API一覧
- `GET /api/challenges`
- `GET /api/challenges/:slug`
- `POST /api/submissions`
- `GET /api/submissions/:id`

## サンプル問題の場所
- `problems/examples/js-bugfix-add`
- `problems/examples/ts-feature-user-display`
- `problems/examples/sql-monthly-sales`

## 提出フロー（MVP）
1. Webで `GET /api/challenges` から問題一覧表示
2. Webで `GET /api/challenges/:slug` から詳細とstarter取得
3. Webで提出すると API `POST /api/submissions` が submission 作成
4. API が Worker `/jobs` に採点依頼
5. Worker が visible/hidden tests を実行して結果保存
6. Webで `GET /api/submissions/:id` をポーリングして結果表示

## テスト
```bash
pnpm test:unit
pnpm test:integration
pnpm test:smoke
```

## Challenge 管理運用（MVP+）
- 管理API: `GET/POST /api/admin/challenges`, `GET /api/admin/challenges/:id`, `POST /api/admin/challenges/:id/versions`, `PATCH /api/admin/challenges/:id/publish`
- Challenge は `challenges` と `challenge_versions` の2層管理です。versionは直接上書きせず追加します。
- hidden tests は保存専用で、学習者向けAPIには返却しません。
- 模擬PR表示は `reviewConfig` のテンプレートから `GET /api/challenges/:slug/review-preview` で生成します。
