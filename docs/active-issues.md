# active-issues（正本）

最終更新: 2026-07-23（Issue #105 stale running自動回収を実装中）

## この文書の目的
進行中/未解決課題を、優先順位と依存関係付きで管理する。

## 優先度定義
- P0: セキュリティ/可用性/法令順守を阻害
- P1: 直近スプリントで解決すべき重要課題
- P2: 改善課題（計画的に対応）

## 進行中Issue

### #105 lease期限切れrunning submissionのstale scannerと安全な自動回収を実装する
- 優先度: P1
- 状態: Open / In Progress
- GitHub Issue: `https://github.com/mizzz-dev/ai-code-dojo/issues/105`
- GitHub PR: `https://github.com/mizzz-dev/ai-code-dojo/pull/108`（Draft）
- Linear mirror: `MIZ-34`（In Progress）
- 目的: lease期限切れの `running` submissionをWorker起動時・定期scannerで検出し、新attemptとして安全に回収する。
- 対象:
  - `status = running` / completion guard未設定 / lease非NULL / lease期限切れの候補取得
  - expected attempt / key / lease expiry付きrecovery transaction
  - retry上限未満での `retry_pending -> queued(new attempt/key)`
  - retry上限到達時のcompletion guard付き `infra_failed` 終端化
  - Worker起動時・periodic scanner
  - feature flag / interval / batch size / concurrency設定
  - recovery後の再投入失敗時にIssue #106のqueued attempt専用終端化経路を利用
  - unit / integration test
  - current-status / active-issues / architecture / runbook / logs / ai-prompts / handoff
- 非対象:
  - Redis / BullMQ / Cloud Tasks等の外部queue導入
  - visibility timeout / DLQ / backoff本格実装
  - Runner / hidden tests / auth / admin / UI / deployment変更
  - challengeの直接上書き
  - DB schema / migration / seed変更
- 完了条件:
  - leaseがNULLの `legacy_running` を自動回収しない。
  - 複数scannerが同じ候補を見てもtransaction成功は1件だけになる。
  - stale回収後はattemptとidempotency keyを更新し、旧attempt更新をno-opにする。
  - retry上限到達時は `infra_failed` へ一意に終端化する。
  - scanner失敗でWorkerのhealth endpointを停止しない。
  - learner-safeへhidden tests詳細、attempt key、lease、worker情報を露出しない。
  - lint / typecheck / unit / integration / schema validation / build / docs validationを通過する。

## Recently Completed

### #106 / PR #107 （完了済み）
- 優先度: P1
- 状態: Closed / Merged / Completed
- 完了日: 2026-07-23
- GitHub Issue: `https://github.com/mizzz-dev/ai-code-dojo/issues/106`
- GitHub PR: `https://github.com/mizzz-dev/ai-code-dojo/pull/107`
- Linear: 新規mirrorはworkspace無料枠上限のため作成せず、MIZ-34へblocker情報を記録した。
- 関連資料:
  - `docs/logs/2026-07-23-issue-106-queued-retry-enqueue-failure-finalization.md`
  - `docs/ai-prompts/2026-07-23-issue-106-queued-retry-enqueue-failure-finalization-codex.md`
  - `docs/handoff/2026-07-23-issue-106-queued-retry-enqueue-failure-finalization-handoff.md`
- 反映内容: retry再投入失敗時に現在のqueued attemptだけをattempt/keyでfenceし、completion guardを維持したまま `infra_failed` へ終端化する経路を追加した。

### #102 / PR #104 （完了済み）
- 優先度: P1
- 状態: Closed / Merged / Completed
- 完了日: 2026-07-23
- GitHub Issue: `https://github.com/mizzz-dev/ai-code-dojo/issues/102`
- GitHub PR: `https://github.com/mizzz-dev/ai-code-dojo/pull/104`
- Linear mirror: `MIZ-27`（Done）
- 関連資料:
  - `docs/logs/2026-07-22-issue-102-processing-lease-heartbeat-fencing.md`
  - `docs/ai-prompts/2026-07-22-issue-102-processing-lease-heartbeat-fencing-codex.md`
  - `docs/handoff/2026-07-22-issue-102-processing-lease-heartbeat-fencing-handoff.md`
