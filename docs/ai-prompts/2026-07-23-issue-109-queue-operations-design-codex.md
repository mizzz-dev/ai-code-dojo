# Issue #109 Codex Prompt

## Repository

`https://github.com/mizzz-ivr/ai-code-dojo/`

## Target Issue

`https://github.com/mizzz-ivr/ai-code-dojo/issues/109`

## Prompt

`docs/ai-protocol/PROMPT.txt`を最優先ルールとして遵守してください。

あなたはai-code-dojoのシニアPM・テックリード・ソフトウェアアーキテクト・レビュアーとして、Issue #109「現行HTTP queueと将来外部queueのvisibility timeout・DLQ・backoff運用方針を確定する」をdocs-onlyで進めてください。

### 作業目的

現行API→Worker HTTP enqueueと、将来導入する外部queueについて、enqueue / delivery / claim / ack / visibility timeout / retry / backoff / DLQ / replay / purge / monitoringの責務境界を確定し、後続実装Issueを安全な単位へ分割します。

### 前提

- APIはsubmissionをSQLiteへ保存後、Worker `POST /jobs`へ同期HTTPでenqueueする。
- Workerの202はprocess内受理であり、durable queue ackではない。
- Workerはattempt / attempt idempotency key / completion guard条件付きでclaimする。
- processing lease / heartbeat / stale scannerを実装済み。
- stale recoveryはnew attempt / new keyとして行う。
- completion guardはsubmission単位の終端一意化を担う。
- learner-safeとinternal/admin境界を維持する。
- Repository canonical nameは `mizzz-ivr/ai-code-dojo`。

### 実装禁止事項

- API / Worker / Runnerコードを変更しない。
- queue adapter / producer / consumerを実装しない。
- Redis / BullMQ / Cloud Tasks等を導入・選定確定しない。
- DB schema / migration / seedを変更しない。
- auth / admin / UI / deploymentを変更しない。
- hidden tests仕様や採点ロジックを変更しない。
- challengeを直接上書きしない。
- `.data/app.db`、secret、環境変数値、認証情報をコミットしない。
- 無関係なリファクタリングを混在させない。

### 参照すべきdocs / code

- `README.md`
- `docs/ai-protocol/PROMPT.txt`
- `docs/project-overview.md`
- `docs/current-status.md`
- `docs/active-issues.md`
- `docs/architecture/system-overview.md`
- `docs/reports/2026-05-18-worker-failure-retry-policy.md`
- `docs/reports/2026-05-20-duplicate-grading-prevention-design.md`
- `docs/reports/2026-07-22-stale-running-lease-recovery-design.md`
- `docs/adr/2026-07-22-stale-running-lease-recovery.md`
- `docs/runbooks/2026-05-18-worker-failure-recovery-runbook.md`
- `apps/api/src/services/submission-service.mjs`
- `apps/worker/src/server.mjs`
- submission repository / stale recovery scanner関連実装

### 作成・更新すべきdocs

- `docs/reports/2026-07-23-queue-operations-visibility-dlq-backoff-design.md`
- `docs/adr/2026-07-23-queue-delivery-and-db-fencing-boundary.md`
- `docs/current-status.md`
- `docs/active-issues.md`
- `docs/architecture/system-overview.md`
- `docs/runbooks/2026-05-18-worker-failure-recovery-runbook.md`
- `docs/adr/README.md`
- `docs/reports/README.md`
- `docs/logs/2026-07-23-issue-109-queue-operations-design.md`
- `docs/ai-prompts/2026-07-23-issue-109-queue-operations-design-codex.md`
- `docs/handoff/2026-07-23-issue-109-queue-operations-design-handoff.md`

### runner / Worker観点

- Runner隔離方式・採点処理は変更しない。
- Workerのconditional claim、heartbeat、stale scanner、attempt fencingをqueue導入後も維持する。
- duplicate delivery、consumer crash、visibility expiry、old attempt deliveryを正常な障害モードとして設計する。
- ackはDB状態遷移または安全なno-op確認後に行う。
- transport retryとgrading attempt retryを混同しない。

### hidden tests観点

- queue message、DLQ、logs、metricsへhidden testsのケース・期待値・入力・artifact本文を含めない。
- Workerはsubmission参照情報だけを受け取り、hidden testsは内部経路から取得する。
- learner-safeレスポンスへqueue状態・delivery count・attempt key・内部障害詳細を返さない。

### Auth / Admin観点

- queue / DLQはlearnerからアクセス不能とする。
- admin APIへDLQ本文を直接公開しない。
- replay / purgeはops権限と監査ログを必要とする方針にする。
- hidden tests実データはadmin / opsにもDLQ経由で提供しない。

### DB / migration観点

- Issue #109ではschema / migrationを変更しない。
- 外部queue導入後もattempt fencing / completion guard / processing leaseを維持する。
- DB保存とqueue enqueueのdual-write不整合対策としてtransactional outboxを推奨案に含める。
- outbox実装は別Issue・別ADRへ分離する。

### セキュリティ・プライバシー観点

- message payloadをsubmission ID、attempt、attempt key、schema version、optional correlation IDに限定する。
- 提出コード、hidden tests、secret、token、passwordを含めない。
- DLQ retention、replay、purge、access control、監査ログを定義する。
- logs / metricsは一般化reasonとopaque IDだけを使用する。

### 商用・教育利用観点

- duplicate gradingによる重複課金相当リスクを下げる。
- queue滞留・retry storm・poison message・DLQ増加を監視可能にする。
- 問い合わせ時にdeliveryとgrading attemptを区別して説明できるようにする。
- retentionと権限を最小化し、学習者データの不要な長期保存を避ける。

### 完了条件

- 現行HTTP enqueueの限界と既存回復機構を明文化する。
- at-least-once前提を確定する。
- queue message contractを確定する。
- visibility timeoutとDB leaseの責務を分離する。
- transport retryとapplication retryを分離する。
- ack / nack / backoff / jitter / max delivery countを定義する。
- DLQ投入条件、保持情報、禁止情報、replay、purge、retentionを定義する。
- transactional outboxを含む段階移行・rollbackを定義する。
- observability / alert / runbook / test方針を定義する。
- 推奨案・代替案・却下案を整理する。
- 後続実装Issueを最小単位へ分割する。
- docs validationが成功する。

### テスト / 確認観点

- docs間でIssue / PR状態が一致する。
- Repository URLが `mizzz-ivr/ai-code-dojo` と一致する。
- message / DLQへcode・hidden tests・secretを含めない。
- duplicate deliveryでattemptが増えない。
- application retryだけがnew attemptを作る。
- ackがDB永続化より先に行われない。
- old attempt / terminal messageをreplayしない。
- rollback時もDB fencingを維持する。
- docs validationを実行する。

### 最終出力フォーマット

日本語で以下を出力してください。

1. Summary
2. Completed Tasks
3. Repository Findings
4. Changed Files
5. Technical Decisions
6. Rejected Alternatives
7. Risks
8. Remaining Tasks
9. Suggested Next Actions
10. Test Results
11. Documents Updated
12. Logs
13. ADRs
14. AI Prompts Used
15. Execution Evidence
16. Agent Handoff
17. Branch Cleanup
18. Final Recommendation
