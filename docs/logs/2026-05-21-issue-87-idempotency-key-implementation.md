# 2026-05-21 Issue #87 作業ログ（attempt単位 idempotency key 実装）

## Summary
- Issue #85 / PR #86 で確定した責務分離に従い、`submission + attempt` 単位の idempotency key 相当を API/DB/Worker に最小差分で実装した。
- completion guard（submission終端一意化）は本Issue対象外として未実装を維持した。

## 実施内容
1. `submissions` に `grading_attempt` と `attempt_idempotency_key` を追加（既存DB向けの後方互換ALTER含む）。
2. 初回投入（attempt=1）時に idempotency key を保存し、Workerジョブへ `submissionId + gradingAttempt + attemptIdempotencyKey` を渡すよう変更。
3. Worker 側で attempt / key の一致確認を追加し、重複ジョブ投入・古いattempt実行を無害化。
4. retry再投入用に attempt increment と新key再発行を行う repository API（`startRetryAttempt`）を追加。

## 非対象（未実施）
- completion guard 実装（終端保存一意化）
- queue本格運用
- runner隔離強化
- auth/admin仕様変更
- UI変更

## 不変条件チェック
- API本体で提出コードを直接実行していない。
- hidden tests を learner-safe 経路へ露出していない。
- challenge version 直接上書き運用へ影響する変更をしていない。

## 確認コマンド
- `pnpm lint`
- `pnpm typecheck`
- `pnpm test:unit`
- `pnpm test:integration`
- `pnpm test:smoke`
- `pnpm --filter @ai-code-dojo/api build`
- `pnpm --filter @ai-code-dojo/worker build`
