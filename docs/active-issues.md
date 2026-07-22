# active-issues（正本）

最終更新: 2026-07-22（Issue #99 Worker起動時queued回収に着手）

## この文書の目的
進行中/未解決課題を、優先順位と依存関係付きで管理する。

## 優先度定義
- P0: セキュリティ/可用性/法令順守を阻害
- P1: 直近スプリントで解決すべき重要課題
- P2: 改善課題（計画的に対応）

## 進行中Issue

### #99 Worker再起動後にqueued submissionを回収して採点を再開する
- 優先度: P1
- 状態: Open / In Progress
- GitHub: `https://github.com/mizzz-dev/ai-code-dojo/issues/99`
- Linear mirror: `MIZ-19`
- 目的: Worker起動時にDB上の `queued` submissionを回収し、条件付きclaimで通常enqueueとの競合時も二重採点を防ぐ。
- 対象:
  - `apps/api/src/repositories/submission-repository.mjs`
  - `apps/worker/src/server.mjs`
  - unit / integration test
  - current-status / active-issues / logs / ai-prompts / handoff
- 非対象:
  - 外部queue導入
  - visibility timeout / DLQ / backoff本格実装
  - stale `running` のheartbeat / lease / DB schema追加
  - runner / hidden tests / auth / admin / UI / challenge仕様変更
- 完了条件:
  - Worker起動時に `queued` submissionを回収できる。
  - `queued -> running` の条件付きclaimに成功したWorkerだけが採点する。
  - attempt / idempotency key / completion guardの不変条件を維持する。
  - lint / typecheck / unit / integration testを通過する。
  - learner-safe境界とhidden tests非露出を維持する。

## Recently Completed

### #96 （完了済み）
- 優先度: P1
- 状態: Closed / Completed
- 完了日: 2026-07-22（GitHub状態を正本docsへ同期）
- 関連資料:
  - `docs/logs/2026-05-22-issue-96-retry-requeue-follow-up.md`
  - `docs/ai-prompts/2026-05-22-issue-96-retry-requeue-follow-up-codex.md`
  - `docs/handoff/2026-05-22-issue-96-retry-requeue-follow-up-handoff.md`
- 関連PR: PR #97 / PR #98
- 反映内容: PR #95 merge後のP1 follow-upとして、Workerのretry再投入先を実待受 `WORKER_PORT` または明示 `WORKER_RETRY_ENQUEUE_BASE_URL` と整合させ、終端済みsubmissionを `retry_pending` など非終端状態で上書きしないよう completion guard を補強。旧番号プレースホルダを PR #95 / Issue #96 の追跡可能な表記へ補正。

### PR #95 （完了済み）
- 優先度: P1
- 状態: Merged / Completed
- 完了日: 2026-05-22
- 関連資料:
  - `docs/logs/2026-05-22-pr-95-retry-state-machine-integration.md`
  - `docs/ai-prompts/2026-05-22-pr-95-retry-state-machine-integration-codex.md`
  - `docs/handoff/2026-05-22-pr-95-retry-state-machine-integration-handoff.md`
- 反映内容: Worker の infrastructure failure 経路に `running -> retry_pending -> queued` 再投入導線を統合。再投入時の attempt increment / idempotency key 更新 / completion guard 解除を `startRetryAttempt` で一貫化し、試行上限到達時は `infra_failed` へ終端化。learner-safe では `retrying/failed` へ抽象化を維持。

### #93 （完了済み）
- 優先度: P1
- 状態: Closed / Completed
- 完了日: 2026-05-22
- 関連資料:
  - `docs/logs/2026-05-22-issue-93-completion-guard-retry-compat.md`
  - `docs/ai-prompts/2026-05-22-issue-93-completion-guard-retry-compat-codex.md`
  - `docs/handoff/2026-05-22-issue-93-completion-guard-retry-compat-handoff.md`
- 反映内容: completion guard の終端保存一意化を維持したまま、terminal update no-op時返却をDB最新行へ修正。`startRetryAttempt` で `completion_guard_at` を解除し、retry attempt が Worker で即時returnされないよう互換性を回復。

### #91 （完了済み）
- 優先度: P1
- 状態: Closed / Completed
- 完了日: 2026-05-22
- 関連資料:
  - `docs/logs/2026-05-22-issue-91-completion-guard.md`
  - `docs/ai-prompts/2026-05-22-issue-91-completion-guard-codex.md`
  - `docs/handoff/2026-05-22-issue-91-completion-guard-handoff.md`
