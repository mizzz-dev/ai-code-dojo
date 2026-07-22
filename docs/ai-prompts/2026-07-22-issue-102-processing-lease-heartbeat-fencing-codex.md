# Issue #102 Codex実装プロンプト

## Repository

`https://github.com/mizzz-dev/ai-code-dojo/`

## 対象Issue

`https://github.com/mizzz-dev/ai-code-dojo/issues/102`

## 最優先ルール

`docs/ai-protocol/PROMPT.txt` を最優先で遵守する。

- APIで提出コードを直接実行しない。
- hidden testsは内部専用とし、学習者向けレスポンス・Issue・PR・docs・ログへ詳細を出さない。
- challengeは直接上書きせず、version追加方式を維持する。
- 変更を最小差分に限定し、無関係な仕様変更を混在させない。

## 作業目的

submission claimへprocessing leaseとheartbeatを追加し、所有権を失ったWorkerや旧attemptからのheartbeat・状態更新・terminal保存をDB条件で拒否する。

## 実装内容

1. `submissions`へ以下のnullable列をadditive migrationで追加する。
   - `processing_claimed_at`
   - `processing_heartbeat_at`
   - `processing_lease_expires_at`
2. heartbeat feature flag有効時のclaimでlease情報を保存する。
3. heartbeat更新をsubmission id / running / completion guard未設定 / expected attempt / expected key / lease未失効で条件付ける。
4. Workerのnon-terminal / terminal保存をexpected attempt / expected key / lease未失効でfenceする。
5. terminal、retry_pending、new retry attemptでprocessing lease情報をクリアする。
6. completion guardを維持する。
7. heartbeat更新0件またはエラー時は所有権喪失として結果保存を行わない。
8. feature flag無効時は従来挙動を維持する。
9. learner-safeレスポンスへlease・heartbeat・attempt keyを露出しない。

## 設定値

- `WORKER_HEARTBEAT_ENABLED=0|1`
- `WORKER_LEASE_DURATION_MS=30000`
- `WORKER_HEARTBEAT_INTERVAL_MS=10000`

有効時は正の有限値を要求し、heartbeat intervalをlease durationの3分の1以下とする。

## 非対象

- stale候補一覧
- periodic scanner
- 自動recovery transaction
- 外部queue導入
- Runner・採点ロジック変更
- hidden tests仕様変更
- auth / admin / UI / deployment変更
- challenge更新

## 参照docs

- `docs/reports/2026-07-22-stale-running-lease-recovery-design.md`
- `docs/adr/2026-07-22-stale-running-lease-recovery.md`
- `docs/current-status.md`
- `docs/active-issues.md`
- `docs/architecture/system-overview.md`
- `docs/runbooks/2026-05-18-worker-failure-recovery-runbook.md`

## テスト観点

- 旧DBへlease列を冪等にmigrationできる。
- heartbeat無効時は既存挙動を維持する。
- lease付きclaimで開始時刻・heartbeat時刻・期限を保存する。
- heartbeatで期限を延長する。
- attempt/key不一致のheartbeat・terminal保存はno-opになる。
- lease期限切れ後のheartbeat・terminal保存はno-opになる。
- retry開始後の旧attempt terminal保存はno-opになる。
- terminal保存後にlease情報をクリアする。
- learner-safe APIへ内部lease情報が出ない。
- retry state machine、completion guard、queued起動時回収を壊さない。

## 確認コマンド

- `pnpm lint`
- `pnpm typecheck`
- `pnpm test:unit`
- `pnpm test:integration`
- `pnpm schema:validate`
- `pnpm build`
- docs validation

## 更新docs

- `docs/current-status.md`
- `docs/active-issues.md`
- `docs/architecture/system-overview.md`
- `docs/runbooks/2026-05-18-worker-failure-recovery-runbook.md`
- `docs/logs/2026-07-22-issue-102-processing-lease-heartbeat-fencing.md`
- `docs/handoff/2026-07-22-issue-102-processing-lease-heartbeat-fencing-handoff.md`

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
- Logs
- ADRs
- AI Prompts Used
- Execution Evidence
- Agent Handoff
- Branch Cleanup
- Final Recommendation
