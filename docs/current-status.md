# current-status（正本）

最終更新: 2026-05-13

## この文書の目的
「今どこまで実装済みか」を短時間で把握するための現況スナップショット。

## 今の状態（要約）
- 学習者向け主要導線（一覧/詳細/提出/結果）は実装済み。
- 認証・認可MVP（learner/adminロール、管理導線保護）は実装済み。
- ログイン可用性改善（401/502の分離）は実装済み。
- challenge/submission は SQLite 永続化へ移行済み。
- challenge version 管理と publish 状態遷移が運用可能。

## 稼働中の基盤
- 採点は Worker 経由の非同期処理。
- visible/hidden tests は分離運用。
- hidden tests 詳細は learner-safe レスポンスで非公開。

## 既知問題（詳細は active-issues を参照）
- 本番隔離実行基盤は未整備（簡易実行方式）。
- queue とDBは将来の本格運用を見据えた移行余地あり。
- docs正本運用は本Issueで整備開始（継続更新が必要）。

## 優先順位（直近）
1. 正本docsの継続運用定着
2. テスト安定化と運用ドキュメント拡充
3. 実行隔離・キュー・DBの段階的強化

## 触ってはいけない箇所
- hidden tests公開境界（learner-safe）
- `/api/admin/*` の認可境界
- challenge versioning の不変条件（上書き禁止）

## 重要依存関係
- `ADMIN_PASSWORD` / `LEARNER_PASSWORD`
- `RUNNER_API_BASE_URL`, `API_BASE_URL`
- SQLiteファイル `.data/app.db`

## 参照先
- 進行中Issue: `docs/active-issues.md`
- 構成概観: `docs/architecture/system-overview.md`
- 全体方針: `docs/project-overview.md`
