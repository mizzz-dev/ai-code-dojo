# system-overview（正本）

最終更新: 2026-07-23（Issue #109 queue運用設計を反映）

## この文書の目的
実装詳細に入る前に、システム境界・責務分担・データフローを把握するためのアーキテクチャ概観を提供する。

## システム境界
- 学習者: Web UIから問題取得・提出・結果確認
- API: challenge/submission/adminの公開境界、認可制御、submission永続化、採点依頼
- Queue transport: 現行HTTP通知、将来のdurable delivery / visibility / ack / retry / DLQ
- Worker: 採点ジョブのclaim、実行、heartbeat、stale scanner、結果保存、障害回復
- Runner: テスト実行と結果正規化

## 高レベル構成
1. WebがAPIからchallengeを取得する。
2. WebがAPIにsubmissionを作成する。
3. APIがsubmissionをDBへ保存する。
4. APIがWorkerへ採点依頼を送る。
5. WorkerがDB上のsubmissionを条件付きclaimする。
6. heartbeat有効時はWorkerがprocessing leaseを定期延長する。
7. stale recovery有効時はWorkerが起動時・定期的に期限切れleaseを走査する。
8. WorkerがRunnerでvisible/hidden testsを実行する。
9. Workerがexpected attempt/keyによるfenced updateとcompletion guardで結果を保存する。
10. Webがsubmission結果をポーリング表示する。

## 現行queue transport

### API producer
- APIはsubmissionを `queued` で保存後、Worker `POST /jobs`へ同期HTTPで通知する。
- payloadはsubmission ID / grading attempt / attempt idempotency keyである。
- HTTP 2xxを通知成功として扱う。
- 通知失敗時もDBのqueued行は残り、Worker起動時queued回収が復旧経路となる。

### Worker consumer
- `POST /jobs`はrequest validation後に202を返し、process内で採点処理を開始する。
- 202はprocess内受理であり、durable queue保存・broker ackを意味しない。
- duplicate notificationはDB conditional claimで一件だけ処理する。

### 現行制約
- durable message storageなし
- ack / nackなし
- queue visibility timeoutなし
- delivery countなし
- delayed delivery / backoffなし
- DLQ / replay / purge / retentionなし
- queue depth / oldest message ageなし

## queue運用方針（Issue #109 / PR #110）

### delivery semantics
- 将来queueはat-least-once deliveryを前提とする。
- exactly-once deliveryへ正しさを依存しない。
- duplicate deliveryは正常な障害モードとして扱う。
- WorkerはDB conditional claimに成功した場合のみ採点する。

### message contract
- schema version
- submission ID
- grading attempt
- attempt idempotency key
- optional correlation ID

queue message / DLQ / logsへ以下を含めない。

- 提出コード本文
- visible / hidden tests詳細
- challenge本文
- secret / token / password
- learnerへ不要な内部障害詳細

### ack
- message受信直後にackしない。
- terminal結果、new attempt作成と再enqueue、retry enqueue failure終端化、安全なduplicate no-opのいずれかをDBで確認・保存した後にackする。
- ack前のconsumer停止はredeliveryで復旧する。

### visibility timeoutとDB lease
- queue visibility timeoutはdelivery availabilityを担う。
- DB processing leaseはcurrent attemptの実行所有権とcorrectnessを担う。
- attempt idempotency keyはattempt単位のfencingを担う。
- completion guardはsubmission終端保存の一意化を担う。
- 外部queue導入後もDB processing lease / attempt fencing / completion guardを維持する。
- WorkerはDB heartbeatとqueue visibility extensionを併用する。

### retry
- transport retryは同一message / 同一attemptの再配送であり、grading attemptを増やさない。
- application retryは `retry_pending -> queued` でnew grading attempt / new keyを発行する。
- transport retryとapplication retryのbackoff設定を分離する。
- queue delivery countをgrading attemptとして扱わない。

### DLQ
- DLQはqueue messageの配送異常を隔離するinternal queueである。
- DLQとsubmission statusの `infra_failed` を分離する。
- Runtime failure、通常test failure、terminal済みduplicate、old attempt messageをDLQへ入れない。
- replay前にDBのstatus / completion guard / attempt / keyを再検証する。
- `infra_failed` からの手動再実行はold message replayではなくnew attempt作成として扱う。
- learnerはqueue / DLQ情報へアクセスできない。

### external queue migration
- queue port / message contractをbehavior changeなしで導入する。
- transport observabilityとapplication retry backoff seamを先行する。
- external queue導入時はtransactional outboxを推奨する。
- product selection / schema変更 / PoCは別Issueへ分離する。
- rollout中はHTTP adapter、DB lease、stale scannerをrollback・safety netとして維持する。

詳細:
- `docs/reports/2026-07-23-queue-operations-visibility-dlq-backoff-design.md`
- `docs/adr/2026-07-23-queue-delivery-and-db-fencing-boundary.md`

## 採点ジョブ回復

### queued回収
- Worker起動時にDB上の `queued` submissionを回収する。
- `queued -> running` はsubmission id / grading attempt / attempt idempotency key / completion guard条件付きclaimで一件だけ成功させる。

