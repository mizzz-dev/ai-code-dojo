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
- `apps/web`: 学習者向けルート（問題一覧/詳細/提出結果/進捗/ダッシュボード）の実データUI
- `apps/api`: challenge取得・submission作成/取得API
- `apps/worker`: submission採点ジョブ処理
- `packages/problem-schema`: 問題定義スキーマ/型
- `packages/runner-sdk`: runner interface / normalize
- `problems/examples`: サンプル問題


## 正本ドキュメント（Canonical Source）
- システム概要: `docs/project-overview.md`
- 現在状態: `docs/current-status.md`
- 進行中Issue: `docs/active-issues.md`
- アーキテクチャ概観: `docs/architecture/system-overview.md`
- 作業ログ: `docs/logs/`
- AI prompts: `docs/ai-prompts/`
- ADR: `docs/adr/`
- 進捗レポート: `docs/reports/`
- リスク: `docs/risks/`
- runbook: `docs/runbooks/`

## docsの役割分担
- `README.md`: 初回導線と起動手順
- `docs/project-overview.md`: 全体像と正本ルール
- `docs/current-status.md`: 現況スナップショット
- `docs/active-issues.md`: 進行中課題と優先順位
- `docs/architecture/system-overview.md`: 構成概観
- `docs/architecture.md`: 実装詳細・補足
- `docs/requirements.md`: 要件定義
- `skills.md`: 運用スキル/作業手順

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

## UI実装ルール（学習者向け基盤）
- デザイントークンは `packages/ui/src/tokens/tokens.css` に集約し、直書きを避ける。
- 共通UIは `packages/ui/src/components`、レイアウトは `packages/ui/src/layout` に分離する。
- 学習者向けShellは `apps/web/src/ui/learner-shell.tsx` を基準に拡張する。
- レスポンシブは Desktop/Tablet/Mobile の3段階で崩れない構成を優先する。


## 学習者UIの実画面適用（Issue #16）
- 新UI適用ルート: `/`, `/challenges/:slug`, `/submissions/:id`, `/progress`, `/dashboard`
- submission導線: challenge詳細の提出フォーム → `POST /api/submissions` → 結果画面で `GET /api/submissions/:id` をポーリング
- 状態表示: loading/empty/error/success を全画面で統一トーンにし、API失敗時も復帰可能なメッセージを表示

## ログイン障害時の挙動（Issue #23）
- `/login` は API `POST /api/auth/login` 呼び出しを例外保護し、API到達不能時もWebサーバーは継続稼働します。
- 認証失敗（401）は「ユーザー名またはパスワードを確認」メッセージを返します。
- 基盤障害（API停止/誤設定など）は 502 と再試行メッセージを返します。

## 認証・認可（MVP）
- ロール: `learner`, `admin`
- Webログイン: `/login`
- 必須環境変数: `ADMIN_PASSWORD`, `LEARNER_PASSWORD`（未設定時は安全側で認証失敗）
- 保護対象:
  - Web: `/admin/challenges`, `/admin/challenges/:id`
  - API: `/api/admin/*`
- 提出結果APIは learner-safe をデフォルト返却し、internal情報は admin のみ参照可能。


## DB運用（Issue #27）
- challenge / challenge_versions / submissions は SQLite（`.data/app.db`）へ保存されます。
- 旧JSON（`apps/api/data/challenges-admin.json`, `.data/submissions.json`）がある場合、初回起動時に自動移行します。
- 明示的に実行する場合は `pnpm db:migrate` / `pnpm db:seed` を使います。
