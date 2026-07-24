# Issue #113 queue transport observability handoff

## Summary

現行HTTP queueのenqueue / delivery / claim / heartbeat / application retry / queued startup recovery / stale recoveryを、allowlist fieldのJSON Lines eventとして観測可能にした。

## Current State

- Issue: #113
- PR: #114
- Branch: `feat/queue-transport-observability`
- PR状態: Draft
- CI状態: docs反映後の最終head確認中

## Implemented

- `packages/queue/src/queue-event-logger.mjs`
- queue event name定数
- context field allowlist
- JSON Lines出力
- logger sink failureの非伝播
- HTTP enqueue success / failure / contract rejection event
- Worker delivery accepted / rejected event
- conditional claim success / no-op event
- heartbeat failure event
- application retry event
- queued startup recovery event
- stale recovery candidate / scan event
- queue event logger unit test
- HTTP producer observability unit test
- Worker queue event integration test
- current-status / active-issues / system-overview更新
- queue observability専用runbook
- 作業ログ / AIプロンプトログ / handoff

## Event Security Boundary

出力可能:
- timestamp / level / service / event
- transport / source / outcome / generalized reason
- opaque submission ID
- grading attempt / previous attempt / next attempt
- optional correlation ID
- schema version / HTTP status code / rejected field
- scan trigger / aggregate counts
- generalized error type

出力禁止:
- code
- visible / hidden tests詳細
- challenge本文
- secret / token / password
- auth header
- attempt idempotency key
- raw error message
- environment variable値
- internal endpoint詳細

## Invariants

- APIで提出コードを直接実行しない。
- hidden tests詳細をlearnerへ返さない。
- challenge version追加方式を維持する。
- transport retryでgrading attempt / attempt keyを変更しない。
- processing lease / attempt fencing / completion guardを維持する。
- observability失敗を採点correctnessへ伝播しない。
- DB schema / migration / seedを変更しない。
- external queue / backoff / DLQ / metrics backendを混在させない。

## Review Focus

- event nameがstableで過不足ないか。
- allowlistに機微fieldが含まれていないか。
- unknown fieldが確実に除外されるか。
- raw error messageがeventへ出ていないか。
- HTTP producerの2xx / non-2xx / network error分類が妥当か。
- Worker delivery / claimのevent順序が運用上追跡可能か。
- retry / stale recoveryでattempt keyをログへ出していないか。
- logger sink failureが業務処理へ伝播しないか。
- learner-safeレスポンスに変更がないか。

## Remaining Tasks

1. 最終headのdocs validation / app-qualityを確認する。
2. 作業ログ / handoffへ最終CI結果を確定する。
3. PR #114本文を完成させる。
4. PR #114をReady for reviewへ変更する。
5. Issue #113へ実装・テスト結果をコメントする。
6. Linear / Notion同期可否を確認する。
7. merge後にbranch cleanupを確認する。

## Next Recommended Issue

application retry backoff seamをP1として分離する。

対象候補:
- retry delay policy interface
- exponential backoff
- full jitter
- max delay
- injectable clock / random
- feature flag / configuration validation
- retry storm防止
- structured eventへのdelay field追加可否
- unit / integration test

本Issueへexternal queue、outbox、DLQ ops、metrics backend、dashboard、alert本番設定を混在させない。