### processing lease / heartbeat
- heartbeat feature flag有効時のclaimでprocessing leaseを開始する。
- Workerは実行中にheartbeatを更新し、lease期限を延長する。
- heartbeat・非終端更新・terminal保存はexpected attempt / attempt idempotency key / lease期限でfenceする。
- lease期限切れ後のheartbeat・状態更新・terminal保存はno-opとする。
- completion guardはsubmission単位の終端一意化として維持する。
- heartbeat無効時は既存のclaim・採点挙動を維持する。

### stale running自動回収（Issue #105 / PR #108）
- 候補は `status = running` / completion guard未設定 / lease非NULL / lease期限切れに限定する。
- leaseがNULLの `legacy_running` は自動回収しない。
- recoveryはSQLiteの `BEGIN IMMEDIATE` transaction内で行う。
- transaction条件にsubmission id / expected attempt / expected attempt idempotency key / expected lease expiryを含める。
- retry上限未満では `running -> retry_pending -> queued(new attempt/key)` を一貫処理する。
- retry上限到達時はcompletion guardを設定して `infra_failed` へ終端化する。
- 回収成功したnew attemptだけをWorkerへ再投入する。
- 回収後の再投入失敗はqueued attempt専用のfenced終端化経路で `infra_failed` へ確定する。
- scannerはWorker起動時と一定間隔で動作し、多重scanを抑止する。
- scannerの候補単位エラー・scan全体エラーは内部ログ対象とし、health endpointを停止しない。

詳細:
- `docs/reports/2026-07-22-stale-running-lease-recovery-design.md`
- `docs/adr/2026-07-22-stale-running-lease-recovery.md`

## データ管理
- challenge本体: `challenges` + `challenge_versions`
- submission: `submissions`
- 永続化: SQLite（`.data/app.db`）
- submission内部制御:
  - `grading_attempt`
  - `attempt_idempotency_key`
  - `completion_guard_at`
  - `processing_claimed_at`
  - `processing_heartbeat_at`
  - `processing_lease_expires_at`
- processing lease列はnullableなadditive migrationで追加する。
- 既存のqueued・terminal・legacy running行は自動backfillしない。
- Issue #109ではDB schema / migrationを変更しない。
- external queue導入時のdual-write対策としてtransactional outboxを別Issueで検討する。

## Worker設定
- `WORKER_HEARTBEAT_ENABLED=0|1`
- `WORKER_LEASE_DURATION_MS`（既定30秒）
- `WORKER_HEARTBEAT_INTERVAL_MS`（既定10秒）
- `WORKER_STALE_RECOVERY_ENABLED=0|1`
- `WORKER_STALE_RECOVERY_INTERVAL_MS`（既定15秒）
- `WORKER_STALE_RECOVERY_BATCH_SIZE`（既定10件）
- `WORKER_STALE_RECOVERY_CONCURRENCY`（既定2件）
- heartbeat intervalはlease durationの3分の1以下とする。
- stale recovery有効時はheartbeatも有効であることを必須とする。
- concurrencyはbatch size以下とし、設定値は正の整数に限定する。
- feature flag無効時はstale scannerを実行しない。
- queue visibility / backoff / DLQ retention設定は後続実装Issueで追加する。

## セキュリティ境界
- learner-safeとinternalレスポンスを分離する。
- hidden tests詳細はlearnerへ非公開とする。
- `/api/admin/*` はadminロール必須とする。
- attempt key、lease、heartbeat、worker識別情報、queue / DLQ情報はlearnerへ返さない。
- 回復ログへ提出コード本文・hidden tests実データ・secretを記録しない。
- queue / DLQはprivate transportとservice-to-service認証を前提とする。
- replay / purgeはops権限と監査ログを必要とする。
- recovery中の内部状態・失敗理由はlearner-safeでは既存語彙へ抽象化する。

## 重要な不変条件
- API本体で提出コードを直接実行しない。
- challenge編集はversion追加方式とし、既存versionを上書きしない。
- publish状態で学習者公開を制御する。
- submissionの終端結果はcompletion guardで一意化する。
- 旧attempt・期限切れleaseからの更新はattempt fencingで拒否する。
- stale回収は同じattemptを再利用せず、必ずnew attemptとして扱う。
- queue productのdeduplication機能だけに正しさを依存しない。
- external queue導入後もDB lease / attempt fencing / completion guardを維持する。

## 依存関係と制約
- 現行Runnerは簡易実行であり、将来は隔離強化が前提。
- キューは簡易HTTP連携であり、将来置換を想定する。
- SQLite leaseは将来queueのvisibility timeout相当を補う暫定機構であるが、correctness fencingとして外部queue導入後も段階的に維持する。
- SQLite DB fileを複数ホストから共有する運用は前提にしない。
- Repositoryのcanonical full nameは `mizzz-ivr/ai-code-dojo`。
- ドキュメント正本は `docs/project-overview.md` のCanonical Source Rulesに従う。

## 詳細文書への導線
- 実装詳細: `docs/architecture.md`
- 要件定義: `docs/requirements.md`
- 現在状態: `docs/current-status.md`
- 進行中Issue: `docs/active-issues.md`
- queue運用設計: `docs/reports/2026-07-23-queue-operations-visibility-dlq-backoff-design.md`
- Worker障害復旧: `docs/runbooks/2026-05-18-worker-failure-recovery-runbook.md`
