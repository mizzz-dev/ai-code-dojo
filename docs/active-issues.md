# active-issues（正本）

最終更新: 2026-07-23（Issue #109 queue運用設計を実施中）

## この文書の目的
進行中/未解決課題を、優先順位と依存関係付きで管理する。

## 優先度定義
- P0: セキュリティ/可用性/法令順守を阻害
- P1: 直近スプリントで解決すべき重要課題
- P2: 改善課題（計画的に対応）

## 進行中Issue

### #109 現行HTTP queueと将来外部queueのvisibility timeout・DLQ・backoff運用方針を確定する
- 優先度: P1
- 状態: Open / In Progress（docs-only）
- GitHub Issue: `https://github.com/mizzz-ivr/ai-code-dojo/issues/109`
- GitHub PR: `https://github.com/mizzz-ivr/ai-code-dojo/pull/110`（Draft）
- 目的: 現行HTTP enqueueと将来外部queueのdelivery / ack / visibility timeout / retry / backoff / DLQ / replay / monitoring責務を分離し、後続実装Issueを安全な単位へ分割する。
- 対象:
  - 現行HTTP enqueueの障害モード・復旧経路
  - queue message contract
  - at-least-once delivery / ack / nack / redelivery
  - visibility timeoutとDB processing leaseの境界
  - transport retryとgrading attempt retryの分離
  - backoff / jitter / max delivery count
  - DLQ / replay / purge / retention / access control
  - transactional outboxを含む段階移行
  - observability / alert / runbook / test方針
  - report / ADR / logs / ai-prompts / handoff
- 非対象:
  - 外部queue製品選定・導入実装
  - API / Worker / Runnerコード変更
  - DB schema / migration / seed変更
  - hidden tests / auth / admin / UI / deployment変更
  - challenge直接上書き
- 完了条件:
  - queueはdelivery availability、DB lease / attempt fencing / completion guardはcorrectnessを担う方針を確定する。
  - message / DLQ / logsへ提出コード、hidden tests、secretを含めない。
  - transport retryではattemptを増やさず、application retryだけがnew attemptを作る。
  - ackをDB永続化または安全なno-op確認後に限定する。
  - DLQとsubmission statusを分離する。
  - rollout / rollbackと後続Issue分割を確定する。
  - docs validationを通過する。

## Recently Completed

### #105 / PR #108 （完了済み）
- 優先度: P1
- 状態: Closed / Merged / Completed
- 完了日: 2026-07-23
- GitHub Issue: `https://github.com/mizzz-ivr/ai-code-dojo/issues/105`
- GitHub PR: `https://github.com/mizzz-ivr/ai-code-dojo/pull/108`
- Linear mirror: `MIZ-34`（Doneへ同期予定）
- 関連資料:
  - `docs/logs/2026-07-23-issue-105-stale-running-recovery-scanner.md`
  - `docs/ai-prompts/2026-07-23-issue-105-stale-running-recovery-scanner-codex.md`
  - `docs/handoff/2026-07-23-issue-105-stale-running-recovery-scanner-handoff.md`
- 反映内容: lease期限切れrunningだけをexpected attempt / key / lease expiry付きtransactionでnew attemptへ回収し、startup / periodic scanner、retry上限判定、再投入失敗終端化を実装した。

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

1. queue port / message contract / HTTP adapter整理Issue（P1）
   - 優先理由: 現行挙動を変えずにproducer / consumer contractとadapter境界を作るため。
2. queue transport observability Issue（P1）
   - 優先理由: enqueue / delivery / claim / retry / DLQ相当の状態を監視可能にするため。
3. application retry backoff seam Issue（P1）
   - 優先理由: immediate retryを設定可能なexponential backoff + jitterへ段階移行するため。
4. external queue / transactional outbox PoC Issue（P2）
   - 優先理由: 製品選定・dual-write対策・visibility / ack / DLQ contractを非本番で検証するため。
5. DLQ ops / replay / purge Issue（P2）
   - 優先理由: ops権限・監査・retentionを含む運用導線を整備するため。

## Branch Cleanup

- PR #108のhead branch `feat/stale-running-recovery-scanner` はbranch検索で見つからず、削除済み相当。
- Issue #109のhead branchは `docs/queue-operations-design`。
- PR #110 merge後にIssue #109のhead branchを削除する。
