# 2026-07-23 queue運用設計（Issue #109）

## 目的

現行のAPI→Worker同期HTTP enqueueと、将来導入する永続queueについて、enqueue / delivery / claim / ack / visibility timeout / retry / backoff / DLQ / replay / monitoringの責務境界を確定する。

本設計では、APIで提出コードを直接実行しないこと、hidden testsを学習者へ露出しないこと、attempt idempotency key・attempt fencing・completion guardを正しさの最終防御として維持することを不変条件とする。

## スコープ

### 対象

- 現行HTTP enqueueの実装・障害モード
- queue message contract
- delivery / ack / nack / redelivery semantics
- visibility timeoutとDB processing leaseの責務差分
- transport retryとgrading attempt retryの責務分離
- backoff / jitter / max delivery count
- DLQ / replay / purge / retention
- learner-safe / admin / internal境界
- observability / alert / runbook
- 現行構成から外部queueへの段階移行
- rollout / rollback
- 後続実装Issueの分割

### 非対象

- Redis / BullMQ / Cloud Tasks等の製品選定
- queue adapter / producer / consumerのコード実装
- DB schema / migration / seed変更
- Runner隔離方式・採点ロジック変更
- hidden tests仕様変更
- auth / admin / UI / deployment変更
- challengeの直接上書き

## 現状確認

### API producer

- submissionをSQLiteへ `queued` で保存した後、Workerの `POST /jobs` へ同期HTTPでenqueueする。
- message相当のpayloadはsubmission id / grading attempt / attempt idempotency keyである。
- HTTP responseが2xxならenqueue成功、接続失敗または非2xxなら失敗として扱う。
- enqueue失敗時もDB上の `queued` submissionは残り、Worker起動時のqueued回収で復旧できる。

### Worker consumer

- `POST /jobs` はpayloadを受理すると202を返し、`setImmediate`で処理を開始する。
- 202はWorkerプロセスが受理したことを示すが、永続queueへの保存・ackを意味しない。
- WorkerはDB上のsubmissionをattempt / key / completion guard条件付きでclaimし、claim成功時のみ採点する。
- heartbeat有効時はprocessing leaseを延長する。
- Worker停止後のlease期限切れはstale scannerがnew attemptとして回収する。

### 現行の安全装置

- attempt idempotency key: submission + attempt単位の実行識別・fencing
- conditional claim: 重複delivery時に一件だけ `queued -> running` を取得
- processing lease / heartbeat: 実行所有権の期限管理
- stale scanner: Worker停止後の `running` をnew attemptへ回収
- completion guard: submission単位の終端保存一意化
- queued retry enqueue failure finalization: new attemptの再投入失敗を `infra_failed` へ終端化

### 現行HTTP queueに不足する機能

- durable message storage
- broker acknowledgement
- visibility timeout
- delivery count
- delayed delivery
- exponential backoff / jitter
- dead-letter queue
- queue depth / oldest age / delivery latency
- replay / purge / retention
- producerとDBのtransactional outbox

## 用語と責務

### delivery

queueからconsumerへ同一messageが渡される一回の配送を指す。

### grading attempt

同一submissionで正当に採点をやり直す単位を指す。attemptが進むたびに新しいattempt idempotency keyを発行する。

### transport retry

同一message・同一grading attemptの配送やconsumer処理開始を再試行することを指す。grading attemptを増やさない。

### application retry

Infrastructure failureやstale recoveryにより、`retry_pending -> queued` でnew grading attemptを開始することを指す。grading attemptとattempt idempotency keyを更新する。

### visibility timeout

queueが配送済みmessageを他consumerへ再配送しない期間を指す。delivery availabilityの仕組みであり、DB上の実行所有権を保証しない。

### processing lease

DB上で現在attemptを実行できる所有権期限を指す。Workerのheartbeat・terminal保存・stale recoveryをfenceする正しさの仕組みである。

### DLQ

