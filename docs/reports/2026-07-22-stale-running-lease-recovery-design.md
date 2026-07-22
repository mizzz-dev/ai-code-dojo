# 2026-07-22 stale running lease / heartbeat / recovery 設計（Issue #101）

## 目的

Issue #99 / PR #100 で実装した `queued` submission の起動時回収を前提に、Worker が `running` をclaimした後で停止した場合の安全な回収方針を、実装前にdocs-onlyで確定する。

本設計では、APIで提出コードを直接実行しないこと、hidden testsを学習者へ露出しないこと、attempt単位idempotencyとsubmission単位completion guardを維持することを不変条件とする。

## スコープ

### 対象

- stale `running` の定義
- Worker claim ownership
- lease / heartbeat / timeout
- stale判定後のrecovery状態遷移
- attempt idempotency keyを用いたfencing
- completion guardとの整合
- SQLite MVPでの最小実装境界
- 将来queue基盤への置換境界
- migration / backfill / rollout / rollback
- 監査ログ・runbook・テスト観点

### 非対象

- DB schema / migration / seedの実変更
- API / Worker / Runner /採点ロジックの実変更
- 外部queue導入
- visibility timeout / DLQ / backoff本格実装
- auth / admin / UI / deployment変更
- hidden tests仕様変更

## 現状確認

- Workerは `queued` submissionを、submission id / attempt / attempt idempotency key / completion guardを条件に `running` へclaimする。
- Worker起動時にはDB上の `queued` submissionを回収する。
- `running` には生存期限・heartbeat・所有者を示す永続情報がない。
- terminal保存は現状、submission idと `completion_guard_at IS NULL` を主条件としており、実行中attemptのfencing条件を含まない。
- Runnerは子プロセスでテストを実行するため、Worker本体のイベントループからheartbeatを更新できる構成である。

## 問題定義

### stale running

以下をすべて満たすsubmissionを stale `running` と定義する。

1. `status = running`
2. `completion_guard_at IS NULL`
3. 現在attemptに対するlease期限が存在する
4. lease期限が現在時刻以前である
5. recovery処理が同じ行を条件付き更新で取得できる

単に `updated_at` が古いことだけではstaleと判定しない。`updated_at` は状態更新全般に利用され、実行所有権の期限を表さないためである。

### legacy running

lease列追加前から存在し、lease期限がNULLの `running` submissionは `legacy_running` として扱う。

`legacy_running` は自動回収しない。rolling deploy中の旧Workerが実行中である可能性を排除できないため、運用者確認後の手動復旧対象とする。

## 採用方針

### 1. attempt idempotency keyをfencing tokenとして利用する

新しいlease専用tokenはMVPでは追加しない。

- claimに成功したWorkerは、現在の `grading_attempt` と `attempt_idempotency_key` を所有権のfencing条件として保持する。
- heartbeat、非終端更新、terminal保存は、submission idだけでなく現在attemptとattempt idempotency keyの一致を必須とする。
- stale回収時は新attemptを開始し、attempt idempotency keyを更新する。
- 旧Workerが遅れてheartbeat・状態更新・terminal保存を行っても、旧attempt/keyでは更新できずno-opとなる。

理由:

- 現在の重複実行防止設計と整合する。
- stale回収後の旧Worker結果を無害化できる。
- lease tokenを別途追加するより責務と差分が小さい。

### 2. lease情報はsubmissionに保持する

将来の追加候補は以下とする。

- `processing_claimed_at`: 現在attemptをclaimしたUTC時刻
- `processing_heartbeat_at`: 最終heartbeat UTC時刻
- `processing_lease_expires_at`: 現在attemptのlease期限UTC時刻

MVPではWorker instance IDを正しさの条件にしない。必要な場合のみ、ログ用のhash化されたworker instance IDをP2で追加検討する。

### 3. Workerがheartbeatを更新する

- Workerはclaim成功後にheartbeat timerを開始する。
- heartbeatは submission id / `running` / attempt / attempt idempotency key / completion guard未設定を条件に更新する。
- heartbeat成功時に `processing_heartbeat_at` と `processing_lease_expires_at` を延長する。
- heartbeatの条件付き更新が0件の場合、Workerは所有権を失ったと判断する。
- 所有権喪失後は結果保存を行わない。Runner子プロセス停止はbest effortとし、結果保存のfencingを必須防御とする。

### 4. recovery scannerはWorker責務とする

- APIは提出コードを実行せず、stale回収・再採点開始も行わない。
- Workerは起動時と一定間隔でstale候補を走査する。
- 複数Workerが同じ候補を検出しても、DBの条件付き更新に成功した1つだけが回収する。
- scanner失敗でWorkerのhealth endpointを停止させないが、内部ログと監視対象にする。

### 5. stale回収時は新attemptを開始する

同一attemptの再利用はしない。

採用遷移:

