# current-status（正本）

最終更新: 2026-07-23（Issue #105 stale running自動回収を実装中）

## この文書の目的
「今どこまで実装済みか」を短時間で把握するための現況スナップショット。

## 今の状態（要約）
- ai-code-dojo は、AI生成コードのバグ修正・機能追加を実務フローで学ぶ練習プラットフォームとしてMVP運用を継続中。
- docs正本（`current-status` / `active-issues`）は ai-code-dojo 文脈を Source of Truth とし、他プロダクト文脈の混入を禁止する。
- attempt単位idempotency key、SQLite migration順序、submission単位completion guard、retry state machineを段階導入済み。
- Issue #99 / PR #100 でWorker起動時の `queued` submission回収と条件付きclaimを実装した。
- Issue #101 / PR #103 でstale `running` recoveryのlease / heartbeat / attempt fencing設計を確定した。
- Issue #102 / PR #104 でlease付きclaim、heartbeat、fenced non-terminal・terminal updateを実装した。
- Issue #106 / PR #107 でretry再投入失敗時のqueued attemptをfenceして `infra_failed` へ終端化するP1修正を完了した。
- Issue #105 / PR #108 でlease期限切れ `running` のstartup / periodic scannerと安全なnew attempt回収を実装中。
- 不変条件（API本体で提出コードを直接実行しない、hidden testsは内部専用、challengeはversion追加方式）を維持する。

## 稼働中の運用基盤
- Canonical Source: `README.md` / `docs/project-overview.md` / `docs/current-status.md` / `docs/active-issues.md` / `docs/architecture/system-overview.md`
- 採点系は API→Worker 非同期連携を維持し、API直接実行は禁止。
- Workerは起動時にDB上の `queued` submissionを回収する。
- `queued -> running` はattempt / idempotency key / completion guard条件付きclaimで一件だけ成功させる。
- heartbeat有効時はprocessing leaseを保存し、heartbeat・状態更新・terminal保存をattempt/key/lease期限でfenceする。
- retry再投入失敗時は現在のqueued attemptだけを条件付きで `infra_failed` へ終端化する。
- learner-safe / internal境界を維持し、hidden tests詳細、attempt key、lease、heartbeat情報は学習者向け返却禁止。
- CIは lint / typecheck / unit / integration / schema validation / build / docs validationを品質ゲートとする。

## 進行中事項
- Issue #105: `status = running` / completion guard未設定 / lease非NULL / lease期限切れだけをstale候補として取得する。
- Issue #105: submission id / expected attempt / expected key / expected lease expiry付きtransactionに成功した処理だけが回収する。
- Issue #105: retry上限未満では `retry_pending -> queued(new attempt/key)`、上限到達時は `infra_failed` へ一意に終端化する。
- Issue #105: Worker起動時と定期scannerをfeature flagで段階導入する。
- Issue #105: scanner interval / batch size / concurrencyを設定・検証し、多重scanを抑止する。
- Issue #105: leaseがNULLの `legacy_running` は自動回収しない。
- Issue #105: recovery後の再投入失敗時はIssue #106のqueued attempt専用終端化経路を利用する。

## 直近完了事項
- Issue #106 / PR #107 を完了し、retry再投入失敗時に新attemptが `queued` のまま残るP1不具合を修正した。
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
1. Issue #105 / PR #108: stale候補一覧 / recovery transaction / startup・periodic scanner / attempt上限判定を実装・検証する。
2. 後続P1: queue運用改善（visibility timeout / DLQ / backoff）を現行構成と将来queue基盤に分けて設計する。
3. 後続P2: completion guard / heartbeat / retry・recovery判断理由の監査ログ粒度を拡張する。
4. 後続P2: SQLiteから将来RDB / 外部queueへ移行する境界と運用計画を整理する。

## branch cleanup 状態
- PR #107 は2026-07-23にmerge済み。
- PR #107のhead branch `fix/finalize-queued-retry-enqueue-failure` の削除状態はGitHub UIで確認する。
- Issue #105の作業branchは `feat/stale-running-recovery-scanner`。
- PR #108 merge後にhead branchを削除する。

## 参照先
- 進行中Issue: `docs/active-issues.md`
- Issue #105: `https://github.com/mizzz-dev/ai-code-dojo/issues/105`
- PR #108: `https://github.com/mizzz-dev/ai-code-dojo/pull/108`
- Issue #106: `https://github.com/mizzz-dev/ai-code-dojo/issues/106`
- PR #107: `https://github.com/mizzz-dev/ai-code-dojo/pull/107`
- stale running設計: `docs/reports/2026-07-22-stale-running-lease-recovery-design.md`
- stale running ADR: `docs/adr/2026-07-22-stale-running-lease-recovery.md`
- Worker障害復旧runbook: `docs/runbooks/2026-05-18-worker-failure-recovery-runbook.md`
