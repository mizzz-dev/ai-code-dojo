# current-status（正本）

最終更新: 2026-07-24（Issue #111 queue contract / HTTP adapter分離を実施中）

## この文書の目的
「今どこまで実装済みか」を短時間で把握するための現況スナップショット。

## 今の状態（要約）
- Repositoryのcanonical full nameは `mizzz-ivr/ai-code-dojo`。
- ai-code-dojoは、AI生成コードのバグ修正・機能追加を実務フローで学ぶ練習プラットフォームとしてMVP運用を継続中。
- docs正本は `README.md` / `docs/project-overview.md` / `docs/current-status.md` / `docs/active-issues.md` / `docs/architecture/system-overview.md`。
- attempt単位idempotency key、completion guard、processing lease / heartbeat、stale running自動回収まで実装済み。
- Issue #109 / PR #110で現行HTTP queueと将来外部queueのdelivery / ack / visibility / retry / DLQ責務を確定した。
- Issue #111 / PR #112でqueue message contract、queue producer port、HTTP adapterを現行挙動を維持したまま分離中。
- API直接実行禁止、hidden tests非公開、challenge version追加方式の不変条件を維持する。

## 稼働中の運用基盤
- 採点系はAPI→Workerの非同期連携を維持し、APIで提出コードを直接実行しない。
- 現行enqueueはAPIからWorker `POST /jobs`への同期HTTP通知である。
- Workerは起動時にDB上の `queued` submissionを回収する。
- `queued -> running` はattempt / idempotency key / completion guard条件付きclaimで一件だけ成功させる。
- heartbeat有効時はprocessing leaseを保存し、heartbeat・状態更新・terminal保存をattempt/key/lease期限でfenceする。
- stale recovery有効時はlease期限切れrunningだけをnew attempt / new keyへ回収する。
- learner-safe / internal境界を維持し、hidden tests詳細、attempt key、lease、heartbeat、queue内部情報は学習者へ返さない。
- CIはlint / typecheck / unit / integration / schema validation / build / docs validationを品質ゲートとする。

## 進行中事項
- Issue #111: queue message schema version 1をコード上のcontractとして固定する。
- Issue #111: messageをsubmission ID / grading attempt / attempt idempotency key / optional correlation IDへ限定する。
- Issue #111: 不正version、欠落、不正型、未知fieldをproducer / consumerで共通拒否する。
- Issue #111: queue producer portとHTTP adapterを分離し、将来transport差し替えの境界を作る。
- Issue #111: API提出直後、Worker retry、stale recoveryのenqueueを同じqueue portへ集約する。
- Issue #111: unit / integration contract testとRepository運用docsを整備する。

## 直近完了事項
- Issue #109 / PR #110を完了し、at-least-once delivery、ack、visibility timeout、transport/application retry、DLQ、transactional outbox、rollout / rollback方針を確定した。
- Issue #105 / PR #108を完了し、lease期限切れrunningのstartup / periodic scannerと安全なnew attempt回収を実装した。
- Issue #106 / PR #107を完了し、retry再投入失敗時にqueued attemptが残る不具合を修正した。
- Issue #102 / PR #104を完了し、processing lease関連列、heartbeat、attempt fencingを実装した。
- Issue #99 / PR #100を完了し、Worker起動時queued回収を実装した。

## 優先順位（直近）
1. Issue #111 / PR #112: queue message contract / queue producer port / HTTP adapterを分離する。
2. 後続P1: queue transport observabilityを実装する。
3. 後続P1: application retry backoff seamを実装する。
4. 後続P2: external queue / transactional outbox PoCを進める。
5. 後続P2: DLQ ops / replay / purgeを整備する。

## branch cleanup 状態
- PR #110は2026-07-23にmerge済み。
- PR #110のhead branch `docs/queue-operations-design` は削除確認対象。
- Issue #111の作業branchは `refactor/queue-contract-http-adapter`。
- PR #112 merge後にhead branchを削除する。

## 参照先
- Repository: `https://github.com/mizzz-ivr/ai-code-dojo`
- Issue #111: `https://github.com/mizzz-ivr/ai-code-dojo/issues/111`
- PR #112: `https://github.com/mizzz-ivr/ai-code-dojo/pull/112`
- Issue #109: `https://github.com/mizzz-ivr/ai-code-dojo/issues/109`
- PR #110: `https://github.com/mizzz-ivr/ai-code-dojo/pull/110`
- queue運用設計: `docs/reports/2026-07-23-queue-operations-visibility-dlq-backoff-design.md`
- queue責務ADR: `docs/adr/2026-07-23-queue-delivery-and-db-fencing-boundary.md`
- Worker障害復旧runbook: `docs/runbooks/2026-05-18-worker-failure-recovery-runbook.md`
