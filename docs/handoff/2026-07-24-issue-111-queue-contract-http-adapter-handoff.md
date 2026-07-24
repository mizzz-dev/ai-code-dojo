# Issue #111 queue contract / HTTP adapter分離 handoff

## Summary

queue message contract、queue producer port、HTTP adapterを共有packageへ分離し、API producerとWorker consumerが同じversion付きcontractを利用する構成へ移行した。

## Current State

- Issue: #111
- PR: #112
- Branch: `refactor/queue-contract-http-adapter`
- PR状態: Draft（Ready化前の最終同期）
- CI状態: docs validation / lint / typecheck / unit / integration / schema validation / buildすべてSuccess
- Notion: `https://app.notion.com/p/3a77322f39fa815caec7c6a4f8cec5d2`
- Linear: workspace無料Issue上限のため新規mirror作成不可

## Implemented

- `packages/queue/package.json`
- `packages/queue/src/message-contract.mjs`
- `packages/queue/src/producer-port.mjs`
- `packages/queue/src/http-queue-producer.mjs`
- `packages/queue/src/submission-queue.mjs`
- API serviceから共有enqueueを互換export
- Worker `/jobs`の共通contract validation
- invalid JSONの400応答
- queue contract unit test
- HTTP adapter unit test
- Worker `/jobs` integration contract test
- current-status / active-issues / system-overview更新
- 作業ログ / AIプロンプトログ / handoff追加

## Invariants

- APIで提出コードを直接実行しない。
- hidden tests詳細をlearnerへ返さない。
- queue messageへcode / hidden tests / secretを含めない。
- challengeはversion追加方式を維持する。
- transport retryでgrading attempt / attempt keyを変更しない。
- DB processing lease / attempt fencing / completion guardを維持する。
- DB schema / migration / seedを変更しない。

## Test Results

- docs validation: Success
- lint: Success
- typecheck: Success
- unit test: Success
- integration test: Success
- schema validation: Success
- build: Success

Contract確認:
- valid schema version 1を受理
- unsupported versionを拒否
- missing / invalid fieldを拒否
- unknown fieldを拒否
- HTTP 2xx / non-2xx / network failureを既存意味どおり判定
- Worker `/jobs`の202 / 400境界を確認
- learner-safeレスポンスへのqueue内部情報非露出を維持

## Review Focus

- strict unknown field拒否がcontract versioning方針として妥当か。
- producer / consumerが同一parserを参照しているか。
- HTTP adapterが既存の2xx成功・非2xx/例外失敗の意味を維持しているか。
- `enqueueSubmissionAttempt`互換exportが既存retry / stale recoveryを壊していないか。
- Worker `/jobs`の400応答へ機微情報が含まれていないか。
- contract testがAPI / Worker境界を十分に固定しているか。

## Remaining Tasks

1. PR #112本文を完成させ、Ready for reviewへ変更する。
2. GitHub Issue #111へ実装・テスト結果をコメントする。
3. PR #112 merge後にIssue #111をCompletedへ同期する。
4. merge後にbranch cleanupを確認する。

## Next Recommended Issue

queue transport observabilityをP1として分離する。

対象候補:
- enqueue success / failure
- Worker delivery accepted / rejected
- conditional claim success / no-op
- retry / stale recovery
- contract rejection
- structured internal logs
- metric naming / alert候補 / runbook

本Issueへobservability実装、retry backoff、external queue、DLQ opsを混在させない。
