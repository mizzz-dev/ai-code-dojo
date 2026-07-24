# Issue #111 queue contract / HTTP adapter分離 作業ログ

## Summary

Issue #109 / PR #110のmerge後処理を確認し、次のP1としてqueue message contract、queue producer port、HTTP adapterを現行挙動を維持したまま分離した。

## Current PR / Issue

- Completed Issue: #109
- Merged PR: #110
- Current Issue: #111
- Issue URL: `https://github.com/mizzz-ivr/ai-code-dojo/issues/111`
- Current PR: #112
- PR URL: `https://github.com/mizzz-ivr/ai-code-dojo/pull/112`
- Branch: `refactor/queue-contract-http-adapter`

## Completed Tasks

- PR #110がmerged、Issue #109がClosed / Completedであることを確認した。
- 次タスクへ再利用できるopen Issueがないことを確認し、Issue #111を作成した。
- `packages/queue`を追加した。
- schema version 1のqueue message contractを追加した。
- submission ID / grading attempt / attempt idempotency key / optional correlation ID以外を拒否するvalidationを追加した。
- queue producer portとHTTP queue producer adapterを追加した。
- `enqueueSubmissionAttempt`を共有queue packageへ移し、API serviceから互換exportした。
- Worker `/jobs`で共通message contractを検証するよう変更した。
- 不正JSON、不正version、未知fieldを400で拒否するよう変更した。
- contract / HTTP adapter unit testとWorker integration contract testを追加した。
- current-status / active-issuesをIssue #111へ同期した。
- Draft PR #112を作成した。

## Repository Findings

- 従来のenqueue処理は`apps/api/src/services/submission-service.mjs`内でfetchを直接実行していた。
- Worker retryとstale recoveryは同serviceの`enqueueSubmissionAttempt`を参照していた。
- Worker `/jobs`はsubmission IDのみを必須としており、schema versionやattempt keyの厳密なcontract validationがなかった。
- 現行HTTP 202はprocess内受理であり、durable enqueueを意味しない。
- DB conditional claim、processing lease、attempt fencing、completion guardは本変更後もcorrectnessの最終防御として維持する。

## Technical Decisions

- queue message contractをAPI / Worker双方から参照できる`packages/queue`へ置く。
- message schema versionは1とする。
- unknown fieldを拒否し、code / hidden tests / secretの混入面積を抑える。
- queue producer portは`enqueue(message) -> boolean`の最小interfaceとする。
- HTTP adapterは2xxを成功、非2xx・例外を失敗として返す既存意味を維持する。
- `enqueueSubmissionAttempt`のexportをAPI serviceに残し、既存importを壊さない。
- transport retryではattemptとattempt keyを変更しない。
- Workerのaccepted response語彙は維持する。

## Rejected Alternatives

- API service内にfetchを残したままschemaだけ追加する案
  - transport差し替え境界が作れないため不採用。
- Worker専用validatorを別実装する案
  - producer / consumer contractが乖離するため不採用。
- messageへsubmission codeやtestsを含める案
  - hidden tests・提出コード漏洩とpayload保持リスクが増えるため不採用。
- 本Issueでexternal queueやoutboxまで実装する案
  - 差分と運用リスクが大きいため別Issueへ分離。

## Risks

- schema version必須化により、共通producerを通さずWorker `/jobs`を直接呼ぶ旧クライアントは400になる。
- strict unknown field validationにより、将来field追加時はschema versionまたはcontract更新が必要になる。
- HTTP adapterはdurable delivery、ack、visibility timeout、DLQを提供しない。
- correlation IDの発行・伝播はoptional contractのみで、本Issueでは運用実装しない。

## Test Results

- 最終headのCI確認後に確定する。

## Remaining Tasks

- system-overviewへ実装済みqueue contract境界を反映する。
- 最終headのlint / typecheck / unit / integration / schema validation / build / docs validationを確認する。
- PR #112本文をテスト結果込みで確定する。
- PR #112をReady for reviewへ変更する。
- Linear / Notionの同期可否を確認する。

## Suggested Next Actions

1. PR #112をレビュー・mergeする。
2. queue transport observabilityを別Issueで実装する。
3. application retry backoff seamを別Issueで実装する。
4. external queue / transactional outbox PoCを別Issueで進める。

## AI Prompts Used

- `docs/ai-prompts/2026-07-24-issue-111-queue-contract-http-adapter-codex.md`

## Handoff

- `docs/handoff/2026-07-24-issue-111-queue-contract-http-adapter-handoff.md`
