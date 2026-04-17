# requirements（MVP）

## 1. プロダクト要件
- 学習者は問題文を読み、ブラウザ上でコード編集し、テスト実行後に提出できる。
- 初期対応は TypeScript/JavaScript, Python, SQL, HTML/CSS を優先する。
- hidden tests は学習者に非公開とし、採点時のみ利用する。

## 2. 非機能要件
- 提出コードはアプリ本体プロセスで直接実行しない。
- 問題追加・言語追加・ランナー追加時に影響範囲を限定できる設計にする。
- CI で lint/typecheck/test/schema validation/build を自動化し、失敗時は即停止する。

## 3. MVP対象
- 問題定義スキーマ
- サンプル問題（bugfix, feature, sql）
- Runner SDK インターフェース
- CI/CDワークフローの初期土台

## 4. MVP対象外（現時点）
- 本番運用可能なサンドボックス実装
- 認証認可の詳細実装
- 課金・ランキング・学習分析機能

## 5. 要確認事項
- 実運用時の runner 基盤（Kubernetes/バッチ/SaaS）
- DB 選定（PostgreSQL など）
- デプロイ先（Cloud Run / ECS / Kubernetes など）
