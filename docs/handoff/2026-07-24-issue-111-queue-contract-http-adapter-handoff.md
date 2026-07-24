# Issue #111 queue contract / HTTP adapter分離 handoff

## Summary

queue message contract、queue producer port、HTTP adapterを共有packageへ分離し、API producerとWorker consumerが同じversion付きcontractを利用する構成へ移行した。

## Current State

- Issue: #111
- PR: #112
- Branch: `refactor/queue-contract-http-adapter`
- PR状態: Draft
- CI状態: 最終head確認中

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
- current-status / active-issues更新
- 作業ログ / AIプロンプトログ / handoff追加

## Invariants

- APIで提出コードを直接実行しない。
- hidden tests詳細をlearnerへ返さない。
- queue messageへcode / hidden tests / secretを含めない。
- challengeはversion追加方式を維持する。
- transport retryでgrading attempt / attempt keyを変更しない。
- DB processing lease / attempt fencing / completion guardを維持する。
- DB schema / migration / seedを変更しない。

## Review Focus

- strict unknown field拒否がcontract versioning方針として妥当か。
- producer / consumerが同一parserを参照しているか。
- HTTP adapterが既存の2xx成功・非2xx/例外失敗の意味を維持しているか。
- `enqueueSubmissionAttempt`互換exportが既存retry / stale recoveryを壊していないか。
- Worker `/jobs`の400応答へ機微情報が含まれていないか。
- contract testがAPI / Worker境界を十分に固定しているか。

## Remaining Tasks

1. system-overviewへ実装済みcontract / adapter境界を反映する。
2. 最終headの全品質ゲートを確認する。
3. 作業ログ・handoffへCI結果を確定する。
4. PR #112本文を完成させ、Ready for reviewへ変更する。
5. GitHub Issue #111へ実装・テスト結果をコメントする。
6. Linear / Notionの同期可否を確認する。

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
