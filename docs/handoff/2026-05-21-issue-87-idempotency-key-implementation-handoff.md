# 2026-05-21 Issue #87 handoff（attempt単位 idempotency key 実装）

## 完了したこと
- `submissions` に `grading_attempt` / `attempt_idempotency_key` を追加し、初回attempt=1で保存する実装を追加。
- API→Worker ジョブ投入時に attempt情報を連携。
- Worker 実行前に attempt/key の一致確認を追加し、古いattemptや重複ジョブを抑止。
- retry再投入で attempt increment と新key発行を行える `startRetryAttempt` を追加。

## 未実施（意図的）
- completion guard（終端保存一意化）
- retry state machine 全体統合（`retry_pending` 遷移の本実装）
- queue本格運用

## 次アクション
1. retry API/運用導線から `startRetryAttempt` を呼び出す統合実装。
2. completion guard 実装Issueで terminal 保存の一意化を追加。
3. completion guard 追加後に競合テスト（重複完了）を増強。
