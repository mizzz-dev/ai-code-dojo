# 2026-05-18 Worker failure recovery runbook（Issue #75）

最終更新: 2026-07-23（Issue #109 queue運用設計を反映）

## 目的
Worker障害発生時に、採点停止・再試行・失敗確定・手動復旧を一貫運用し、learner-safe境界と監査可能性を維持する。

## 対象外
- runner/queue基盤の大規模変更
- auth/adminロジック変更
- hidden tests仕様変更

## 障害判定フロー
1. 障害イベントを受領（監視/ログ/問い合わせ）。
2. failure分類を判定する。
   - Worker到達不能
   - Worker再起動後の未処理 `queued`
   - Worker実行中断 / stale `running`
   - retry再投入失敗
   - queue enqueue / delivery / ack / visibility異常
   - poison message / max delivery count超過
   - timeout
   - runtime failure
   - infrastructure failure
3. learner-safe返却に内部情報混入がないか確認する。
4. 自動再試行・起動時回収・stale自動回収・queue redelivery・手動復旧の適用可否を判定する。
5. 最大試行回数超過、再投入失敗、DLQ投入時は失敗確定・運用確認へ移行する。

## Worker起動時のqueued自動回収（Issue #99 / 実装済み）
- Worker起動時にDB上の `queued` submissionを取得する。
- 回収対象は既存のWorker採点経路へ渡し、APIプロセスでは実行しない。
- `queued -> running` はsubmission id / grading attempt / attempt idempotency key / completion guard条件を満たす場合のみclaimする。
- claimに失敗した場合は、他のWorkerまたは通常enqueue経路が取得済みとみなし、採点を実行しない。
- 終端済みsubmissionは回収対象に含めず、非終端状態へ戻さない。

## processing lease / heartbeat（Issue #102 / PR #104）

### feature flag
- `WORKER_HEARTBEAT_ENABLED=1` の場合のみprocessing leaseとheartbeatを有効化する。
- 無効時は従来のclaim・採点挙動を維持する。

### 設定値
- `WORKER_LEASE_DURATION_MS`（既定30秒）
- `WORKER_HEARTBEAT_INTERVAL_MS`（既定10秒）
- heartbeat intervalはlease durationの3分の1以下とする。
- 有効時に0以下、NaN、または間隔条件違反がある場合はWorker起動エラーとする。

### claim / heartbeat / fenced update
- claim成功時に `processing_claimed_at` / `processing_heartbeat_at` / `processing_lease_expires_at` を保存する。
- claim条件はsubmission id / status=`queued` / completion guard未設定 / grading attempt / attempt idempotency keyとする。
- heartbeatはsubmission id / status=`running` / completion guard未設定 / expected attempt / expected key / lease未失効を条件に更新する。
- heartbeat更新0件またはDBエラー時は所有権喪失として扱い、そのWorkerは結果保存を行わない。
- Workerの非終端更新・terminal保存はexpected attempt / expected key / lease未失効を条件にする。
- running attemptのterminal保存は `status = running` を必須条件とする。
- terminal / retry_pending / retry開始時にprocessing lease情報をクリアする。
- retry attempt開始時は新attempt / 新keyを発行し、旧attemptの遅延更新をno-opにする。
- completion guardはsubmission単位の終端一意化として維持する。

## retry再投入失敗時のqueued attempt終端化（Issue #106 / PR #107）
- infrastructure failureの再試行は `running -> retry_pending -> queued(new attempt)` へ進む。
- new attemptをWorkerへ再投入できなかった場合は、queued attempt専用の条件付き更新を使用する。
- 更新条件はsubmission id / `status = queued` / completion guard未設定 / expected attempt / expected keyとする。
- 成功時は `infra_failed`、内部向け一般化ログ、completion guardを保存し、processing lease情報をクリアする。
- attempt/key不一致、running、retry_pending、terminal、completion guard設定済み、重複要求はno-opとする。
- learner-safeレスポンスでは `failed` に抽象化し、内部ログ・attempt key・lease情報を返さない。

## stale running自動回収（Issue #105 / PR #108）

### feature flag / 設定値
- `WORKER_STALE_RECOVERY_ENABLED=1` の場合のみscannerを有効化する。
- stale recovery有効時は `WORKER_HEARTBEAT_ENABLED=1` を必須とする。
- `WORKER_STALE_RECOVERY_INTERVAL_MS`（既定15秒）
- `WORKER_STALE_RECOVERY_BATCH_SIZE`（既定10件）
- `WORKER_STALE_RECOVERY_CONCURRENCY`（既定2件）
- interval / batch size / concurrencyは正の整数とする。
- concurrencyはbatch size以下とする。
- feature flag無効時はstartup / periodic scannerを実行しない。

