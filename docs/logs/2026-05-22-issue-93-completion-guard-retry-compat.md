# 2026-05-22 Issue #93 completion guard と retry attempt 互換修正ログ

## 概要
- completion guard の「終端保存一意化」は維持したまま、retry attempt 開始時に再採点可能となるよう互換修正を実施。
- terminal update が `completion_guard_at IS NULL` 条件で no-op になった場合、古いメモリ上の `current` ではなく DB 最新行を返すよう修正。

## 実装内容
- `updateSubmission` の terminal update no-op 時返却値を `getSubmission(id)` に変更し、最新DB状態を返却するよう統一。
- `startRetryAttempt` で `completionGuardAt: null` を明示設定し、retry attempt 開始時に completion guard を解除。
- これにより Worker の `submission.completionGuardAt` 早期 return が正しい retry attempt を阻害しない状態を確保。

## テスト
- unit test で以下を検証:
  - guard no-op 時返却値が DB 最新行と一致すること。
  - retry attempt 開始時に `completionGuardAt` が解除されること。
  - retry attempt が `queued -> running -> terminal` と処理可能なこと。
  - 終端保存一意化（重複終端上書き不可）が維持されること。

## 非対象
- retry state machine 本統合。
- queue本格運用（visibility timeout / DLQ / backoff）。
- runner仕様・採点ロジック・hidden tests仕様変更。
