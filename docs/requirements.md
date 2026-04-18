# requirements（MVP）

## 1. プロダクト要件
- 学習者は問題文を読み、スターターコードを編集し、テストを実行して提出できる。
- 問題は bugfix / feature add / sql の学習体験を中心に提供する。
- 初期対象言語は TypeScript/JavaScript, Python, SQL, HTML/CSS を優先する。

## 2. スコープ
### MVP対象
- モノレポ土台（web/api/worker/packages）
- 問題スキーマ定義 + バリデーション
- サンプル問題（3問以上）
- runner 共通 interface
- develop / staging / production の workflow 土台

### MVP対象外
- 本番レベルの隔離実行基盤の完成
- 高度な認証認可、課金、分析、ランキング
- 本番向け監視運用の完成

## 3. 必須制約
- 提出コードは本体アプリプロセスで直接実行しない。
- hidden tests はユーザーに露出しない。
- 問題追加時は共通フォーマット（problem-schema）に従う。
- CI は lint/typecheck/test/schema validation/build を最低ラインとして維持する。
- PR本文・レビュー向け文面・運用ドキュメントは日本語で記載する。

## 4. 拡張性要件
- 新しい言語ランナーを追加しても API 契約を壊さない。
- 問題追加で既存問題に影響を与えないディレクトリ構造にする。
- workflow 追加時に品質ゲートを保ったままジョブ分割できる構造にする。

## 5. 要確認（未確定）
- runner 実行基盤の実体（Kubernetes Job / ECS Task / 外部サービス）
- DB とキューの最終選定（PostgreSQL / Redis 等）
- 本番デプロイ先（Cloud Run / ECS / Kubernetes）
- DB migration 実行の責務（API 起動時 / CI/CD / 専用ジョブ）
