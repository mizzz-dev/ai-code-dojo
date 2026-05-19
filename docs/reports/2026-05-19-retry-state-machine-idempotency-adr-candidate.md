# 2026-05-19 ADR候補: Retry state machine / idempotency key / completion guard（Issue #77）

## 目的
Worker障害時に、重複実行・重複完了・実行中断復旧を扱える設計候補を整理し、API直接実行禁止・hidden tests非露出・learner-safe境界を維持したまま将来実装へ接続する。

## 前提と不変条件
- API本体で提出コードを直接実行しない。
- hidden tests の詳細・実データは learner向けに返却しない。
- challenge は version 追加方式で更新する。
- 本資料は docs-only であり、実装・DB変更は行わない。

## 現行submission状態と不足状態概念
- 現行概念: `queued -> running -> passed/failed`（MVP中心）
- 不足概念（候補）:
  - `retry_pending`: 自動再試行待ち
  - `infra_failed`: 基盤要因で失敗確定（手動復旧候補）
  - `completion_recorded`: 完了書き込み済み（重複完了防止の論理状態）

## 状態遷移案（候補）
1. `queued -> running`
2. `running -> passed | failed`
3. `running -> retry_pending`（Worker到達不能/実行中断/infrastructure failure）
4. `retry_pending -> queued`（attempt+1 で再投入）
5. `retry_pending -> infra_failed`（最大試行回数超過）
6. いずれの完了遷移でも completion guard を通過した一度だけ結果確定

## retry count / grading attempt / idempotency key / completion guard の必要性
- retry count: 自動再試行上限管理に必須。
- grading attempt: 障害分類ごとの追跡と監査に必須。
- idempotency key: 同一submission再実行の重複書き込み抑止に有効。
- completion guard: 同一submissionで複数workerが完了保存する競合を抑止する最終防波堤。

## 障害種別ごとの再試行方針（候補）
- 自動再試行対象: Worker到達不能 / 実行中断 / infrastructure failure
- 自動再試行対象外: timeout / runtime failure

### timeout / runtime failure を自動再試行対象外にする理由
- timeout は同条件再実行でも再発可能性が高く、計算資源消費と待ち時間増加の副作用が大きい。
- runtime failure は提出コード起因が多く、再試行より学習者の修正再提出が妥当。
- 自動再試行を限定することで、queue輻輳と重複課金（将来）リスクを抑える。

## learner-safeレスポンスへの影響
- learner向けは抽象状態（queued/running/retrying/failed/passed）に限定。
- hidden tests・infra詳細・内部スタックトレースは非公開。
- `retrying` 文言は内部分類を漏らさない一般化メッセージとする。

## admin/internalログ・監査ログへの影響
- 追加検討項目: submission id, attempt番号, failure category, retry decision reason, correlation id, completion guard判定結果。
- hidden tests実データやsecretsは記録禁止。

## DB schema / migration 必要性（将来）
- 将来追加候補: `retry_count`, `last_error_category`, `last_error_at`, `idempotency_key`, `completed_at_guard`。
- 本Issueでは導入しない。DB変更は別Issue/別PRへ分離。

## API contract / Worker contract への影響
- API contract: learner-safe状態語彙に `retrying` 相当を追加検討（後方互換方針は別途定義）。
- Worker contract: attempt番号/相関ID/idempotency key の受け渡しを将来拡張候補とする。
- いずれも本Issueでは仕様確定しない。

## queue本格運用との関係
- visibility timeout: 実行中断時の再配信制御で必須。
- DLQ: 試行上限超過ジョブの隔離に有効。
- backoff: 一時障害時の再試行集中を緩和。
- queue設計確定は別Issueで段階導入する。

## 採用案（候補）
1. docs先行で状態遷移語彙を定義し、実装は別Issueで段階導入。
2. idempotency key + completion guard をセットで検討し、重複完了防止を最優先。
3. timeout/runtime failure は自動再試行対象外を原則維持。

## 却下案（候補）
- すべての失敗を自動再試行対象にする案（queue負荷と重複実行リスクが高い）。
- APIが同期フォールバック実行する案（不変条件違反）。
- hidden tests詳細を障害調査のため learnerへ返す案（境界違反）。

## トレードオフ
- 再試行を厳格化すると復旧速度は上がるが、実装複雑性と監査要件が増える。
- learner-safe優先は透明性を制限するが、hidden tests保護とセキュリティを維持できる。
- DB拡張を先送りすると短期影響は小さいが、可観測性改善は次Issue依存になる。