規定回数を超えて正常処理できないqueue messageを通常配送から隔離し、運用者確認へ移す内部queueを指す。submissionの `infra_failed` 状態とは別概念とする。

## 採用方針

### 1. delivery semanticsはat-least-onceを前提とする

外部queueは同一messageを複数回配送し得るものとして設計する。

- exactly-once deliveryを前提にしない。
- duplicate deliveryは正常系として扱う。
- WorkerはDB conditional claimに成功した場合だけ採点する。
- terminal済み、旧attempt、attempt/key不一致、他Workerがrunning取得済みの場合はidempotentにackまたは無害化する。

理由:

- 一般的なqueueの再配送・consumer crashに耐えられる。
- 現在のattempt fencing / completion guard設計と整合する。
- queue製品固有のdeduplication機能へ正しさを依存しない。

### 2. queue messageは最小参照情報だけを持つ

推奨message contract:

```json
{
  "schemaVersion": 1,
  "submissionId": "opaque-id",
  "gradingAttempt": 1,
  "attemptIdempotencyKey": "opaque-internal-key",
  "correlationId": "optional-opaque-id"
}
```

含めない情報:

- 提出コード本文
- challenge本文・starter code
- visible / hidden testsの内容・期待値・入力
- Runner configの機密情報
- secret / token / password
- learnerへ不要な内部エラー詳細

messageは処理対象を参照するための内部識別子に限定し、実データはWorkerが認可済み内部経路から取得する。

### 3. HTTP 202とdurable enqueueを区別する

現行HTTP adapterでは、Workerの202は「プロセスがrequestを受理した」ことのみを示す。

- messageの永続保存を保証しない。
- Workerが202直後に停止した場合、DB上のqueued回収が復旧経路となる。
- 現行構成ではDBのsubmission行がdurable sourceであり、HTTP deliveryはbest effort notificationとして扱う。

外部queue導入後は、producer成功を「brokerがdurable enqueueを確定した」と定義する。

### 4. consumer ackはDBの永続状態遷移後に行う

将来consumerのack条件:

1. messageをvalidationする。
2. DBからsubmissionとcurrent attemptを確認する。
3. conditional claimを実行する。
4. 以下のいずれかがDBへ永続化された後にackする。
   - terminal結果
   - application retryのnew attempt作成とnew message enqueue成功
   - retry enqueue failureを含むterminal確定
   - duplicate / stale / terminal / attempt mismatchとして安全なno-opが確認できた

ack前にconsumerが停止した場合はmessageを再配送する。再配送先はDB claim / fencingで重複実行を防ぐ。

### 5. queue visibility timeoutとDB processing leaseを併用する

責務分離:

| 機構 | 主責務 | 正しさへの位置付け |
|---|---|---|
| queue visibility timeout | 同一messageの一時的な再配送抑止 | availability補助 |
| DB processing lease | 現在attemptの実行所有権 | correctness |
| attempt idempotency key | attempt単位のfencing | correctness |
| completion guard | submission終端保存の一意化 | correctness |

併存方針:

- 外部queue導入後もDB processing lease / attempt fencing / completion guardを維持する。
- Workerは採点中にDB heartbeatとqueue visibility extensionの両方をbest effortで更新する。
- queue visibility extension失敗だけでterminal結果を保存しない。DB lease所有権を再確認する。
- DB heartbeat失敗または所有権喪失時は結果保存を行わず、queue側はnackまたはvisibility expiryに委ねる。
- stale scannerは少なくとも移行・安定化期間は維持し、orphaned runningの最終回収手段とする。

設定関係の初期方針:

- queue visibility timeoutは、通常のDB lease durationより長く設定する。
- visibility extension cadenceはvisibility timeoutの3分の1以下を目安とする。
- 実際の値はRunner timeout、P95 / P99実行時間、network遅延を計測して決定する。

### 6. transport retryとgrading attempt retryを分離する

#### transport retry

