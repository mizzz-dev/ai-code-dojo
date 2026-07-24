# active-issues（正本）

最終更新: 2026-07-24（Issue #111 queue contract / HTTP adapter分離を実施中）

## この文書の目的
進行中/未解決課題を、優先順位と依存関係付きで管理する。

## 優先度定義
- P0: セキュリティ/可用性/法令順守を阻害
- P1: 直近スプリントで解決すべき重要課題
- P2: 改善課題（計画的に対応）

## 進行中Issue

### #111 queue message contractとHTTP adapterを分離して現行enqueue挙動を固定する
- 優先度: P1
- 状態: Open / Review
- GitHub Issue: `https://github.com/mizzz-ivr/ai-code-dojo/issues/111`
- GitHub PR: `https://github.com/mizzz-ivr/ai-code-dojo/pull/112`（Ready for review）
- 作業branch: `refactor/queue-contract-http-adapter`
- 目的: queue message contract、producer port、HTTP adapterを分離し、現行HTTP enqueueの意味をcontract testで固定する。
- 対象:
  - schema version付きqueue message contract
  - submission ID / grading attempt / attempt idempotency key / optional correlation ID
  - producer / consumer共通validation
  - queue producer port
  - HTTP queue producer adapter
  - API提出直後、Worker retry、stale recoveryの共通enqueue経路
  - Worker `/jobs` contract validation
  - unit / integration contract test
  - current-status / active-issues / logs / ai-prompts / handoff
- 非対象:
  - external queue / transactional outbox
  - visibility timeout / ack / nack / DLQ実装
  - transport retry backoff / observability本実装
  - DB schema / migration / seed変更
  - Runner / hidden tests / auth / admin / UI / deployment変更
- 完了条件:
  - messageへ提出コード、hidden tests、secretを含めない。
  - version不一致、欠落、不正型、未知fieldを安全に拒否する。
  - HTTP adapterは2xx成功、非2xx・接続失敗を失敗として扱う。
  - retry transportでgrading attempt / attempt keyを変更しない。
  - learner-safeへqueue内部情報を露出しない。
  - 全品質ゲートとdocs validationを通過する。

## Recently Completed

### #109 / PR #110 （完了済み）
- 優先度: P1
- 状態: Closed / Merged / Completed（docs-only）
- 完了日: 2026-07-23
- GitHub Issue: `https://github.com/mizzz-ivr/ai-code-dojo/issues/109`
- GitHub PR: `https://github.com/mizzz-ivr/ai-code-dojo/pull/110`
- 成果物:
  - `docs/reports/2026-07-23-queue-operations-visibility-dlq-backoff-design.md`
  - `docs/adr/2026-07-23-queue-delivery-and-db-fencing-boundary.md`
  - `docs/logs/2026-07-23-issue-109-queue-operations-design.md`
  - `docs/ai-prompts/2026-07-23-issue-109-queue-operations-design-codex.md`
  - `docs/handoff/2026-07-23-issue-109-queue-operations-design-handoff.md`
- 反映内容: at-least-once delivery、ack、visibility timeout、transport/application retry、DLQ、transactional outbox、rollout / rollback方針を確定。

### #105 / PR #108 （完了済み）
- 優先度: P1
- 状態: Closed / Merged / Completed
- 完了日: 2026-07-23
- GitHub Issue: `https://github.com/mizzz-ivr/ai-code-dojo/issues/105`
- GitHub PR: `https://github.com/mizzz-ivr/ai-code-dojo/pull/108`
- Linear mirror: `MIZ-34`（Done）
- 関連資料:
  - `docs/logs/2026-07-23-issue-105-stale-running-recovery-scanner.md`
  - `docs/ai-prompts/2026-07-23-issue-105-stale-running-recovery-scanner-codex.md`
  - `docs/handoff/2026-07-23-issue-105-stale-running-recovery-scanner-handoff.md`
- 反映内容: lease期限切れrunningだけをexpected attempt / key / lease expiry付きtransactionでnew attemptへ回収し、startup / periodic scanner、retry上限判定、再投入失敗終端化を実装した。

### #106 / PR #107 （完了済み）
- 優先度: P1
- 状態: Closed / Merged / Completed
- 完了日: 2026-07-23
- GitHub Issue: `https://github.com/mizzz-ivr/ai-code-dojo/issues/106`
- GitHub PR: `https://github.com/mizzz-ivr/ai-code-dojo/pull/107`
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
- GitHub Issue: `https://github.com/mizzz-ivr/ai-code-dojo/issues/102`
- GitHub PR: `https://github.com/mizzz-ivr/ai-code-dojo/pull/104`
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
- GitHub Issue: `https://github.com/mizzz-ivr/ai-code-dojo/issues/101`
- GitHub PR: `https://github.com/mizzz-ivr/ai-code-dojo/pull/103`
- Linear mirror: `MIZ-25`（Done）
- 成果物:
  - `docs/reports/2026-07-22-stale-running-lease-recovery-design.md`
  - `docs/adr/2026-07-22-stale-running-lease-recovery.md`
  - `docs/logs/2026-07-22-issue-101-stale-running-recovery-design.md`
  - `docs/ai-prompts/2026-07-22-issue-101-stale-running-recovery-design-codex.md`
  - `docs/handoff/2026-07-22-issue-101-stale-running-recovery-design-handoff.md`
- 反映内容: stale `running` / `legacy_running` の定義、lease / heartbeat / attempt fencing、stale回収時のnew attempt開始、migration / rollout / rollback方針を確定。

### #99 / PR #100 （完了済み）
- 優先度: P1
- 状態: Closed / Merged / Completed
- 完了日: 2026-07-22
- GitHub Issue: `https://github.com/mizzz-ivr/ai-code-dojo/issues/99`
- GitHub PR: `https://github.com/mizzz-ivr/ai-code-dojo/pull/100`
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

### #93 / #91 / #89 / #87 / #85 / #83 （完了済み）
- completion guard、SQLite migration順序、attempt単位idempotency key、重複採点防止設計、retry state machine語彙を段階的に整備済み。
- 詳細は各Issueのlogs / ai-prompts / handoffおよびreportsを参照する。

## Next Issue Candidates

1. queue transport observability Issue（P1）
   - 優先理由: enqueue / delivery / claim / retry / stale recovery / contract rejectionを監視可能にするため。
2. application retry backoff seam Issue（P1）
   - 優先理由: immediate retryを設定可能なexponential backoff + jitterへ段階移行するため。
3. external queue / transactional outbox PoC Issue（P2）
   - 優先理由: 製品選定・dual-write対策・visibility / ack / DLQ contractを非本番で検証するため。
4. DLQ ops / replay / purge Issue（P2）
   - 優先理由: ops権限・監査・retentionを含む運用導線を整備するため。

## Branch Cleanup

- PR #110のhead branch `docs/queue-operations-design` は削除確認対象。
- Issue #111のhead branchは `refactor/queue-contract-http-adapter`。
- PR #112 merge後にIssue #111のhead branchを削除する。