- 反映内容: submission単位 completion guard を実装。終端結果（passed/failed/infra_failed）保存を一度だけ許可し、後続終端保存を idempotent no-op 化。Workerの重複完了経路も無害化。

### #89 （完了済み）
- 優先度: P1
- 状態: Closed / Completed
- 完了日: 2026-05-21
- 関連資料:
  - `docs/logs/2026-05-21-issue-89-sqlite-attempt-migration-order.md`
  - `docs/ai-prompts/2026-05-21-issue-89-sqlite-attempt-migration-order-codex.md`
  - `docs/handoff/2026-05-21-issue-89-sqlite-attempt-migration-order-handoff.md`
- 反映内容: SQLite既存DBの `submissions` 旧スキーマで、attempt列追加前にUNIQUE index作成が走る順序不整合を解消。列追加後にindex作成するよう migration を整理し、再現unit testを追加。

### #87 （完了済み）
- 優先度: P1
- 状態: Closed / Completed
- 完了日: 2026-05-21
- 関連資料:
  - `docs/logs/2026-05-21-issue-87-idempotency-key-implementation.md`
  - `docs/ai-prompts/2026-05-21-issue-87-idempotency-key-implementation-codex.md`
  - `docs/handoff/2026-05-21-issue-87-idempotency-key-implementation-handoff.md`
- 反映内容: `submission + attempt` 単位の idempotency key 相当を API/DB/Worker に実装。初回attempt=1、retry向けattempt increment関数、Workerのattempt/key照合を追加。completion guard は未実装で分離維持。

### #85 （完了済み）
- 優先度: P1
- 状態: Closed / Completed（docs-only）
- 完了日: 2026-05-20
- 関連資料:
  - `docs/reports/2026-05-20-duplicate-grading-prevention-design.md`
  - `docs/logs/2026-05-20-issue-85-duplicate-grading-prevention-design.md`
  - `docs/ai-prompts/2026-05-20-issue-85-duplicate-grading-prevention-design-codex.md`
  - `docs/handoff/2026-05-20-issue-85-duplicate-grading-prevention-design-handoff.md`
- 反映内容: 重複ジョブ投入・重複実行・重複完了の定義、idempotency key 相当（attempt単位）と completion guard（submission終端一意化）の責務分離、API/Worker/DB 境界を整理。

### #83 （完了済み）
- 優先度: P1
- 状態: Closed / Completed（docs-only）
- 完了日: 2026-05-20
- 関連資料:
  - `docs/reports/2026-05-20-retry-state-machine-state-vocabulary-decision.md`
  - `docs/logs/2026-05-20-issue-83-retry-state-machine-state-vocabulary.md`
  - `docs/handoff/2026-05-20-issue-83-retry-state-machine-state-vocabulary-handoff.md`
- 反映内容: Retry state machine の状態語彙と状態遷移を確定し、`retry_pending` / `infra_failed` の使い分け、terminal states、completion guard（状態ではなく保存制約）を整理。

### #77 （完了済み）
- 優先度: P1
- 状態: Closed / Completed
- 完了日: 2026-05-20（PR #80 merged 後の正本docs同期完了）
- 関連資料:
  - `docs/reports/2026-05-19-retry-state-machine-idempotency-adr-candidate.md`
  - `docs/logs/2026-05-19-issue-77-source-of-truth-recovery-and-idempotency-adr.md`
  - `docs/handoff/2026-05-19-issue-77-source-of-truth-recovery-and-idempotency-adr-handoff.md`
- 反映内容: Source of Truth 復旧、欠落ログ補完、Retry state machine / idempotency key / completion guard のADR候補整理を docs-only で完了。

## Next Issue Candidates

1. stale `running` recovery設計Issue（P1）
   - 優先理由: Worker停止時に処理中だったsubmissionを安全に回収するため、lease / heartbeat / timeoutの責務を実装前に確定する必要がある。
2. queue運用改善Issue（P1）
   - 優先理由: visibility timeout / DLQ / backoff を運用要件に合わせて強化するため。
3. 監査ログ整備Issue（P2）
   - 優先理由: completion guard の重複完了判定を必要最小限の監査情報として可視化するため。
4. retry監査情報拡張Issue（P2）
   - 優先理由: failure category / retry decision reason を照会可能にし、問い合わせ一次回答速度を向上させるため。

## Branch Cleanup

- Issue #99 のhead branchは `fix/recover-queued-submissions-on-worker-startup`。
- merge後にhead branchを削除する。