- 同一message / 同一attemptを再配送する。
- grading attemptを増やさない。
- attempt idempotency keyを変更しない。
- DB claimに失敗したduplicate deliveryは正常なno-opとして扱う。

#### grading attempt retry

- Infrastructure failureまたはstale recoveryのapplication判断で開始する。
- `retry_pending -> queued` を経由する。
- grading attemptをincrementする。
- new attempt idempotency keyを発行する。
- new messageをenqueueする。

queue delivery countをgrading attemptとして扱わない。

### 7. backoffはfull jitter付きexponential backoffを推奨する

#### transport retry初期候補

- base delay: 1秒
- multiplier: 2
- max delay: 30秒
- max delivery count: 5
- jitter: full jitter

#### application retry初期候補

- 現在の `WORKER_MAX_INFRA_RETRY_ATTEMPTS` をattempt上限の正本とする。
- retry delayはtransport retryより長い別設定とし、初期候補はbase 5秒 / max 60秒 / full jitterとする。
- 即時retryを残す期間はfeature flagまたはadapter設定で段階移行する。

値は実装Issueで環境設定として確定し、コードへベタ書きしない。

### 8. DLQはqueue messageの配送異常を隔離する

DLQ投入候補:

- message schema不正
- 必須識別子欠落
- max delivery count超過
- consumerが繰り返しDBへ接続できない
- queue adapter / payload version不整合
- 明示的に再配送停止が必要なinternal policy violation

DLQへ直接入れないもの:

- learner codeのRuntime failure
- 通常のtest failure
- terminal済みsubmissionへのduplicate delivery
- 旧attempt message
- attempt/key不一致の安全なno-op

保持する最小情報:

- queue message ID
- submission ID
- grading attempt
- attempt idempotency keyのhashまたは参照ID
- schema version
- failure category
- delivery count
- first / last failed at（UTC）
- generalized error code
- queue adapter / consumer version
- correlation ID

保持禁止:

- 提出コード本文
- hidden tests詳細
- test artifact本文
- stack traceの無加工全文
- secret / token / password
- private internal endpointの認証情報

### 9. DLQ replayはDB状態を再検証してから行う

same-attempt replay条件:

- submissionが存在する。
- completion guardが未設定。
- statusが `queued` である。
- grading attemptがmessageと一致する。
- attempt idempotency keyがmessageと一致する。

replayしない条件:

- terminal済み
- `running`
- current attemptより古いmessage
- completion guard設定済み
- message schema不正が未修正
- hidden tests境界侵害の疑い

`infra_failed` からの手動再実行は、古いDLQ messageのreplayではなく、承認済みのnew grading attempt作成として別操作にする。

### 10. DLQ retention / purge

初期推奨:

- retention: 14日
- 環境設定で変更可能
- terminal済み・旧attempt・重複messageは確認後に早期purge可能
- hidden tests境界侵害・security incident疑いは自動purgeせずincident手順へ移す

法務・契約・教育機関の保存要件がある場合は、payload最小化を維持したうえで別途保存期間を決定する。

### 11. access control

- queue / DLQはprivate networkまたはservice-to-service認証を必須とする。
- learnerはqueue、DLQ、delivery count、attempt key、internal errorを参照できない。
- admin APIへDLQ本文を直接露出しない。
- replay / purgeはops権限を分離し、監査ログを必須とする。
- hidden tests実データはadmin / opsにもDLQ経由で提供しない。

### 12. observability

必須metrics:

- enqueue success / failure count
- enqueue latency
- queue depth
- oldest message age
- delivery count histogram
- claim success / no-op / failure
- ack / nack / visibility extension failure
- transport retry count
- application retry count
- DLQ depth / ingress / replay / purge
- stale scanner candidate / recovered / no-op / error
- completion guard no-op
- attempt mismatch / old attempt message count

必須log fields:

- submission ID
- grading attempt
- correlation ID
- message ID
- delivery count
- action
- generalized reason
- result
- timestamp（UTC）

