# current-status（正本）

最終更新: 2026-05-15

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
- Issue #37（Runner安全性レビュー）はレビュー記録を完了し、設計フォロー（Issue #44）とADR正式化（Issue #46）を完了。Issue #48 / #50 / #52 / #54 / #56 は完了し、Issue #58 でcontainer runtime timeout hardeningを進行中。

## 稼働中の基盤
- 採点は Worker 経由の非同期処理。
- API本体で提出コードを直接実行しない。
- visible/hidden tests は分離運用。
- hidden tests 詳細は learner-safe レスポンスで非公開。

## 直近完了事項
- Issue #56（container runtime強制PoC実装）完了。feature flag前提で container runtime 経路（docker unavailable/runtime failure/timeout 正規化、network deny/read-only/tmpfs/resource limits）を実装。
- Issue #58（container runtime timeout hardening）着手。host-side timeout と Alpine timeout 互換性の改善を進行中。
- Issue #54（runtime制約実強制PoC検証）完了。container runtime強制を採用し、local-only / non-production 前提の実装方針・リスク・rollbackを確定。
- Issue #52（Runner隔離PoC stdin / child error handling）完了。EPIPE/ENOENT系失敗正規化・二重resolve防止を実装し、PoC経路のworker異常終了リスクを低減。
- Issue #50（Runner隔離実行PoC hardening）完了。payload stdin化・structured failure payload保持・production guardを適用。
- Issue #48（Runner隔離実行PoC）完了。feature flag前提の最小隔離経路を実装し、PoC結果・リスク・handoffを記録。
- Issue #46（Runner隔離実行基盤 ADR化）完了。`docs/adr/ADR-001-runner-isolation-container-jobs.md` で隔離方式・制限値・返却境界・rollback方針を正式化。
- Issue #44（Runner隔離実行基盤 設計整理）で採用案/却下案/トレードオフを文書化。
- Issue #37（Runner安全性レビュー）結果をdocs/reportsへ記録済み。実装修正はfollow-up Issueへ分離予定。
- Issue #41: Source of Truth再整合（Issue #37の意味付け是正）完了。
- Issue #10: 正本docs同期運用の初期整備（PR #15で反映）完了。
- Issue #14: Source of Truth同期漏れの是正（PR #15マージ）完了。
- Issue #29: Repository整備（正本docs骨格の整備）完了。
- Issue #31: `docs/logs/` 正本化と運用導線の整備完了。

## 既知問題（詳細は active-issues を参照）
- 本番隔離実行基盤は未整備（現行Runnerは簡易実行）。
- queue とDBは将来の本格運用を見据えた移行余地あり。
- Issue/PR 完了時の docs 同期運用は、更新漏れ防止ルールの定着が必要。

## 優先順位（直近）
1. Issue #58（container runtime timeout hardening）の完了（host-side timeout と timeout command 互換性確保）
2. 正本docsの継続運用定着（Issue/PR完了時の同期ルール徹底）
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
