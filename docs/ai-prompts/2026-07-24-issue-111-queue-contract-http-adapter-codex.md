# Issue #111 Codexプロンプト

```text
docs/ai-protocol/PROMPT.txt を最優先ルールとして遵守してください。

Repository:
https://github.com/mizzz-ivr/ai-code-dojo/

対象 Issue:
https://github.com/mizzz-ivr/ai-code-dojo/issues/111

作業目的:
現行挙動を変えずに、queue message contract、queue producer port、HTTP adapterを分離し、API producerとWorker consumerの契約をunit / integration testで固定してください。

前提:
- Issue #109 / PR #110でqueue運用責務を確定済みです。
- delivery semanticsはat-least-once前提です。
- queue transportはavailability、DB processing lease / attempt fencing / completion guardはcorrectnessを担います。
- 現行transportはWorker POST /jobsへの同期HTTP通知です。
- APIで提出コードを直接実行してはいけません。
- hidden testsは内部専用で学習者向け返却は禁止です。
- challengeはversion追加方式を維持します。

実装内容:
- schema version付きqueue message contractを共有packageへ追加する。
- messageはsubmission ID / grading attempt / attempt idempotency key / optional correlation IDに限定する。
- version不一致、欠落、不正型、未知fieldを安全に拒否する。
- queue producer portを追加する。
- HTTP queue producer adapterを追加する。
- API submission作成後のenqueueを共通portへ移行する。
- Worker retryとstale recoveryも同じenqueue経路を利用する。
- Worker POST /jobsで共通message validatorを利用する。
- 既存のenqueueSubmissionAttempt exportは必要なら互換性のため残す。

禁止事項:
- external queue / transactional outboxの実装
- visibility timeout / ack / nack / DLQ実装
- retry backoff / observability本実装
- Runner / 採点ロジック変更
- hidden tests仕様変更
- auth / admin / UI / deployment変更
- DB schema / migration / seed変更
- challenge直接上書き
- 提出コード、hidden tests、secret、環境変数値、認証情報をmessage / Issue / PR / docs / logsへ含めること
- 無関係なリファクタリング

テスト観点:
- builderがversion付き最小messageだけを生成する。
- messageへcode / tests / secretが含まれない。
- invalid version / missing field / invalid type / unknown fieldを拒否する。
- HTTP adapterが/jobsへ正しいJSONを送る。
- HTTP 2xxは成功、非2xx・network errorは失敗になる。
- Worker /jobsがvalid messageを202で受理する。
- Worker /jobsがinvalid JSON / invalid contractを400で拒否する。
- API提出、retry、stale recoveryの既存integrationが壊れない。
- learner-safeレスポンスへqueue内部情報が出ない。

確認コマンド:
- pnpm lint
- pnpm typecheck
- pnpm test:unit
- pnpm test:integration
- pnpm schema:validate
- pnpm build
- docs validation

更新docs:
- docs/current-status.md
- docs/active-issues.md
- docs/architecture/system-overview.md
- docs/logs/2026-07-24-issue-111-queue-contract-http-adapter.md
- docs/ai-prompts/2026-07-24-issue-111-queue-contract-http-adapter-codex.md
- docs/handoff/2026-07-24-issue-111-queue-contract-http-adapter-handoff.md

最終出力:
## Summary
## Completed Tasks
## Changed Files
## Technical Decisions
## Rejected Alternatives
## Risks
## Test Results
## Documents Updated
## Remaining Tasks
## Agent Handoff
## Branch Cleanup
## Final Recommendation
```
