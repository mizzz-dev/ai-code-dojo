# Issue #99 Codex Prompt

docs/ai-protocol/PROMPT.txt を最優先ルールとして遵守してください。

Repository:
https://github.com/mizzz-dev/ai-code-dojo/

Target Issue:
https://github.com/mizzz-dev/ai-code-dojo/issues/99

## 作業目的
Worker再起動後にDB上へ残った `queued` submissionを回収し、同一submissionを二重採点せずに既存の採点経路へ戻してください。

## 前提
- APIで提出コードを直接実行しない。
- hidden testsは内部専用で学習者向け返却禁止。
- challengeは直接上書きせずversion追加方式を維持する。
- attempt単位idempotency keyとsubmission単位completion guardは実装済み。
- retry state machineは `queued` / `running` / `retry_pending` / `infra_failed` / `passed` / `failed` を前提とする。
- 変更は最小差分とし、無関係な仕様変更を混在させない。

## 実装禁止事項
- Redis / BullMQ / Cloud Tasks等の外部queue導入
- runner隔離方式・採点ロジック・hidden tests仕様変更
- auth / admin / infra / deployment仕様変更
- DB schema / migration / seed変更
- stale `running` を一律 `queued` へ戻す処理
- UI変更
- `.data/app.db`、secret、環境変数値、認証情報のコミット

## 参照docs
- README.md
- docs/ai-protocol/PROMPT.txt
- docs/project-overview.md
- docs/current-status.md
- docs/active-issues.md
- docs/architecture/system-overview.md
- docs/runbooks/2026-05-18-worker-failure-recovery-runbook.md
- docs/logs/2026-05-22-issue-96-retry-requeue-follow-up.md
- docs/handoff/2026-05-22-issue-96-retry-requeue-follow-up-handoff.md

## 実装方針
1. submission repositoryに、completion guard未設定かつstatus=`queued`の一覧取得処理を追加する。
2. submission id / status / grading attempt / attempt idempotency key / completion guardを条件とする `queued -> running` のclaim処理を追加する。
3. Workerの `processSubmission` はclaim成功時のみ採点を開始する。
4. Worker起動時にqueued一覧を取得し、既存 `processSubmission` 経路へ渡す。
5. 通常enqueueと起動時回収が競合してもclaimにより一方のみが処理することをテストする。
6. stale `running` は対象外としてdocsに残す。

## runner / Worker観点
- 回収と採点はWorkerの責務とする。
- APIプロセスからrunnerを直接呼ばない。
- 既存runner実装・採点結果形式を変更しない。
- Worker起動後に回収処理が失敗してもhealth endpoint自体を壊さず、内部ログで検知できること。

## hidden tests観点
- learner-safe APIへhidden testsの実データ・ログ・internal結果を返さない。
- Issue / PR / docs / logsへhidden tests実データを書かない。

## Auth / Admin観点
- auth / admin境界を変更しない。
- adminのみが既存internal情報を確認できる仕様を維持する。

## DB / migration観点
- schema / migration / seedは変更しない。
- SQLiteの条件付きUPDATEをclaimとして利用する。
- completion guard設定済み行とterminal行を回収対象にしない。
- attempt / idempotency key不一致時はclaimしない。

## セキュリティ・プライバシー観点
- 起動時ログへ提出コード本文・hidden tests・secretを出さない。
- learner-safeレスポンスへ内部識別子を出さない。

## 商用・教育利用観点
- Worker再起動後に提出が `queued` のまま停止しないこと。
- 重複採点により結果が不安定にならないこと。
- 問い合わせ時にIssue / PR / docs / logs / handoffを追跡できること。

## 完了条件
- Worker起動時にqueued submissionを回収できる。
- claim成功した処理だけが採点する。
- 通常enqueueとの競合で二重実行されない。
- terminal submissionを非終端状態へ戻さない。
- retry state machineとlearner-safe境界を壊さない。
- current-status / active-issues / runbook / log / AI prompt / handoffを更新する。

## テスト・確認
- pnpm lint
- pnpm typecheck
- pnpm test:unit
- pnpm test:integration
- queued一覧にrunning / terminalが含まれないこと
- attempt/key不一致のclaimが失敗すること
- 同一submissionの2回目claimが失敗すること
- Worker起動後にqueued submissionが終端へ進むこと
- learner-safeレスポンスにhidden tests詳細が出ないこと

## 最終出力
- Summary
- Completed Tasks
- Changed Files
- Technical Decisions
- Rejected Alternatives
- Risks
- Remaining Tasks
- Test Results
- Documents Updated
- Execution Evidence
- Agent Handoff
- Branch Cleanup
- Final Recommendation
