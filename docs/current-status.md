# current-status（正本）

最終更新: 2026-07-23（Issue #109 queue運用設計を実施中）

## この文書の目的
「今どこまで実装済みか」を短時間で把握するための現況スナップショット。

## 今の状態（要約）
- Repositoryのcanonical full nameは `mizzz-ivr/ai-code-dojo`。旧 `mizzz-dev/ai-code-dojo` URLはGitHub redirect対象だが、現行参照先は新full nameを使用する。
- ai-code-dojo は、AI生成コードのバグ修正・機能追加を実務フローで学ぶ練習プラットフォームとしてMVP運用を継続中。
- docs正本（`current-status` / `active-issues`）は ai-code-dojo 文脈を Source of Truth とし、他プロダクト文脈の混入を禁止する。
- attempt単位idempotency key、SQLite migration順序、submission単位completion guard、retry state machineを段階導入済み。
- Worker起動時queued回収、processing lease / heartbeat、attempt fencing、stale running自動回収まで実装済み。
- Issue #105 / PR #108は2026-07-23にmerge・完了した。
- Issue #109 / PR #110で現行HTTP queueと将来外部queueのvisibility timeout・DLQ・backoff運用方針をdocs-onlyで設計中。
- 不変条件（API本体で提出コードを直接実行しない、hidden testsは内部専用、challengeはversion追加方式）を維持する。

## 稼働中の運用基盤
- Canonical Source: `README.md` / `docs/project-overview.md` / `docs/current-status.md` / `docs/active-issues.md` / `docs/architecture/system-overview.md`
- 採点系は API→Worker 非同期連携を維持し、API直接実行は禁止。
- 現行enqueueはAPIからWorker `POST /jobs`への同期HTTPであり、Worker 202はprocess内受理を示す。
- Workerは起動時にDB上の `queued` submissionを回収する。
- `queued -> running` はattempt / idempotency key / completion guard条件付きclaimで一件だけ成功させる。
- heartbeat有効時はprocessing leaseを保存し、heartbeat・状態更新・terminal保存をattempt/key/lease期限でfenceする。
- retry再投入失敗時は現在のqueued attemptだけを条件付きで `infra_failed` へ終端化する。
- stale recovery有効時はlease期限切れrunningだけをnew attempt / new keyへ回収する。
- learner-safe / internal境界を維持し、hidden tests詳細、attempt key、lease、heartbeat、queue内部情報は学習者向け返却禁止。
- CIは lint / typecheck / unit / integration / schema validation / build / docs validationを品質ゲートとする。

## 進行中事項
- Issue #109: delivery semanticsをat-least-once前提として確定する。
- Issue #109: queue messageをsubmission ID / grading attempt / attempt key / schema version等の最小参照情報へ限定する。
- Issue #109: HTTP 202とdurable enqueueを区別し、consumer ackをDB永続化後に限定する。
- Issue #109: queue visibility timeoutとDB processing lease / attempt fencing / completion guardの責務を分離する。
- Issue #109: transport retryとgrading attempt retryを分離し、backoff / jitter / max delivery countを整理する。
- Issue #109: DLQ投入条件、保持情報、禁止情報、replay / purge / retention / access controlを整理する。
- Issue #109: external queue導入時のtransactional outbox、rollout / rollback、observability、後続Issue分割を確定する。

## 直近完了事項
- Issue #105 / PR #108 を完了し、lease期限切れrunningのstartup / periodic scanner、安全なnew attempt回収、retry上限判定、再投入失敗終端化を実装した。
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
1. Issue #109 / PR #110: 現行HTTP queueと将来外部queueのdelivery / ack / visibility / retry / DLQ責務を確定する。
2. 後続P1-1: queue port / message contract / HTTP adapterをbehavior changeなしで分離する。
3. 後続P1-2: queue transport observabilityを実装する。
4. 後続P1-3: application retry backoff seamを実装する。
5. 後続P2: external queue / transactional outbox PoCとDLQ opsを分離して進める。

## branch cleanup 状態
- PR #108 は2026-07-23にmerge済み。
- PR #108のhead branch `feat/stale-running-recovery-scanner` はbranch検索で見つからず、削除済み相当。
- Issue #109の作業branchは `docs/queue-operations-design`。
- PR #110 merge後にhead branchを削除する。

## 参照先
- Repository: `https://github.com/mizzz-ivr/ai-code-dojo`
- 進行中Issue: `docs/active-issues.md`
- Issue #109: `https://github.com/mizzz-ivr/ai-code-dojo/issues/109`
- PR #110: `https://github.com/mizzz-ivr/ai-code-dojo/pull/110`
- Issue #105: `https://github.com/mizzz-ivr/ai-code-dojo/issues/105`
- PR #108: `https://github.com/mizzz-ivr/ai-code-dojo/pull/108`
- queue運用設計: `docs/reports/2026-07-23-queue-operations-visibility-dlq-backoff-design.md`
- queue責務ADR: `docs/adr/2026-07-23-queue-delivery-and-db-fencing-boundary.md`
- stale running設計: `docs/reports/2026-07-22-stale-running-lease-recovery-design.md`
- Worker障害復旧runbook: `docs/runbooks/2026-05-18-worker-failure-recovery-runbook.md`
