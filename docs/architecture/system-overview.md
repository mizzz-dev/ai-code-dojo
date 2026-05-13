# system-overview（正本）

最終更新: 2026-05-13

## この文書の目的
実装詳細に入る前に、システム境界・責務分担・データフローを把握するためのアーキテクチャ概観を提供する。

## システム境界
- 学習者: Web UIから問題取得・提出・結果確認
- API: challenge/submission/admin の公開境界と認可制御
- Worker: 採点ジョブ実行と結果保存
- Runner: テスト実行と結果正規化

## 高レベル構成
1. Web が API から challenge を取得
2. Web が API に submission を作成
3. API が Worker に採点依頼
4. Worker が Runner で visible/hidden tests を実行
5. Worker が結果を保存
6. Web が submission 結果をポーリング表示

## データ管理
- challenge本体: `challenges` + `challenge_versions`
- submission: `submissions`
- 永続化: SQLite（`.data/app.db`）

## セキュリティ境界
- learner-safe と internal レスポンスを分離
- hidden tests 詳細は learner へ非公開
- `/api/admin/*` は admin ロール必須

## 重要な不変条件
- API本体で提出コードを直接実行しない
- challenge編集は version追加方式（既存version上書き禁止）
- publish状態で学習者公開を制御

## 依存関係と制約
- 現行Runnerは簡易実行（将来は隔離強化が前提）
- キューは簡易HTTP連携（将来置換想定）
- ドキュメント正本は `docs/project-overview.md` の Canonical Source Rules に従う

## 詳細文書への導線
- 実装詳細: `docs/architecture.md`
- 要件定義: `docs/requirements.md`
- 現在状態: `docs/current-status.md`
