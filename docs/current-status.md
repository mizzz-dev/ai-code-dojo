# current-status（正本）

最終更新: 2026-07-23（Issue #106 retry再投入失敗時のqueued attempt終端化を実装中）

## この文書の目的
「今どこまで実装済みか」を短時間で把握するための現況スナップショット。

## 今の状態（要約）
- ai-code-dojo は、AI生成コードのバグ修正・機能追加を実務フローで学ぶ練習プラットフォームとしてMVP運用を継続中。
- docs正本（`current-status` / `active-issues`）は ai-code-dojo 文脈を Source of Truth とし、他プロダクト文脈の混入を禁止する。
- attempt単位idempotency key、SQLite migration順序、submission単位completion guard、retry state machineを段階導入済み。
- Issue #99 / PR #100 でWorker起動時の `queued` submission回収と条件付きclaimを実装した。
- Issue #101 / PR #103 でstale `running` recoveryのlease / heartbeat / attempt fencing設計を確定した。
- Issue #102 / PR #104 でlease付きclaim、heartbeat、fenced non-terminal・terminal updateを実装し、2026-07-23にmerge済み。
- PR #104のマージ後レビューで、retry再投入失敗時に新attemptが `queued` のまま残るP1不具合を確認した。
- Issue #106 / PR #107 でqueued retry attempt専用のfenced `infra_failed` 終端化を実装中。
- Issue #105のstale scanner実装はIssue #106 / PR #107のmerge後に着手する。
- 不変条件（API本体で提出コードを直接実行しない、hidden testsは内部専用、challengeはversion追加方式）を維持する。

## 稼働中の運用基盤
- Canonical Source: `README.md` / `docs/project-overview.md` / `docs/current-status.md` / `docs/active-issues.md` / `docs/architecture/system-overview.md`
- 採点系は API→Worker 非同期連携を維持し、API直接実行は禁止。
- Workerは起動時にDB上の `queued` submissionを回収する。
- `queued -> running` はattempt / idempotency key / completion guard条件付きclaimで一件だけ成功させる。
- heartbeat有効時はprocessing leaseを保存し、heartbeat・状態更新・terminal保存をattempt/key/lease期限でfenceする。
- learner-safe / internal境界を維持し、hidden tests詳細、attempt key、lease、heartbeat情報は学習者向け返却禁止。
- CIは lint / typecheck / unit / integration / schema validation / build / docs validationを品質ゲートとする。

## 進行中事項
- Issue #106: queued retry attempt専用のfenced `infra_failed` 終端化経路を追加する。
- Issue #106: submission id / status=`queued` / completion guard未設定 / expected attempt / expected keyを更新条件とする。
- Issue #106: retry再投入先が到達不能または非2xxでもsubmissionをterminal状態へ到達させる。
- Issue #106: learner-safeでは `failed` へ抽象化し、内部ログ・attempt key・lease情報を露出しない。
- Issue #105: PR #107 merge後にstale候補一覧 / recovery transaction / periodic scannerへ着手する。

## 直近完了事項
- Issue #102 / PR #104 を完了し、processing lease関連列、lease付きclaim、heartbeat、attempt fencing、fenced terminal保存を実装した。
- Issue #101 / PR #103 を完了し、stale `running` / `legacy_running` の定義、lease所有権、heartbeat、attempt fencing、rollout / rollback方針を確定した。
- Issue #99 / PR #100 を完了し、Worker起動時に `queued` submissionを回収して既存採点経路へ戻す導線を実装した。
- Issue #96 / PR #97 / PR #98 でWorker retry再投入先と終端済みsubmission保護を補強した。
- PR #95 でWorkerのinfrastructure failure経路へretry state machineを統合した。
- Issue #93でcompletion guardとretry attemptの互換性を回復した。
- Issue #91でsubmission単位completion guardを実装した。
- Issue #89でSQLite既存DB migration順序を修正した。
- Issue #87でattempt単位idempotency keyを実装した。

## 優先順位（直近）
1. Issue #106 / PR #107: retry再投入失敗時にqueued attemptをfenceして `infra_failed` へ終端化する。
2. Issue #105: stale候補一覧 / recovery transaction / periodic scanner / attempt上限判定を実装する。
3. 後続P1: queue運用改善（visibility timeout / DLQ / backoff）を現行構成と将来queue基盤に分けて設計する。
4. 後続P2: completion guard / heartbeat / retry判断理由の監査ログ粒度を拡張する。

## branch cleanup 状態
- PR #104 は2026-07-23にmerge済み。
- PR #104のhead branch `feat/submission-processing-lease-heartbeat` の削除状態はGitHub UIで確認する。
- Issue #106の作業branchは `fix/finalize-queued-retry-enqueue-failure`。
- PR #107 merge後にhead branchを削除する。

## 参照先
- 進行中Issue: `docs/active-issues.md`
- Issue #106: `https://github.com/mizzz-dev/ai-code-dojo/issues/106`
- PR #107: `https://github.com/mizzz-dev/ai-code-dojo/pull/107`
- 後続Issue #105: `https://github.com/mizzz-dev/ai-code-dojo/issues/105`
- Issue #102: `https://github.com/mizzz-dev/ai-code-dojo/issues/102`
- PR #104: `https://github.com/mizzz-dev/ai-code-dojo/pull/104`
- stale running設計: `docs/reports/2026-07-22-stale-running-lease-recovery-design.md`
- Worker障害復旧runbook: `docs/runbooks/2026-05-18-worker-failure-recovery-runbook.md`