### stale候補
以下をすべて満たす場合のみ候補とする。
- `status = running`
- completion guard未設定
- lease期限がNULLではない
- lease期限が現在時刻以前

`updated_at` が古いことだけではstaleと判定しない。
lease期限がNULLの既存running行は `legacy_running` とし、自動回収しない。

### recovery transaction
- SQLiteの `BEGIN IMMEDIATE` transactionを利用する。
- 比較条件にsubmission id / expected attempt / expected attempt idempotency key / expected lease expiryを含める。
- transaction内で現在行を再検証し、条件不一致はno-opとする。
- 複数scannerが同じ候補を取得しても、先にtransactionを完了した1件だけが回収する。

retry上限未満:

```text
running(attempt=N, lease expired)
  -> retry_pending(attempt=N)
  -> queued(attempt=N+1, new attempt idempotency key)
  -> Workerへ再投入
```

retry上限到達:

```text
running(attempt=max, lease expired)
  -> infra_failed（completion guard設定）
```

- stale回収では同一attemptを再利用しない。
- new attempt発行時にprocessing lease情報をクリアする。
- 旧attemptのheartbeat・状態更新・terminal保存はattempt/key不一致でno-opとなる。
- recovery後の再投入失敗はIssue #106のqueued attempt専用終端化経路を利用する。
- learner-safeでは `infra_failed` を `failed` に抽象化する。

### scanner lifecycle
- Worker起動時にstartup scanを実行する。
- その後、設定間隔でperiodic scanを実行する。
- 前回scan実行中は次scanをskipし、多重実行を抑止する。
- batch sizeとconcurrencyで一回あたりの負荷を制御する。
- 候補単位エラーは他候補の処理を継続する。
- scan全体エラーは内部ログへ記録し、Workerのhealth endpointは停止しない。

### 内部ログ
記録してよい項目:
- submission id
- previous / next attempt番号
- action（requeued / infra_failed）
- reason（lease_expired / enqueue_failed）
- scan trigger（startup / periodic）
- 件数とUTC時刻

記録禁止:
- 提出コード本文
- hidden tests実データ
- secret / token / password
- attempt idempotency key
- learnerへ不要な内部endpoint情報

## queue delivery / ack / retry / DLQ方針（Issue #109 / PR #110）

### 現行HTTP enqueue
- APIはsubmission保存後にWorker `POST /jobs`へ同期HTTPで通知する。
- Workerの202はprocess内受理であり、durable message保存・broker ackではない。
- 通知喪失時はDB queued行とWorker起動時queued回収が復旧経路となる。
- 現行HTTP transportにはvisibility timeout、delivery count、backoff、DLQがない。

### delivery semantics
- external queue導入後はat-least-once deliveryを前提とする。
- duplicate deliveryは異常ではなく、DB conditional claimで無害化する。
- exactly-once deliveryへ正しさを依存しない。
- queue側deduplicationがある場合も補助機能として扱う。

### queue message
保持してよい項目:
- schema version
- submission id
- grading attempt
- attempt idempotency key
- optional correlation id

保持禁止:
- 提出コード本文
- challenge本文
- visible / hidden tests詳細
- test artifact本文
- secret / token / password
- learnerへ不要な内部エラー詳細

### consumer ack
以下のいずれかをDBで確認・保存した後にackする。
- terminal結果保存
- application retryのnew attempt作成とnew message enqueue成功
- retry enqueue failureを含むterminal確定
- terminal済み、old attempt、attempt/key不一致、他Worker取得済みとして安全なno-op確認

message受信直後にackしてはいけない。

### visibility timeout / processing lease
- queue visibility timeoutはmessage redelivery抑止とdelivery availabilityを担う。
- DB processing leaseはcurrent attemptの実行所有権とcorrectnessを担う。
- attempt idempotency keyはattempt fencingを担う。
- completion guardはsubmission終端保存の一意化を担う。
- external queue導入後もDB lease / attempt fencing / completion guardを維持する。
- WorkerはDB heartbeatとqueue visibility extensionを併用する。
- visibility extension失敗だけで結果保存せず、DB所有権を再確認する。
- DB ownership喪失時は結果保存せず、queue nackまたはvisibility expiryに委ねる。

### transport retry / application retry
transport retry:
- 同一message / 同一grading attemptを再配送する。
- attemptを増やさない。
- attempt keyを変更しない。

application retry:
- infrastructure failure / stale recoveryの判断で開始する。
- `retry_pending -> queued` を経由する。
- new grading attempt / new keyを発行する。
- queue delivery countをgrading attemptとして扱わない。

backoff初期候補:
- transport: base 1秒 / multiplier 2 / max 30秒 / max delivery 5 / full jitter
- application: base 5秒 / max 60秒 / full jitter
- grading attempt上限は既存 `WORKER_MAX_INFRA_RETRY_ATTEMPTS` を正本とする。
- 実装値は環境設定として後続Issueで確定する。