記録禁止情報はqueue messageと同じとする。

alert候補:

- queue oldest ageが採点SLOを超える
- enqueue failure率上昇
- DLQ depthが0より増加
- visibility extension failureの連続
- stale recovery急増
- attempt mismatch / completion guard no-op急増

具体的閾値は実運用計測後に別Issueで確定する。

## 現行HTTP構成で先行する改善

外部queue導入前に、以下を小さいIssueへ分割する。

1. queue port / HTTP adapterの責務分離
   - `enqueueSubmissionAttempt` のcontractをinterface化する。
   - 現行HTTP挙動は変更しない。
2. message schema validation
   - schemaVersion、submissionId、attempt、keyのvalidationをproducer / consumer共通で行う。
3. transport observability
   - enqueue result、202受理、claim no-op、queued recoveryを一般化metric / logへ記録する。
4. retry scheduling seam
   - application retryのdelay / backoffを注入可能にする。
5. ops runbook
   - queue滞留・replay・DLQ相当の手動判断を明文化する。

## 外部queue導入時の推奨構成

```text
API
  -> DB transaction: submission + outbox event
  -> Outbox publisher
  -> External Queue
  -> Worker consumer
  -> DB conditional claim
  -> Runner
  -> DB fenced completion
  -> ack
```

### transactional outbox

DB保存とqueue enqueueのdual-write不整合を避けるため、外部queue導入時はtransactional outboxを推奨する。

- submission作成とoutbox event作成を同一DB transactionで保存する。
- publisherが未送信outboxをqueueへ送る。
- enqueue成功後にoutboxを送信済みへ更新する。
- publisher再実行によるduplicate enqueueはattempt idempotency keyとconditional claimで無害化する。

現行SQLiteでoutboxを先行実装するか、将来RDB移行と合わせるかは別Issueで判断する。

## rollout

### Phase 1: contract / observability

- queue portとmessage schemaを導入する。
- adapterは現行HTTPのままにする。
- behavior changeを行わない。

### Phase 2: retry scheduling / ops

- transport retryとapplication retry設定を分離する。
- backoff設定をfeature flagで導入する。
- queue metrics / runbookを整備する。

### Phase 3: outbox / external queue PoC

- 製品選定は別ADRで行う。
- outboxとexternal queue adapterを非本番で検証する。
- duplicate delivery / consumer crash / visibility expiry / DLQを検証する。

### Phase 4: limited rollout

- external queue producer / consumerを限定環境で有効化する。
- DB processing lease / stale scannerを維持する。
- HTTP direct enqueueはrollback用に保持する。

### Phase 5: full rollout

- SLO・DLQ・cost・recovery結果を確認する。
- external queueを既定にする。
- HTTP direct enqueueの停止は別PRで行う。

## rollback

- producer / consumer adapterをHTTPへ戻す。
- DB attempt fencing / completion guard / processing leaseは変更しない。
- outbox未送信eventは保持し、rollback後の重複送信を許容する。
- external queue内messageは受信停止し、purgeせず状態確認する。
- destructive schema downgradeを行わない。
- learner-facing API語彙を変更しない。

## テスト方針

### contract

- messageに必須識別子だけが含まれる。
- code / hidden tests / secretがmessageへ混入しない。
- schema version不一致を安全に拒否する。

### producer

- durable enqueue成功と失敗を区別する。
- timeout時の結果不明でもduplicate enqueueを許容する。
- outbox publisher再実行で正しさが壊れない。

### consumer

- duplicate deliveryで一件だけclaimする。
- terminal済みmessageをackしてno-opにする。
- old attempt messageをackしてno-opにする。
- consumer crash後にredeliveryされる。
- visibility extension失敗時にDB所有権を再確認する。

### retry / DLQ

- transport retryでgrading attemptが増えない。
- application retryでnew attempt / new keyを発行する。
- max delivery count超過でDLQへ移る。
- DLQ replay前にDB状態を再検証する。
- terminal / running / old attemptをreplayしない。

