# Issue #106 Codex Prompt

`docs/ai-protocol/PROMPT.txt` を最優先ルールとして遵守してください。

Repository:
`https://github.com/mizzz-dev/ai-code-dojo/`

Target Issue:
`https://github.com/mizzz-dev/ai-code-dojo/issues/106`

Target PR:
`https://github.com/mizzz-dev/ai-code-dojo/pull/107`

## 作業目的

PR #104のマージ後レビューで確認された、retry再投入失敗時に新attemptが `queued` のまま残る不具合を修正してください。

`startRetryAttempt` 後は新attemptが `queued` ですが、既存の `updateSubmissionForAttempt` のterminal更新は `status = running` を要求します。既存のrunning terminal fencingを緩めず、現在のqueued retry attemptだけをattempt/idempotency keyでfenceして `infra_failed` へ一意に終端化してください。

## 前提

- APIで提出コードを直接実行しない。
- 採点はWorker経由の非同期処理を維持する。
- hidden tests詳細は内部専用で、学習者向けに返さない。
- challengeは直接上書きせずversion追加方式を維持する。
- completion guardはsubmission単位の終端一意化として維持する。
- `updateSubmissionForAttempt` のrunning terminal条件は旧Workerの遅延完了を拒否する重要なfencingである。
- Issue #105のstale scannerは本タスクへ混在させない。

## 実装禁止事項

- `updateSubmissionForAttempt` のterminal条件から `status = running` を削除しない。
- generic updateによるcheck-then-writeでattempt fencingを代替しない。
- DB schema / migration / seedを変更しない。
- Runner・採点ロジック・hidden tests仕様を変更しない。
- auth / admin / UI / infra / deploymentを変更しない。
- external queueを導入しない。
- learner-safe payloadへattempt key、lease、heartbeat、internal logsを追加しない。
- `.data/app.db`、secret、環境変数値、認証情報をコミットしない。
- 無関係なリファクタリングを混在させない。

## 参照すべきdocs

- `docs/ai-protocol/PROMPT.txt`
- `README.md`
- `docs/project-overview.md`
- `docs/current-status.md`
- `docs/active-issues.md`
- `docs/architecture/system-overview.md`
- `docs/reports/2026-05-20-retry-state-machine-state-vocabulary-decision.md`
- `docs/reports/2026-07-22-stale-running-lease-recovery-design.md`
- `docs/adr/2026-07-22-stale-running-lease-recovery.md`
- `docs/runbooks/2026-05-18-worker-failure-recovery-runbook.md`
- `docs/logs/2026-07-22-issue-102-processing-lease-heartbeat-fencing.md`
- `docs/handoff/2026-07-22-issue-102-processing-lease-heartbeat-fencing-handoff.md`

## 実装内容

1. submission repositoryへqueued retry attempt専用の終端化関数を追加する。
2. 終端結果は `infra_failed` のみ許可する。
3. 更新条件へ以下を含める。
   - submission id
   - `status = queued`
   - completion guard未設定
   - expected grading attempt
   - expected attempt idempotency key
4. 成功時に以下を同一UPDATEで保存する。
   - `status = infra_failed`
   - result JSON
   - completion guard
   - processing lease関連列のNULLクリア
5. 更新0件はno-opとして返す。
6. Workerのretry enqueue失敗経路で新しい関数を呼ぶ。
7. running attemptのterminal保存経路は変更しない。

## runner / Worker観点

- Runner実行方式は変更しない。
- Workerがinfrastructure failureを検出し、retry_pending、新attempt queued、再投入を行う既存順序を維持する。
- 再投入失敗時だけqueued attempt専用終端化を利用する。
- retry enqueue成功時の既存挙動を変更しない。
- Worker再起動へ依存せず結果をterminal化する。

## hidden tests観点

- hidden tests実データや詳細を新しいログ・docs・Issue・PRへ記載しない。
- learner-safeではinternal logsを返さない。
- hidden tests summaryの既存境界を維持する。

## Auth / Admin観点

- auth / admin認可ロジックを変更しない。
- learner-safeでは `infra_failed` を `failed` へ抽象化する既存挙動を維持する。
- admin/internalのみ再投入失敗の一般化ログを確認可能とする。

## DB / migration観点

- schema / migration / seed変更は不要。
- attempt/key/state/completion guardをSQLのWHERE条件で検証する。
- check-then-writeではなく単一の条件付きUPDATEを利用する。
- completion guard設定済み、状態不一致、attempt/key不一致では更新しない。

## セキュリティ・プライバシー観点

- 提出コード本文をログへ出さない。
- hidden tests詳細をログへ出さない。
- secret、token、password、環境変数値を記録しない。
- attempt idempotency key、lease期限、heartbeat情報をlearnerへ返さない。

## 商用・教育利用観点

- retry再投入失敗時にも学習者向け結果を確定し、無期限のqueued表示を避ける。
- 内部障害理由は学習者へ直接表示せず、運用者が確認できる範囲に限定する。
- 重複終端や旧attempt上書きを防止し、採点結果の信頼性を維持する。

## 作成・更新すべきdocs

- `docs/current-status.md`
- `docs/active-issues.md`
- `docs/runbooks/2026-05-18-worker-failure-recovery-runbook.md`
- `docs/logs/2026-07-23-issue-106-queued-retry-enqueue-failure-finalization.md`
- `docs/ai-prompts/2026-07-23-issue-106-queued-retry-enqueue-failure-finalization-codex.md`
- `docs/handoff/2026-07-23-issue-106-queued-retry-enqueue-failure-finalization-handoff.md`

ADRは新しいアーキテクチャ判断ではなく、Issue #101で確定したattempt fencing方針の不具合修正であるため原則追加しません。

## 完了条件

- queued retry attemptをexpected attempt/keyでfenceして `infra_failed` へ終端化できる。
- running、retry_pending、terminal済み、旧attempt、重複要求は更新されない。
- completion guardが設定される。
- processing lease情報がクリアされる。
- retry enqueue失敗時にqueued状態が残らない。
- learner-safeでは `failed`、admin/internalでは `infra_failed` と一般化ログを確認できる。
- API直接実行禁止、hidden tests非公開、challenge versioningを維持する。
- 正本docs・作業ログ・AIプロンプト・handoffが更新される。

## テスト / 確認観点

- 正常系: queued attemptのfenced `infra_failed` 終端化
- 異常系: result statusが `infra_failed` 以外
- 境界値: attempt/key不一致
- 状態差異: running / retry_pending / terminal済み
- 重複要求: 2回目はno-op
- completion guard設定
- processing lease情報クリア
- retry enqueue先が到達不能なintegration test
- learner-safe / admin境界
- 既存retry成功経路の回帰
- lint
- typecheck
- unit test
- integration test
- schema validation
- build
- docs validation

## 最終出力フォーマット

1. Summary
2. Implemented Changes
3. Changed Files
4. Technical Decisions
5. Rejected Alternatives
6. Test Results
7. Security / Privacy Checks
8. Risks
9. Remaining Tasks
10. PR URL
11. Agent Handoff