### DLQ
DLQ投入候補:
- message schema不正
- 必須識別子欠落
- max delivery count超過
- consumerの反復DB接続失敗
- adapter / schema version不整合

DLQへ入れない:
- runtime failure
- 通常test failure
- terminal済みduplicate
- old attempt message
- attempt/key不一致の安全なno-op

保持してよい項目:
- message id
- submission id
- grading attempt
- attempt keyのhashまたは参照ID
- schema version
- failure category
- delivery count
- first / last failed at
- generalized error code
- adapter / consumer version
- correlation id

retention初期候補は14日とし、環境設定で変更可能にする。

### DLQ replay / purge
same-attempt replay条件:
- submissionが存在する。
- completion guard未設定。
- status=`queued`。
- attempt / keyがmessageと一致する。

replayしない条件:
- terminal済み
- running
- old attempt
- completion guard設定済み
- schema不正未解決
- hidden tests境界侵害疑い

`infra_failed` からの手動再実行はold message replayではなく、承認済みnew attempt作成として扱う。

- replay / purgeはops権限と監査ログを必須とする。
- learner / 通常adminへDLQ本文を返さない。
- security incident疑いは自動purgeせずincident手順へ移す。

### queue障害時の確認順
1. enqueue success / failureとresponse codeを確認する。
2. DB上のsubmission status / attempt / completion guardを確認する。
3. queue depth / oldest age / delivery countを確認する。
4. claim success / no-op / failureを確認する。
5. visibility extension / heartbeat失敗を確認する。
6. transport retryかapplication retryかを分類する。
7. DLQ投入済みの場合はmessage最小情報とDB current stateを照合する。
8. replay条件を満たさない場合はreplayしない。
9. learner-facing情報へ内部情報が混入していないことを確認する。

## 確認手順

### queued起動時回収
1. Worker停止中にDB上で対象submissionが `queued` であることを確認する。
2. Workerを起動する。
3. 回収件数だけをログで確認する。
4. 対象submissionが `running` を経て終端状態へ遷移することを確認する。
5. 重複ジョブでも条件付きclaimにより一方のみが処理することを確認する。

### lease / heartbeat
1. heartbeat feature flagを有効にする。
2. claim時にclaimed/heartbeat/lease期限が保存されることを確認する。
3. 実行中にheartbeat時刻とlease期限が延長されることを確認する。
4. terminal保存後にprocessing lease情報がNULLになることを確認する。
5. attempt/key不一致のheartbeat・terminal保存がno-opになることを確認する。
6. lease期限切れ後のheartbeat・terminal保存がno-opになることを確認する。
7. learner-safe APIにlease・heartbeat・attempt key・hidden tests詳細が出ないことを確認する。

### stale recovery
1. heartbeatを有効、stale recoveryを無効にした状態で期限切れleaseの `running` を準備する。
2. scanner無効時は状態が変わらないことを確認する。
3. stale recoveryを有効にしてWorkerを起動する。
4. startup scanでattemptがincrementし、新keyのqueued attemptとして再投入されることを確認する。
5. Worker起動後に別の期限切れrunningを準備し、periodic scanで回収されることを確認する。
6. leaseがNULLの `legacy_running` が回収されないことを確認する。
7. expected lease、attempt、keyのいずれかが不一致の場合にno-opとなることを確認する。
8. 同一候補へ重複recoveryを実行し、1件だけ成功することを確認する。
9. retry上限到達時は `infra_failed` とcompletion guardが保存されることを確認する。
10. learner-safeでは `failed`、admin/internalでは一般化された `infra_failed` を確認する。

### external queue導入後のcontract確認
1. duplicate deliveryでgrading attemptが増えないことを確認する。
2. DB claim成功したconsumerだけがRunnerを実行することを確認する。
3. message受信直後ではなくDB永続化後にackすることを確認する。
4. consumer crash後にredeliveryされることを確認する。
5. old attempt / terminal messageがno-op + ackになることを確認する。
6. visibility extension失敗時にDB ownershipを再確認することを確認する。
7. max delivery count超過でDLQへ移ることを確認する。
8. DLQ replay前にDB current stateを再検証することを確認する。
9. queue / DLQ / logsにcode・hidden tests・secretが含まれないことを確認する。

## rollout
1. nullableなlease関連列のadditive migrationを適用する。
2. heartbeat・attempt fencing・queued retry failure終端化対応Workerを、stale recovery無効でdeployする。
3. migration、通常採点、queued起動時回収、retry経路の回帰がないことを確認する。
4. 限定環境でheartbeatを有効化する。
5. claim・heartbeat・fenced completionを確認する。
6. stale recoveryを小さいbatch / concurrencyで有効化する。
7. stale候補数、requeued数、infra_failed数、no-op数、error数を監視する。
8. queue port / message contractを現行HTTP behaviorのまま導入する。
9. transport observabilityとapplication retry backoff seamを段階導入する。
10. external queue / transactional outboxを非本番PoCで検証する。
11. limited rolloutではDB lease / stale scanner / HTTP rollback経路を維持する。
12. queue depth / oldest age / DLQ / duplicate / costを確認後にexternal queueを既定化する。

