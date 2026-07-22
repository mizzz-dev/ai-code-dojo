# Issue #101 Codex Prompt

docs/ai-protocol/PROMPT.txt を最優先ルールとして遵守してください。

Repository:
https://github.com/mizzz-dev/ai-code-dojo/

Target Issue:
https://github.com/mizzz-dev/ai-code-dojo/issues/101

## 作業目的

Workerが `queued -> running` をclaimした後に停止し、submissionが `running` のまま残るケースについて、lease / heartbeat / timeout / attempt fencing / recovery方針をdocs-onlyで確定してください。

## 前提

- Issue #99 / PR #100でWorker起動時のqueued回収と条件付きclaimは実装済みです。
- APIで提出コードを直接実行しません。
- hidden testsは内部専用で学習者向け返却禁止です。
- challengeはversion追加方式を維持します。
- attempt単位idempotency keyとsubmission単位completion guardは実装済みです。
- 変更は最小差分とし、無関係な仕様変更を混在させません。

## 実装禁止事項

- DB schema / migration / seedの実変更
- API / Worker / Runner /採点ロジックの実変更
- stale scanner・heartbeatのコード実装
- Redis / BullMQ / Cloud Tasks等の外部queue導入
- visibility timeout / DLQ / backoff本格実装
- auth / admin / UI / deployment変更
- hidden tests仕様変更
- challengeの直接上書き
- `.data/app.db`、secret、環境変数値、認証情報のコミット

## 参照docs

- README.md
- docs/ai-protocol/PROMPT.txt
- docs/ai-protocol/core/adr-rules.md
- docs/ai-protocol/templates/adr-template.md
- docs/project-overview.md
- docs/current-status.md
- docs/active-issues.md
- docs/architecture/system-overview.md
- docs/reports/2026-05-20-duplicate-grading-prevention-design.md
- docs/reports/2026-05-20-retry-state-machine-state-vocabulary-decision.md
- docs/reports/2026-05-18-worker-failure-retry-policy.md
- docs/runbooks/2026-05-18-worker-failure-recovery-runbook.md
- docs/logs/2026-07-22-issue-99-worker-startup-queued-recovery.md
- docs/handoff/2026-07-22-issue-99-worker-startup-queued-recovery-handoff.md

## 必須確認

- 現行の `claimSubmissionForProcessing`
- 現行terminal保存の条件
- `gradingAttempt` / `attemptIdempotencyKey` / `completionGuardAt` の責務
- Worker起動時queued回収
- Runnerが子プロセス実行でheartbeat可能な構成か
- learner-safeレスポンス境界

## 必須設計項目

1. stale `running` の定義
2. legacy runningの扱い
3. lease所有権
4. heartbeat更新条件
5. lease期限切れ判定
6. stale回収時のattempt更新
7. 旧Workerの遅延heartbeat・完了保存の無害化
8. completion guardとattempt fencingの役割分担
9. API / Worker / DB責務
10. SQLite MVPの条件付き更新・transaction
11. migration / backfill / rollout / rollback
12. feature flagと設定値検証
13. 監査ログ最小要件
14. learner-safe / admin境界
15. 将来queue基盤との置換境界
16. unit / integration / CIテスト観点
17. 後続実装Issueの分割

## 採用方針

- stale判定には専用lease期限を利用し、`updated_at` だけで判断しません。
- lease列候補は `processing_claimed_at` / `processing_heartbeat_at` / `processing_lease_expires_at` とします。
- 既存のattempt idempotency keyをfencing tokenとして利用します。
- heartbeat・非終端更新・terminal保存・recoveryはexpected attempt/keyを条件とします。
- stale回収時は新attemptと新attempt idempotency keyを発行します。
- completion guardとattempt fencingを併用します。
- stale scannerはWorker責務とします。
- leaseがNULLのlegacy runningは自動回収しません。
- stale scannerより先にlease / heartbeat / fenced completionを実装します。

## 作成・更新docs

- 新規: `docs/reports/2026-07-22-stale-running-lease-recovery-design.md`
- 新規: `docs/adr/2026-07-22-stale-running-lease-recovery.md`
- 更新: `docs/adr/README.md`
- 更新: `docs/current-status.md`
- 更新: `docs/active-issues.md`
- 更新: `docs/architecture/system-overview.md`
- 更新: `docs/runbooks/2026-05-18-worker-failure-recovery-runbook.md`
- 新規: `docs/logs/2026-07-22-issue-101-stale-running-recovery-design.md`
- 新規: `docs/ai-prompts/2026-07-22-issue-101-stale-running-recovery-design-codex.md`
- 新規: `docs/handoff/2026-07-22-issue-101-stale-running-recovery-design-handoff.md`

## セキュリティ・プライバシー

- hidden testsのケース・期待値・入力・ログを記載しません。
- 提出コード本文をログへ記載しません。
- secret / token / password /環境変数値を記載しません。
- attempt key、lease、heartbeat、worker情報をlearner向けへ返さない方針を明記します。

## 商用・教育利用観点

- Worker停止後もsubmissionが永久に `running` へ残らない設計にします。
- 旧Workerの遅延結果で正規結果が壊れない設計にします。
- 問い合わせ時にattemptとrecovery判断を追跡できるようにします。
- 大量回収時の負荷、段階deploy、rollbackを考慮します。

## 完了条件

- Issue #101の完了条件をすべてdocsへ反映する。
- ADR作成要否を判断し、クロスレイヤーの永続判断であるためADRを作成する。
- 後続実装Issueを作成する。
- docs validationを含むCIを確認する。
- PR本文・コミットメッセージ・Issueコメントを日本語で記載する。

## 最終出力

- Summary
- Completed Tasks
- Repository Findings
- Technical Decisions
- Rejected Alternatives
- Risks
- Remaining Tasks
- Next Issue
- Changed Files
- Validation Results
- Documents Updated
- ADRs
- Execution Evidence
- Agent Handoff
- Branch Cleanup
- Final Recommendation