- 反映内容: processing lease関連列、lease付きclaim、heartbeat、expected attempt/key/lease期限によるnon-terminal・terminal fencing、feature flag、migration・unit・integration testを実装。

### #101 / PR #103 （完了済み）
- 優先度: P1
- 状態: Closed / Merged / Completed（docs-only）
- 完了日: 2026-07-22
- GitHub Issue: `https://github.com/mizzz-dev/ai-code-dojo/issues/101`
- GitHub PR: `https://github.com/mizzz-dev/ai-code-dojo/pull/103`
- Linear mirror: `MIZ-25`（Done）
- 成果物:
  - `docs/reports/2026-07-22-stale-running-lease-recovery-design.md`
  - `docs/adr/2026-07-22-stale-running-lease-recovery.md`
  - `docs/logs/2026-07-22-issue-101-stale-running-recovery-design.md`
  - `docs/ai-prompts/2026-07-22-issue-101-stale-running-recovery-design-codex.md`
  - `docs/handoff/2026-07-22-issue-101-stale-running-recovery-design-handoff.md`
- 反映内容: stale `running` / `legacy_running` の定義、lease / heartbeat / attempt fencing、stale回収時の新attempt開始、migration / rollout / rollback、SQLite MVPと将来queue基盤の境界を確定。

### #99 / PR #100 （完了済み）
- 優先度: P1
- 状態: Closed / Merged / Completed
- 完了日: 2026-07-22
- GitHub Issue: `https://github.com/mizzz-dev/ai-code-dojo/issues/99`
- GitHub PR: `https://github.com/mizzz-dev/ai-code-dojo/pull/100`
- Linear mirror: `MIZ-19`（Done）
- 関連資料:
  - `docs/logs/2026-07-22-issue-99-worker-startup-queued-recovery.md`
  - `docs/ai-prompts/2026-07-22-issue-99-worker-startup-queued-recovery-codex.md`
  - `docs/handoff/2026-07-22-issue-99-worker-startup-queued-recovery-handoff.md`
- 反映内容: Worker起動時にDB上の `queued` submissionを回収し、attempt / idempotency key / completion guard条件付きclaimで二重採点を防止。integration testをCI品質ゲートへ追加。

### #96 （完了済み）
- 優先度: P1
- 状態: Closed / Completed
- 完了日: 2026-07-22
- 関連資料:
  - `docs/logs/2026-05-22-issue-96-retry-requeue-follow-up.md`
  - `docs/ai-prompts/2026-05-22-issue-96-retry-requeue-follow-up-codex.md`
  - `docs/handoff/2026-05-22-issue-96-retry-requeue-follow-up-handoff.md`
- 関連PR: PR #97 / PR #98
- 反映内容: Workerのretry再投入先を実待受設定と整合させ、終端済みsubmissionを非終端状態で上書きしないようcompletion guardを補強。

### PR #95 （完了済み）
- 優先度: P1
- 状態: Merged / Completed
- 完了日: 2026-05-22
- 関連資料:
  - `docs/logs/2026-05-22-pr-95-retry-state-machine-integration.md`
  - `docs/ai-prompts/2026-05-22-pr-95-retry-state-machine-integration-codex.md`
  - `docs/handoff/2026-05-22-pr-95-retry-state-machine-integration-handoff.md`
- 反映内容: Workerのinfrastructure failure経路に `running -> retry_pending -> queued` 再投入導線を統合し、試行上限到達時は `infra_failed` へ終端化。

### #93 （完了済み）
- 優先度: P1
- 状態: Closed / Completed
- 完了日: 2026-05-22
- 関連資料:
  - `docs/logs/2026-05-22-issue-93-completion-guard-retry-compat.md`
  - `docs/ai-prompts/2026-05-22-issue-93-completion-guard-retry-compat-codex.md`
  - `docs/handoff/2026-05-22-issue-93-completion-guard-retry-compat-handoff.md`
