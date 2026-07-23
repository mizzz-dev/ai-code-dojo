# queue deliveryとDB fencingの責務境界

- Status: Accepted
- Date: 2026-07-23
- Issue: #109
- Related: Issue #105 / PR #108、Issue #102 / PR #104、Issue #85

## 目的

現行HTTP enqueueと将来外部queueについて、delivery・ack・visibility timeout・retry・DLQの責務と、DB processing lease・attempt fencing・completion guardの責務を分離し、重複配送やWorker障害時も採点整合性を維持する。

詳細設計は `docs/reports/2026-07-23-queue-operations-visibility-dlq-backoff-design.md` を参照する。

## 背景

現在はAPIがWorkerの `POST /jobs` へ同期HTTPで採点依頼を送り、Workerが202を返した後にプロセス内で処理を開始する。HTTP request自体は永続queueではないため、durable message、ack、visibility timeout、delivery count、backoff、DLQを持たない。

一方、Repositoryにはqueued起動時回収、processing lease / heartbeat、stale scanner、attempt idempotency key、completion guardが実装済みである。外部queue導入時にこれらをqueue機能へ置き換えるだけでは、duplicate delivery、旧Workerの遅延完了、dual-write不整合を安全に処理できない。

## 決定事項

### 1. delivery semanticsはat-least-onceとする

- duplicate deliveryを正常系として扱う。
- exactly-once deliveryを前提にしない。
- WorkerはDB conditional claimに成功した場合だけ採点する。
- duplicate / stale / terminal / old attempt messageはidempotentにno-opとする。

### 2. queue messageは最小参照情報だけを保持する

保持対象:

- schema version
- submission ID
- grading attempt
- attempt idempotency key
- optional correlation ID

保持禁止:

- 提出コード本文
- visible / hidden tests詳細
- challenge本文
- secret / token / password
- learnerへ不要な内部障害詳細

### 3. queue visibility timeoutとDB processing leaseを分離する

- queue visibility timeout: deliveryの再配送抑止とavailabilityを担う。
- DB processing lease: current attemptの実行所有権とcorrectnessを担う。
- attempt idempotency key: attempt単位のfencingを担う。
- completion guard: submission終端保存の一意化を担う。

外部queue導入後もDB processing lease、attempt fencing、completion guardを維持する。

### 4. transport retryとgrading attempt retryを分離する

- transport retryは同一message・同一attemptの再配送であり、attemptを増やさない。
- grading attempt retryはapplication判断で `retry_pending -> queued` を経由し、新attemptと新keyを発行する。
- queue delivery countをgrading attemptとして扱わない。

### 5. consumer ackはDB永続化後に行う

以下のいずれかをDBで確認・保存した後にackする。

- terminal結果
- new attempt作成とnew message enqueue成功
- retry enqueue failureを含むterminal確定
- duplicate / stale / terminal / attempt mismatchとして安全なno-op

message受信直後のackは禁止する。

### 6. DLQとsubmission statusを分離する

- DLQはqueue messageの配送異常を隔離する内部queueとする。
- `infra_failed` はsubmissionの採点結果・運用状態であり、DLQ状態ではない。
- Runtime failureや通常のtest failureをDLQへ入れない。
- terminal済み・old attempt・duplicate deliveryはDLQではなくno-opとして処理する。

### 7. DLQ replayはDB状態を再検証する

same-attempt replayは、completion guard未設定、status=`queued`、attempt/key一致の場合のみ許可する。

`infra_failed` からの手動再実行はold message replayではなく、承認済みnew grading attempt作成として扱う。

### 8. backoffはtransportとapplicationで別設定にする

- transport retry: short exponential backoff + full jitter
- application retry: infrastructure recovery向けのlonger backoff + full jitter
- current grading attempt上限は既存設定を正本とする。
- 実装値は環境設定とし、コードへベタ書きしない。

### 9. 外部queue導入時はtransactional outboxを推奨する

DB保存とqueue enqueueのdual-write不整合を避けるため、submissionとoutbox eventを同一DB transactionで保存し、publisherがqueueへ送信する構成を推奨する。

outbox再送によるduplicate enqueueはDB claim / attempt fencingで無害化する。

### 10. 段階移行する

1. queue port / message contract
2. transport observability
3. application retry backoff seam
4. outbox / external queue PoC
5. limited rollout
6. full rollout
7. HTTP direct enqueue停止

製品選定・schema変更・実装は別Issueへ分離する。

## 不変条件

- APIで提出コードを直接実行しない。
- hidden tests詳細を学習者へ返さない。
- challengeはversion追加方式で更新する。
- attempt idempotency key / attempt fencingを維持する。
- completion guardを維持する。
- learner-safe語彙を変更しない。
- queue / DLQ / logsへ提出コード、hidden tests実データ、secretを記録しない。
- Issue #109ではコード・schema・migrationを変更しない。

## 却下した案

- exactly-once deliveryを前提にする。
- queue messageへ提出コードやtestsを含める。
- message受信直後にackする。
- redeliveryごとにgrading attemptを増やす。
- 外部queue導入後にDB fencingを削除する。
- DLQをsubmission statusとして表現する。
- 製品選定と本番実装を同一PRで行う。

## リスク

- DB / queue dual-write不整合
- duplicate delivery
- poison messageによるretry loop
- visibility timeout誤設定
- retry stormとコスト増加
- DLQへの内部情報長期保存
- HTTP / external queue併存期間の二重配送

対策は詳細設計レポートを正本とする。

## 未確定事項

後続Issueで確定する。

- 外部queue製品
- transactional outboxをSQLiteで先行するか将来RDBで導入するか
- queue visibility timeout・backoff・retentionのproduction値
- queue / DLQ ops権限モデルの実装方式
- SLO・alert閾値

## 結果

queueはdelivery availabilityを担い、DB processing lease・attempt fencing・completion guardは採点correctnessを担う。外部queue導入後もDB側の防御を維持し、実装は小さい後続Issueへ分割する。
