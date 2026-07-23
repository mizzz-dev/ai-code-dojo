# Issue #105 stale running recovery scanner Codex Prompt

## Prompt

docs/ai-protocol/PROMPT.txt を最優先ルールとして遵守してください。

Repository:
https://github.com/mizzz-dev/ai-code-dojo/

対象 Issue:
https://github.com/mizzz-dev/ai-code-dojo/issues/105

作業目的:
lease期限切れの `running` submissionをWorker起動時および定期実行で検出し、expected attempt / attempt idempotency key / lease expiryを含むtransactionに成功した処理だけがnew attemptとして安全に回収できるようにしてください。

前提:
- APIで提出コードを直接実行しないこと。
- hidden testsは内部専用で、学習者向け返却・Issue・PR・docs・ログへ詳細を記載しないこと。
- challengeは直接上書きせず、version追加方式を維持すること。
- Issue #101 / PR #103でstale recovery設計を確定済みです。
- Issue #102 / PR #104でlease、heartbeat、attempt fencing、fenced completionを実装済みです。
- Issue #106 / PR #107でretry再投入失敗時のqueued attempt終端化を実装済みです。
- DBはNode組み込み `node:sqlite` の `DatabaseSync` を利用しています。

実装方針:
- stale候補は `status = running` / completion guard未設定 / lease非NULL / lease期限切れに限定してください。
- leaseがNULLの `legacy_running` は自動回収しないでください。
- recovery条件にsubmission id / expected attempt / expected attempt idempotency key / expected lease expiryを含めてください。
- SQLiteの明示的transactionで回収権取得・attempt更新・leaseクリアを一貫処理してください。
- retry上限未満では `running -> retry_pending -> queued(new attempt/key)` としてください。
- retry上限到達時はcompletion guardを設定して `infra_failed` へ終端化してください。
- stale回収では同じattemptを再利用しないでください。
- 回収成功したnew attemptだけをWorkerへ再投入してください。
- 再投入失敗時はPR #107で追加したqueued attempt専用のfenced終端化経路を利用してください。
- Worker起動時と一定間隔でscannerを実行してください。
- feature flag / interval / batch size / concurrencyを設定・検証してください。
- stale recovery有効時はheartbeat有効を必須にしてください。
- 前回scan実行中は次scanをskipしてください。
- scanner失敗でhealth endpointを停止しないでください。

実装禁止事項:
- APIプロセスで提出コードを実行しないこと。
- Runner・採点ロジック・hidden tests仕様を変更しないこと。
- auth / admin / UI / deploymentを変更しないこと。
- Redis / BullMQ / Cloud Tasks等の外部queueを導入しないこと。
- DB schema / migration / seedを変更しないこと。
- generic updateの条件を緩めないこと。
- `.data/app.db`、secret、環境変数値、認証情報をコミットしないこと。
- 無関係なリファクタリングを混在させないこと。

参照すべき docs:
- `docs/ai-protocol/PROMPT.txt`
- `README.md`
- `docs/project-overview.md`
- `docs/current-status.md`
- `docs/active-issues.md`
- `docs/architecture/system-overview.md`
- `docs/reports/2026-07-22-stale-running-lease-recovery-design.md`
- `docs/adr/2026-07-22-stale-running-lease-recovery.md`
- `docs/runbooks/2026-05-18-worker-failure-recovery-runbook.md`
- `docs/logs/2026-07-23-issue-106-queued-retry-enqueue-failure-finalization.md`
- `docs/handoff/2026-07-23-issue-106-queued-retry-enqueue-failure-finalization-handoff.md`

作成/更新すべき docs:
- `docs/current-status.md`
- `docs/active-issues.md`
- `docs/architecture/system-overview.md`
- `docs/runbooks/2026-05-18-worker-failure-recovery-runbook.md`
- `docs/logs/2026-07-23-issue-105-stale-running-recovery-scanner.md`
- `docs/ai-prompts/2026-07-23-issue-105-stale-running-recovery-scanner-codex.md`
- `docs/handoff/2026-07-23-issue-105-stale-running-recovery-scanner-handoff.md`

runner / Worker観点:
- stale scannerはWorker責務としてください。
- APIからRunnerを直接呼ばないでください。
- Workerの既存claim、heartbeat、retry、completion lifecycleを維持してください。
- 旧Workerのheartbeat・状態更新・terminal保存がnew attemptを上書きしないことを確認してください。
- scan候補単位の失敗で他候補の回収を止めないでください。

hidden tests観点:
- hidden testsの入力、期待値、ケース、ログをIssue・PR・docs・ログへ記載しないでください。
- learner-safeレスポンスへ内部テスト結果、attempt key、lease、worker情報を返さないでください。

Auth / Admin観点:
- auth / admin仕様は変更しないでください。
- learner-safeでは `infra_failed` を既存仕様どおり `failed` に抽象化してください。
- admin/internalでもhidden tests実データを運用ログへ転記しないでください。

DB / migration観点:
- schema / migration / seedは変更しないでください。
- `node:sqlite` `DatabaseSync` で利用可能な明示的transactionを使用してください。
- transaction条件にexpected lease expiryを含め、heartbeat延長後の古い候補を回収しないでください。
- completionとrecoveryの競合時に結果が一意であることを確認してください。

セキュリティ・プライバシー観点:
- ログにはsubmission id、attempt、action、reason、件数、UTC時刻だけを必要最小限で記録してください。
- 提出コード本文、hidden tests、secret、token、password、attempt keyをログへ出さないでください。

商用・教育利用観点:
- Worker中断後に採点が永久停止しないこと。
- 複数scannerでも二重回収しないこと。
- retry上限到達時に確実に失敗確定できること。
- rollout / rollbackをfeature flagで安全に行えること。
- 問い合わせ時にIssue / PR / docs / logsから回収判断を追跡できること。

テスト/確認観点:
- 未期限切れrunningは候補にならない。
- lease期限切れrunningのみ候補になる。
- `legacy_running` は候補にならない。
- expected attempt / key / lease expiry不一致はno-opになる。
- 同一候補のrecoveryは1回だけ成功する。
- recoveryでattemptとkeyが更新される。
- 旧attemptのheartbeat・terminal保存がno-opになる。
- retry上限到達時はcompletion guard付き `infra_failed` になる。
- scanner無効時は自動回収しない。
- startup scannerで回収できる。
- periodic scannerで回収できる。
- scanner多重実行をskipできる。
- recovery後の再投入失敗を `infra_failed` へ終端化できる。
- learner-safe境界を維持する。
- `pnpm lint`
- `pnpm typecheck`
- `pnpm test:unit`
- `pnpm test:integration`
- `pnpm schema:validate`
- `pnpm build`
- docs validation

完了条件:
- Issue #105の完了条件を満たすこと。
- 全品質ゲートが成功すること。
- 正本docs、作業ログ、AIプロンプトログ、handoffを更新すること。
- 無関係な仕様変更を含めないこと。

最終出力フォーマット:
## Summary
## Completed Tasks
## Changed Files
## Technical Decisions
## Rejected Alternatives
## Risks
## Remaining Tasks
## Test Results
## Documents Updated
## Logs
## ADRs
## AI Prompts Used
## Execution Evidence
## Agent Handoff
## Branch Cleanup
## Final Recommendation