## rollback
- `WORKER_STALE_RECOVERY_ENABLED` を無効化する。
- 必要に応じてheartbeatも無効化する。
- external queue adapterを無効化し、HTTP adapterへ戻す。
- DB attempt fencing / completion guard / processing leaseを維持する。
- nullable列・outbox相当データは残し、destructive downgradeを行わない。
- external queue内messageは状態確認前にpurgeしない。
- rollback後のlease期限切れrunningは運用者確認後の手動復旧対象とする。
- `legacy_running` は引き続き自動回収しない。

## 再試行判断マトリクス
- HTTP enqueue到達不能: queued行を保持し、起動時回収または運用確認
- external queue enqueue失敗: outbox再送またはproducer retry、attemptは増やさない
- duplicate delivery: DB claim no-op、attemptは増やさない
- max delivery count超過: DLQへ隔離、DB状態を確認
- Worker再起動後の `queued`: 起動時自動回収
- retry再投入失敗: 現在のqueued attemptを `infra_failed` へ終端化
- Worker実行中断 / stale `running`（lease非NULL・期限切れ）: stale scannerでnew attempt回収
- `legacy_running`（lease NULL）: 自動回収せず手動判断
- infrastructure failure: application retry可（既存上限・基盤復旧確認に従う）
- timeout: 原則失敗確定
- runtime failure: 原則再試行しない
- hidden tests境界侵害の疑い: 自動再試行・DLQ replayを停止し、セキュリティ確認へ移行

## 手動復旧手順
1. submission id / correlation idで対象を特定する。
2. status、completion guard、attempt、lease期限を確認する。
3. queue message id / delivery count / DLQ stateを確認する。
4. `queued` かつcompletion guard未設定の場合はqueue redeliveryまたはWorker起動時回収を優先する。
5. `running` かつlease非NULL・期限切れの場合はscanner有効状態と直近scanログを確認する。
6. leaseがNULLなら `legacy_running` として自動回収しない。
7. DLQ replayはqueued / guard未設定 / attempt-key一致を満たす場合だけ行う。
8. `infra_failed` から再実行する場合はold message replayではなくnew attempt作成として扱う。
9. scanner・queueが連続失敗している場合はfeature flagを無効化し、運用者承認でnew attemptまたは失敗確定を行う。
10. learner向け表示は一般化文言を維持する。
11. 復旧・replay・purge結果を監査ログへ記録する。

## 監査ログ最小要件
- submission id
- attempt番号
- correlation id
- queue message id
- delivery count
- failure分類
- retry / recovery / replay判断理由
- claim / heartbeat / enqueue / delivery / ack / recovery / completionの結果
- 内部処理種別
- 時刻（UTC）

禁止事項:
- hidden tests実データ
- 提出コード本文
- secret / token / password
- learner向けのattempt key、lease期限、worker情報、DLQ情報

## エスカレーション基準
- 同分類障害が短時間に多発する。
- enqueue failure率が上昇する。
- queue oldest ageが採点SLOを超える。
- DLQ depthが増加する。
- visibility extension / heartbeat失敗が連続する。
- retry再投入失敗が連続する。
- lease期限切れ `running` が増加する。
- stale scanのerror / no-opが急増する。
- attempt mismatch / completion guard no-opが急増する。
- 回収後のqueuedが減少しない。
- 重複完了・整合性異常の兆候がある。
- hidden tests境界侵害の疑いがある。

## 連携先
- Repository: `https://github.com/mizzz-ivr/ai-code-dojo`
- Issue #109: `https://github.com/mizzz-ivr/ai-code-dojo/issues/109`
- PR #110: `https://github.com/mizzz-ivr/ai-code-dojo/pull/110`
- Issue #105: `https://github.com/mizzz-ivr/ai-code-dojo/issues/105`
- PR #108: `https://github.com/mizzz-ivr/ai-code-dojo/pull/108`
- queue運用設計: `docs/reports/2026-07-23-queue-operations-visibility-dlq-backoff-design.md`
- queue責務ADR: `docs/adr/2026-07-23-queue-delivery-and-db-fencing-boundary.md`
- stale running設計: `docs/reports/2026-07-22-stale-running-lease-recovery-design.md`
- stale running ADR: `docs/adr/2026-07-22-stale-running-lease-recovery.md`
- Worker failure retry policy: `docs/reports/2026-05-18-worker-failure-retry-policy.md`