- 反映内容: completion guardの終端保存一意化を維持したまま、retry attempt開始時の互換性を回復。

### #91 （完了済み）
- 優先度: P1
- 状態: Closed / Completed
- 完了日: 2026-05-22
- 関連資料:
  - `docs/logs/2026-05-22-issue-91-completion-guard.md`
  - `docs/ai-prompts/2026-05-22-issue-91-completion-guard-codex.md`
  - `docs/handoff/2026-05-22-issue-91-completion-guard-handoff.md`
- 反映内容: submission単位completion guardを実装し、終端結果保存を一度だけ許可。

### #89 （完了済み）
- 優先度: P1
- 状態: Closed / Completed
- 完了日: 2026-05-21
- 関連資料:
  - `docs/logs/2026-05-21-issue-89-sqlite-attempt-migration-order.md`
  - `docs/ai-prompts/2026-05-21-issue-89-sqlite-attempt-migration-order-codex.md`
  - `docs/handoff/2026-05-21-issue-89-sqlite-attempt-migration-order-handoff.md`
- 反映内容: SQLite既存DBのattempt列追加前にindex作成が走るmigration順序不整合を解消。

### #87 （完了済み）
- 優先度: P1
- 状態: Closed / Completed
- 完了日: 2026-05-21
- 関連資料:
  - `docs/logs/2026-05-21-issue-87-idempotency-key-implementation.md`
  - `docs/ai-prompts/2026-05-21-issue-87-idempotency-key-implementation-codex.md`
  - `docs/handoff/2026-05-21-issue-87-idempotency-key-implementation-handoff.md`
- 反映内容: `submission + attempt` 単位のidempotency key相当をAPI/DB/Workerへ実装。

### #85 （完了済み）
- 優先度: P1
- 状態: Closed / Completed（docs-only）
- 完了日: 2026-05-20
- 関連資料:
  - `docs/reports/2026-05-20-duplicate-grading-prevention-design.md`
  - `docs/logs/2026-05-20-issue-85-duplicate-grading-prevention-design.md`
  - `docs/ai-prompts/2026-05-20-issue-85-duplicate-grading-prevention-design-codex.md`
  - `docs/handoff/2026-05-20-issue-85-duplicate-grading-prevention-design-handoff.md`
- 反映内容: 重複ジョブ投入・重複実行・重複完了の定義とidempotency key / completion guardの責務を整理。

### #83 （完了済み）
- 優先度: P1
- 状態: Closed / Completed（docs-only）
- 完了日: 2026-05-20
- 関連資料:
  - `docs/reports/2026-05-20-retry-state-machine-state-vocabulary-decision.md`
  - `docs/logs/2026-05-20-issue-83-retry-state-machine-state-vocabulary.md`
  - `docs/handoff/2026-05-20-issue-83-retry-state-machine-state-vocabulary-handoff.md`
- 反映内容: Retry state machineの状態語彙・状態遷移・learner-safe境界を確定。

## Next Issue Candidates

1. queue運用改善Issue（P1）
   - 優先理由: visibility timeout / DLQ / backoffを現行HTTP queueと将来外部queueの責務に分けて整理するため。
2. 監査ログ整備Issue（P2）
   - 優先理由: completion guard、heartbeat、retry・recovery判断を必要最小限の監査情報として可視化するため。
3. SQLiteから将来RDB / 外部queueへの移行計画Issue（P2）
   - 優先理由: 現在のSQLite lease・transaction境界を将来構成へ安全に移行するため。

## Branch Cleanup

- PR #107のhead branch `fix/finalize-queued-retry-enqueue-failure` の削除状態はGitHub UIで確認する。
- Issue #105のhead branchは `feat/stale-running-recovery-scanner`。
- PR #108 merge後にIssue #105のhead branchを削除する。
