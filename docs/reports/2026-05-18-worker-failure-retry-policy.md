# 2026-05-18 Worker failure retry policy（Issue #75）

## 目的
Worker障害時に、学習者体験と採点整合性を両立しつつ、hidden tests 境界・API不変条件（API本体で提出コードを直接実行しない）を維持するための実装前設計方針を定義する。

## スコープ
- 対象: 障害分類、採点停止条件、再試行可否、最大試行回数、失敗確定条件、手動復旧、監査ログ方針。
- 非対象: runner/Worker/queue実装変更、DB schema/migration/seed変更、auth/admin実装変更、API仕様変更。

## 障害分類（運用分類）
1. Worker到達不能（enqueue失敗、接続不能、サービス不達）
2. Worker実行中断（プロセス異常終了、kill、node/pod再起動）
3. Timeout（上限時間超過）
4. Runtime failure（提出コード/実行環境依存の失敗）
5. Infrastructure failure（ストレージ・ネットワーク・基盤異常）

## API側の基本挙動（不変条件維持）
- APIは submission を受け付け、非同期採点要求を発行する。
- Worker障害時も API本体は提出コードを直接実行しない。
- learner-safe 返却は抽象化された状態のみ返し、内部実行詳細は返却しない。

## 採点停止・再試行ポリシー（設計案）
- 即時停止（再試行しない）
  - hidden tests 境界侵害の疑い
  - 同一submissionで重複完了書き込み検知
- 自動再試行対象
  - Worker到達不能 / 実行中断 / 一時的Infrastructure failure
- 原則再試行しない対象
  - Runtime failure（ユーザーコード起因が主）
  - Timeout（ポリシー上は失敗確定、ただし運用判断で限定再実行余地）
- 最大試行回数（運用初期案）
  - 自動再試行: 最大2回（初回+再試行2回で計3試行まで）
  - 超過時: `failed` 確定 + 手動復旧キューへ。

## submission状態遷移（実装前の概念）
`queued -> running -> {passed | failed | infra_failed}` を基本とし、
`infra_failed` は手動再実行候補として区別管理する。

※ 現行DB schemaは変更しない。本状態区分は運用概念として整理し、実装時は別Issue/ADRで確定する。

## Idempotency 方針
- submission単位で一意な採点実行キー（idempotency key）を将来導入候補とする。
- 「完了状態への遷移」は compare-and-set 的に一度だけ成功させる。
- 再試行ジョブは「同一submissionの未完了時のみ」有効。
- 重複完了/重複保存検知時は learner-facing を汚染せず internalログへ記録。

## learner-safe 境界
### learner向けに出してよい情報
- 採点状態（queued/running/failed/passed 相当）
- 再試行中である旨（抽象化文言）
- 必要最小限の一般化エラーカテゴリ（timeout / execution failed 等）

### learner向けに出してはいけない情報
- hidden tests のケース内容・期待値・入力データ
- internal stack trace / worker node識別子 / infra詳細
- secrets / internal endpoint / 実行基盤構成の詳細

## admin/internal ログ粒度
- 必須: submission id, challenge id/version, attempt番号, failure分類, 発生時刻, 処理ノード識別子, 相関ID。
- 推奨: enqueue payload hash, worker response code, timeout閾値, retry decision reason。
- 禁止: hidden tests 実データの平文記録、secretsの生値記録。

## queue/DB 本格運用への前提
- queue側: visibility timeout / dead-letter queue / backoff戦略の明示。
- DB側: retry count, last error category, last error at, grading attempt history, idempotency key を保持可能なモデル検討。
- ただし本Issueでは変更しない。別Issueで段階導入する。

## 別Issue / ADR 候補
1. Retry state machine 導入（submission状態遷移の正式化）
2. Idempotency key + 重複完了防止制御
3. Infrastructure failure 専用の運用メトリクスとDLQ運用
4. learner-safe エラーカタログの標準化

## 結論
- 本Issueでは docs-only で運用設計を先行確定。
- 実装は不変条件（API直接実行禁止、hidden tests非露出）を守るため、状態遷移・idempotency・監査ログを最小単位で段階導入する。
