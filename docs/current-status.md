# current-status（正本）

最終更新: 2026-05-18

## この文書の目的
「今どこまで実装済みか」を短時間で把握するための現況スナップショット。

## 今の状態（要約）
- 学習者向け主要導線（一覧/詳細/提出/結果）は実装済み。
- 認証・認可MVP（learner/adminロール、管理導線保護）は実装済み。
- ログイン可用性改善（401/502の分離）は実装済み。
- challenge/submission は SQLite 永続化へ移行済み。
- challenge version 管理と publish 状態遷移が運用可能。
- docs正本（`project-overview` / `current-status` / `active-issues` / `system-overview`）および `docs/logs/` の基盤整備は完了。
- PR #15 / Issue #14 完了後の Source of Truth 同期方針を反映済み。
- Issue #37（Runner安全性レビュー）はレビュー記録を完了し、設計フォロー（Issue #44）とADR正式化（Issue #46）を完了。Issue #48 / #50 / #52 / #54 / #56 / #58 / #60 / #62 / #64 / #66 / #68 / #71 / #73 は完了。
- PR #74 で追加された post-merge docs sync checklist を運用適用し、Issue #73 完了後の docs 正本不整合を解消。
- Issue #75（Worker障害時の採点停止・再試行・失敗扱い・復旧方針の設計/運用ドキュメント化）を進行中として運用開始。

## 稼働中の基盤
- 採点は Worker 経由の非同期処理。
- API本体で提出コードを直接実行しない。
- visible/hidden tests は分離運用。
- hidden tests 詳細は learner-safe レスポンスで非公開。

## 直近完了事項
- Issue #73（post Issue #71 docs 同期漏れ防止チェックリスト整備）完了。PR #74 merged / Issue #73 closed を docs 正本へ同期。
- Issue #71（Issue #68 完了後の docs 正本同期と next task の単一化）完了。Issue/PR 状態と docs の整合を復旧し、次タスクを Issue #73 に明確化。
- Issue #68（timeout/runtime failure 経路の hidden由来文字列非露出検証）完了。PR #69 のレビュー指摘を PR #70 で解消し、隔離実行経路で learner-safe 境界維持を確認。
- Issue #64（hidden tests / internal artifact / learner-safe 境界レビュー）完了。review/handoff/runbook/risks を整備し、follow-up として Issue #66 を起票。

## 既知問題（詳細は active-issues を参照）
- 本番隔離実行基盤は未整備（現行Runnerは簡易実行）。
- queue とDBは将来の本格運用を見据えた移行余地あり。
- Worker障害時の再試行/復旧は実装前段階であり、設計方針に基づく段階実装が必要。

## 優先順位（直近）
1. Issue #75（Worker障害時の採点停止・再試行・失敗扱い・復旧方針の設計/運用ドキュメント化）
2. 正本docsの継続運用定着（runbook に基づく merge後チェックの習慣化）
3. テスト安定化と運用ドキュメント拡充
4. 実行隔離・キュー・DBの段階的強化

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
- 作業ログ運用: `docs/logs/README.md`