```text
running(attempt=N, lease expired)
  -> retry_pending
  -> queued(attempt=N+1, new attempt idempotency key)
  -> running(new lease)
  -> terminal
```

実装では中間状態の観測可能性を保ちつつ、DB transaction内で回収権取得・attempt increment・新key生成・leaseクリアを一貫して行う。

理由:

- 旧Workerのattemptを明確に失効できる。
- retry state machineと整合する。
- 問い合わせ時に回収回数をattempt番号で説明できる。

### 6. 最大attempt到達時はinfra_failedへ終端化する

- stale回収も既存のinfrastructure retry上限を共有する。
- 上限未満なら新attemptへ進める。
- 上限到達時は `infra_failed` を保存し、learner-safeでは `failed` として抽象化する。
- hidden tests、stack trace、worker識別情報をlearner向けへ返さない。

## 状態遷移

### 正常系

```text
queued
  -> running(lease開始)
  -> running(heartbeat延長)
  -> completed / failed / infra_failed
```

### Worker停止

```text
running
  -> lease expired
  -> recovery CAS成功
  -> retry_pending
  -> queued(new attempt/key)
  -> running(new lease)
```

### 重複回収

```text
Worker A / Worker B が同じstale行を検出
  -> Aのrecovery CAS成功
  -> Bのrecovery CASは0件でno-op
```

### 旧Workerの遅延完了

```text
attempt=N のlease失効
  -> attempt=N+1へ回収
  -> 旧Workerがattempt=Nでterminal保存
  -> attempt/key不一致によりno-op
```

### 正常完了と回収の競合

- terminal保存が先にcompletion guardを設定した場合、recovery CASは失敗する。
- recoveryが先にattemptを更新した場合、旧Workerのterminal保存はattempt/key不一致で失敗する。
- いずれもsubmissionの正規結果は1つに保たれる。

## API / Worker / DB責務

### API

- submission作成とWorkerへの非同期依頼を継続する。
- learner-safe返却からlease・heartbeat・attempt key・worker情報を除外する。
- API本体ではstale判定・採点実行を行わない。

### Worker

- claim成功後にheartbeatを開始する。
- heartbeat失敗時は所有権喪失として結果保存を抑止する。
- stale scannerを起動時・定期実行する。
- 回収成功時のみ新attemptをenqueueする。
- ログにはsubmission id、attempt、回収理由、時刻のみを必要最小限で記録する。

### DB repository

- lease付きclaim
- fenced heartbeat
- fenced terminal update
- stale候補一覧
- stale recovery CAS / transaction
- attempt上限到達時の一意終端保存

を提供する。

汎用 `updateSubmission` に所有権を暗黙適用するのではなく、claim・heartbeat・完了・recoveryを用途別関数へ分離する。

## SQLite MVP方針

- additive nullable columnsで導入する。
- stale候補検索用index候補:
  - `(status, processing_lease_expires_at)`
- recoveryはtransactionまたは単一条件付きUPDATEを利用する。
- 比較条件に以下を含める。
  - submission id
  - `status = running`
  - `completion_guard_at IS NULL`
  - expected grading attempt
  - expected attempt idempotency key
  - expected lease expiry
- DB fileを複数ホストから共有する運用は前提にしない。

## 設定値方針

実装時の初期候補:

- `WORKER_LEASE_DURATION_MS=30000`
- `WORKER_HEARTBEAT_INTERVAL_MS=10000`
- `WORKER_STALE_RECOVERY_INTERVAL_MS=15000`
- `WORKER_STALE_RECOVERY_ENABLED=0|1`

制約:

- heartbeat intervalはlease durationの3分の1以下とする。
- 0以下・NaN・heartbeat >= lease durationの場合はWorker起動時に設定エラーとする。
- テストでは短縮値とinject可能なclockを利用し、実時間待機への依存を減らす。

これらは初期候補であり、後続実装IssueでRunner timeout・運用監視要件と照合して確定する。

## migration / backfill / rollout

### migration

- lease関連列をnullableで追加する。
- 既存のqueued・terminal行はNULLのまま保持する。
- 既存のrunning行へ自動で期限切れ値を設定しない。

### backfill

- `legacy_running` は自動回収しない。
- deploy前にWorkerを停止・drainできる場合のみ、運用者が対象を確認してretryまたは失敗確定する。
- backfill処理に提出コード・hidden tests情報を出力しない。

### rollout

1. additive migrationを適用する。
2. lease対応Workerを、stale recovery無効でdeployする。
3. 新規claimでlease・heartbeatが更新されることを確認する。
4. fenced terminal updateを確認する。
5. stale recoveryを有効化する。
6. stale件数・recovery成功数・fenced no-op件数を監視する。

### rollback

- stale recoveryをfeature flagで無効化する。
- heartbeat停止時も既存列はnullableのまま残す。
- destructive downgradeは行わない。
- rollback後のrunning行はrunbookに従い手動確認する。

## 監査ログ最小要件

記録する:

