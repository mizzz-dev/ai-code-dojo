# active-issues（正本）

最終更新: 2026-07-22（Issue #102 lease / heartbeat / attempt fencing実装中）

## この文書の目的
進行中/未解決課題を、優先順位と依存関係付きで管理する。

## 優先度定義
- P0: セキュリティ/可用性/法令順守を阻害
- P1: 直近スプリントで解決すべき重要課題
- P2: 改善課題（計画的に対応）

## 進行中Issue

### #102 submission claimにlease・heartbeat・attempt fencingを実装する
- 優先度: P1
- 状態: Open / In Progress
- GitHub: `https://github.com/mizzz-dev/ai-code-dojo/issues/102`
- PR: `https://github.com/mizzz-dev/ai-code-dojo/pull/104`（Draft）
- Linear mirror: `MIZ-27`（In Progress）
- 目的: Workerがclaimしたsubmissionの所有権と生存期限をDBへ記録し、所有権喪失後または旧attemptからの更新をDB条件で拒否する。
- 対象:
  - processing lease関連nullable列のadditive migration
  - lease付き `queued -> running` claim
  - heartbeat lifecycle
  - expected attempt / attempt idempotency keyによるnon-terminal・terminal fencing
  - feature flagと設定値検証
  - migration / unit / integration test
  - current-status / active-issues / architecture / runbook / logs / ai-prompts / handoff
- 非対象:
  - stale候補一覧・periodic scanner・自動recovery
  - `running -> retry_pending -> queued(new attempt)` の自動回収
  - 外部queue導入
  - Runner / hidden tests / auth / admin / UI / deployment変更
- 完了条件:
  - lease関連列を既存DBへ冪等にmigrationできる。
  - claim成功時にlease情報を保存できる。
  - heartbeat成功時にlease期限を延長し、期限切れ・attempt/key不一致時はno-opになる。
  - Workerの状態更新・terminal保存をattempt/key/lease期限でfenceできる。
  - completion guardを維持する。
  - learner-safeレスポンスへlease・heartbeat・attempt keyを露出しない。
  - lint / typecheck / unit / integration / schema validation / build / docs validationを通過する。

## Recently Completed

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
- 反映内容: Worker起動時にDB上の `queued` submissionを回収し、attempt / idempotency key / completion guard条件付きの `queued -> running` claimで通常enqueueとの競合時も二重採点を防止。integration testをCI品質ゲートへ追加。

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
- 反映内容: submission単位completion guardを実装し、終端結果保存を一度だけ許可した。

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
- 優度: P1
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

1. stale scanner / recovery transaction実装Issue（P1）
   - 優先理由: Issue #102でattempt fencingを完成させた後、lease期限切れrunningを新attemptとして安全に回収するため。
2. queue運用改善Issue（P1）
   - 優先理由: visibility timeout / DLQ / backoffを運用要件に合わせて強化するため。
3. 監査ログ整備Issue（P2）
   - 優先理由: completion guard、heartbeat、recovery判定を必要最小限の監査情報として可視化するため。

## Branch Cleanup

- PR #103のhead branch削除状態はGitHub UIで確認する。
- Issue #102のhead branchは `feat/submission-processing-lease-heartbeat`。
- PR #104 merge後にIssue #102のhead branchを削除する。
