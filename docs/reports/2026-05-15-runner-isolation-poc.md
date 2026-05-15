# Runner隔離実行PoCレポート（Issue #48）

- 日付: 2026-05-15
- 対象Issue: #48
- 関連ADR: `docs/adr/ADR-001-runner-isolation-container-jobs.md`

## 目的
Worker から短命ジョブ実行経路を呼び出す最小PoCを追加し、既存経路を壊さずに隔離実行導線を検証する。

## 実装方針（最小差分）
- `RUNNER_ISOLATION_POC=1` のときのみ PoC 経路を有効化（defaultは既存経路）。
- Worker は submission 取得・状態更新責務を維持し、実行責務のみ child process へ委譲。
- learner-safe 返却境界は維持し、hidden tests の詳細ログは返却しない。
- 本PoCは local-only / non-production 前提。

## PoCで確認した制約
- network deny: **設計反映のみ**（実OS制約は未適用。follow-upでコンテナruntime設定へ移管）。
- read-only rootfs: **未適用**（PoCでは一時ディレクトリ隔離のみ）。
- 一時ディレクトリ: jobごとに `mkdtemp` を使って分離し、実行後に削除。
- artifact whitelist: `results.json` / `stdout.log` / `stderr.log` のみ内部artifactとして扱う。
- timeout/kill: soft timeout(SIGTERM)→3秒後SIGKILL の正規化を実装。

## 検証結果
- 既存経路（flag off）: 影響なし。
- PoC経路（flag on）: Worker→isolated job script の実行と結果返却を確認。
- hidden tests: learner-safeログに詳細を出さない不変条件を維持。

## 非目的（今回実施しない）
- 本番コンテナオーケストレーション統合
- DB schema/migration/seed 変更
- auth/admin ロジック変更
- UI変更
- durable queue 導入

## 次アクション
1. 実ランタイムで network deny / read-only rootfs / tmpfs を強制。
2. kill reason を `runner-sdk` の失敗型へ統一。
3. internal artifact 保存期間・監査ログは別Issueで設計。