- submission id
- grading attempt
- recovery前後のattempt
- failure category (`worker_interrupted` / `lease_expired`)
- retry decision reason
- claim / heartbeat / recovery / completionの結果
- timestamp（UTC）
- worker instance IDを扱う場合はhashまたは短期識別子

記録しない:

- 提出コード本文
- hidden testsのケース・期待値・入力・ログ
- secret / token / password
- learnerへ不要な内部endpoint情報

## learner-safe / admin境界

- learner向け状態語彙は変更しない。
- recovery中のinternal `retry_pending` はlearnerへ `retrying` として返す。
- attempt番号、lease期限、heartbeat時刻、attempt idempotency key、worker情報はlearnerへ返さない。
- admin/internalでもhidden tests実データのログ転記は行わない。

## 将来queue基盤との境界

SQLite MVPのleaseは、将来queueのvisibility timeout相当をDB上で補う暫定機構である。

外部queue導入時:

- enqueue / delivery / ack / visibility timeout / DLQはqueue責務へ移す。
- DB側のattempt fencingとcompletion guardは維持する。
- queueメッセージ再配信だけに正しさを依存せず、DBで旧attempt結果を拒否する。
- DB lease列の廃止・縮小は、移行ADRとmigrationを別途作成して判断する。

## 却下した代替案

### `updated_at` だけでstale判定する

却下理由: 実行所有権の期限ではなく、誤回収の可能性がある。

### stale回収で同じattemptを再利用する

却下理由: 旧Workerの遅延heartbeat・完了保存と新Workerを区別できない。

### completion guardだけで遅延完了を防ぐ

却下理由: 新attemptが未完了でcompletion guardがNULLの場合、旧attemptの結果が先に保存される可能性がある。

### Worker起動時に全runningをqueuedへ戻す

却下理由: 正常実行中のWorkerと競合し、二重採点を発生させる。

### APIがstale回収後に直接採点する

却下理由: APIで提出コードを直接実行しない不変条件に反する。

### lease tokenを新設してattempt keyと二重管理する

MVPでは不採用。現在のattempt idempotency keyをfencing tokenとして利用できるため、正しさのための識別子を増やさない。

## リスクと対策

### heartbeatの一時遅延

- リスク: 負荷・GC・I/O遅延で誤ってlease切れとなる。
- 対策: heartbeat intervalとlease durationに十分な差を設け、設定値を検証する。

### 旧Workerの遅延結果

- リスク: recovery後に旧結果が保存される。
- 対策: terminal保存をattempt/keyでfenceする。

### scanner多重実行

- リスク: 複数Workerが同じsubmissionを回収する。
- 対策: expected attempt/key/leaseを含むCASで1件のみ成功させる。

### legacy running

- リスク: migration直後に実行中submissionを誤回収する。
- 対策: NULL leaseは自動回収せず手動確認する。

### 大量stale回収

- リスク: 一斉再投入で負荷が集中する。
- 対策: 後続実装で回収batch size・同時実行上限を設定する。

## テスト方針

### unit

- claim時にlease情報が保存される。
- expected attempt/key不一致のheartbeatが失敗する。
- heartbeatでlease期限が延長される。
- 未期限切れrunningは回収されない。
- 期限切れrunningのみ回収される。
- 同一stale行のrecovery CASは1回だけ成功する。
- recoveryでattempt/keyが更新される。
- 旧attemptのheartbeat・terminal保存がno-opになる。
- completionとrecoveryの競合で結果が一意になる。
- `legacy_running` は自動回収されない。
- attempt上限到達時はinfra_failedになる。

### integration

- 長時間実行中にheartbeatが更新される。
- Worker強制停止後、lease期限経過で別Workerが新attemptとして回収する。
- 旧Worker相当の遅延完了を送っても正規結果を上書きしない。
- learner-safeレスポンスにlease・heartbeat・attempt key・hidden tests詳細が出ない。
- feature flag無効時はstale recoveryを行わない。

### CI

- lint
- typecheck
- unit test
- integration test
- schema validation
- build
- docs validation

## 後続実装Issueの分割

### P1-1: lease / heartbeat / fenced completionのDB・Worker実装

- additive migration
- lease付きclaim
- heartbeat
- fenced terminal保存
- unit / integration test

### P1-2: stale scanner / recovery transactionの実装

- stale候補一覧
- periodic scanner
- recovery CAS
- attempt上限判定
- startup / periodic recovery test

原則はP1-1を先に実装し、fencingが有効になった後でP1-2を有効化する。

## 結論

- stale判定は専用lease期限で行う。
- claim ownershipのfencingには既存のattempt idempotency keyを利用する。
- stale回収は新attemptを開始する。
- heartbeat・完了保存・回収はexpected attempt/keyを必須条件とする。
- legacy runningは自動回収しない。
- SQLite leaseは暫定運用であり、将来queue導入後もDBのattempt fencingとcompletion guardは維持する。