### security / privacy

- learner-safe APIへqueue / DLQ / attempt key /内部障害詳細が出ない。
- logs / metrics / DLQにhidden tests実データ・code・secretが含まれない。
- replay / purgeにops権限と監査ログが必要である。

### migration / rollback

- HTTP adapterとexternal adapterをcontract testで同じ意味に揃える。
- feature flag切替時にsubmissionを失わない。
- rollback後もqueued / running / terminal状態が整合する。

## 却下した代替案

### exactly-once deliveryを前提にする

queueやnetwork障害で保証しにくく、製品固有機能へ正しさを依存するため不採用。

### queue messageへ提出コード・testsを含める

漏洩面積、payloadサイズ、retentionリスクが増えるため不採用。

### message受信直後にackする

DB状態遷移前のconsumer crashでmessageを失うため不採用。

### redeliveryごとにgrading attemptを増やす

transport障害と採点再試行を混同し、attempt上限・監査・課金相当リスクを壊すため不採用。

### 外部queue導入後にDB fencingを削除する

duplicate delivery・旧Worker遅延結果・outbox再送をqueueだけでは防げないため不採用。

### DLQをsubmission statusとして表現する

queue配送状態と学習者向け採点状態を混同するため不採用。

### 製品選定と実装を同一PRで行う

影響範囲が大きく、rollback・比較・レビューが困難なため不採用。

## リスクと対策

### dual-write不整合

- リスク: DB保存成功後にqueue enqueueが失敗する。
- 対策: transactional outboxを推奨し、現行期間はqueued startup recoveryを維持する。

### duplicate delivery

- リスク: 二重採点・重複課金相当。
- 対策: conditional claim、attempt fencing、completion guardを維持する。

### poison message

- リスク: 無限再配送・queue滞留。
- 対策: schema validation、max delivery count、DLQ、ops alert。

### visibility timeout誤設定

- リスク: 長時間採点中の不要な再配送。
- 対策: visibility extension、DB claim no-op、実行時間metricによる設定調整。

### retry storm

- リスク: 障害時の負荷・コスト増加。
- 対策: exponential backoff、full jitter、batch / concurrency制御、circuit breaker候補。

### DLQ情報漏洩

- リスク: 提出コード・hidden tests・内部情報の長期保存。
- 対策: message最小化、retention、ops権限、監査、禁止項目test。

### migration中の二重経路

- リスク: HTTPとexternal queueから同時配送される。
- 対策: at-least-once前提、DB claim / fencing、feature flag、metric比較。

## 後続実装Issueの分割

### P1-1: queue port / message contract / HTTP adapter整理

- behavior changeなし
- producer / consumer contract
- message schema validation
- unit / integration contract test

### P1-2: queue transport observability

- enqueue / delivery / claim / retry / stale recovery metrics
- structured internal logs
- alert候補とrunbook

### P1-3: application retry backoff seam

- immediate retryからdelay注入可能な構造へ分離
- retry config / jitter / test clock
- existing max attempts維持

### P1-4: external queue / outbox製品選定とPoC

- queue候補比較
- transactional outbox方針
- delivery / ack / visibility / DLQ contract test

### P2: DLQ ops / replay / purge

- ops専用手順または内部endpoint
- authorization / audit
- retention / incident連携

## 決定事項

- delivery semanticsはat-least-onceを前提とする。
- queue messageはsubmission参照とattempt識別子だけに限定する。
- transport retryとgrading attempt retryを分離する。
- queue visibility timeoutはavailability、DB lease / fencing / completion guardはcorrectnessを担う。
- 外部queue導入後もDB fencingを維持する。
- DLQはqueue配送異常の内部隔離であり、submission statusとは分離する。
- 外部queue導入時はtransactional outboxを推奨する。
- 実装はqueue port、observability、retry scheduling、外部queue PoC、DLQ opsへ分割する。
