# architecture（初期設計）

## 全体構成
ai-code-dojo はモノレポで管理し、`apps/*` と `packages/*` を責務分離する。

- `apps/web`: UI責務
- `apps/api`: 問題取得・提出受付・runner連携責務
- `apps/worker`: 非同期ジョブ責務
- `packages/problem-schema`: 問題フォーマット定義
- `packages/runner-sdk`: runner抽象インターフェース
- `packages/config`: 設定読み込み責務

## Web / API / Worker の責務
- **Web**: 問題表示、コード編集、実行/提出UI（hidden testsは扱わない）
- **API**: 問題メタデータ提供、提出作成、runnerジョブ発行。提出コードは直接実行しない。
- **Worker**: 採点ジョブの進行管理、再試行制御、結果の正規化と保存（将来実装）

## 問題スキーマの考え方
`packages/problem-schema` で以下を型・スキーマ化。
- metadata
- statement
- starterCode
- visibleTests / hiddenTests
- runnerConfig
- reviewConfig

これにより、問題追加時のレビュー観点を統一し、`npm run schema:validate` で機械検証できる。

## ランナー抽象化の考え方
`packages/runner-sdk` は runner 実装に依存しない最小契約を提供。

- `prepare`
- `executeVisibleTests`
- `executeHiddenTests`
- `collectArtifacts`
- `normalizeResult`

この抽象化で、言語ごとの実装差分を runner 側に閉じ込める。

## visible / hidden tests 分離方針
- `tests/visible`: 学習者に見せる
- `tests/hidden`: 採点専用。API・Webには返却しない
- hidden tests の配置情報は問題定義に持つが、内容そのものは公開しない運用を前提

## セキュリティ前提
- 任意コードは分離実行環境でのみ実行する。
- API/Worker は実行依頼と結果取得のみ担う。
- secrets は GitHub Environment の secrets/vars 経由で参照する。

## CI/CD 方針
- `develop.yml`: PR/push (develop) で品質ゲート
- `deploy-staging.yml`: develop 更新後に staging へ
- `deploy-production.yml`: main 更新後に production へ
- deploy 前に build/test を必須化し、失敗時はデプロイを止める

### DB migration の扱い
- deploy workflow 上で専用 migration step を実行する想定。
- 現在は `scripts/deploy/deploy.mjs` 内で placeholder として明示し、実基盤確定後に差し替える。

### rollback の考え方
- deploy前に直前のリリース識別子（image tag, revision）を保持する。
- deploy失敗時は直前安定版へ即時切り戻す。
- migration が破壊的変更を含む場合は forward-only ではなく expand/contract を徹底する。

## 今後の拡張ポイント
- 問題作成CLI（雛形生成 + schema自動検証）
- ランナーの言語別アダプタ実装（TS/Python/SQL）
- 提出履歴と採点レポートの永続化
- 観測性（ログ/メトリクス/トレース）基盤の追加
