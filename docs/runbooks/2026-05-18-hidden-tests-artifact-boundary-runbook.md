# 2026-05-18 hidden tests / internal artifact 境界 監査Runbook（Issue #64）

## 目的
- learner-safe / internal 境界の漏洩兆候を一次切り分けする。

## トリガー
- learner向けレスポンスに hidden詳細が含まれる疑い。
- timeout/runtime failure 後に hidden由来情報が表示された疑い。
- internal artifact 参照権限の逸脱疑い。

## 一次確認手順
1. `GET /api/submissions/:id` を guest/learner/admin で比較し、`result.internal` と `result.logs` の返却差分を確認する。
2. Worker 実行ログで hidden 側が固定文言として扱われているかを確認する。
3. timeout/runtime failure の該当submissionで、learner-safe返却に hidden詳細文字列が混入していないか確認する。
4. `/api/admin/*` が admin ロールでのみ参照可能かを再確認する。

## エスカレーション条件
- learner-safe 返却に hidden詳細または internal logs が混入していた場合は P0 扱いで即時エスカレーション。
- artifact 境界逸脱（非admin参照）が確認された場合は P0 扱い。

## 恒久対応の論点（別Issue）
- ログ境界のCI自動検査。
- artifact参照監査ログ（誰が・いつ・何を参照）の実装。
