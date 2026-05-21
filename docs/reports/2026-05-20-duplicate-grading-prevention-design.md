# 2026-05-20 重複採点防止設計（Issue #85）

## 目的
Issue #83 / PR #84 で確定した Retry state machine 語彙（internal/admin: `queued/running/retry_pending/infra_failed/passed/failed`、learner-safe: `queued/running/retrying/passed/failed`）を前提に、重複ジョブ投入・重複実行・重複完了を防ぐための設計方針を docs-only で確定する。

## スコープ
- 対象: idempotency key 相当の目的・適用範囲・生成タイミング、completion guard との責務分離、API/Worker/DB の責務境界、監査ログ最小要件。
- 非対象: runner/Worker本体実装、queue実装、DB schema/migration/seed、API/UI/auth/infra 実装変更。

## 不変条件（再確認）
- API本体で提出コードを直接実行しない。
- hidden tests は内部専用で学習者へ露出しない。
- learner-safe と internal/admin 境界を維持する（`infra_failed` は learner へ返さない）。
- challenge は version 追加方式で管理する。

## 重複の定義（今回確定）
### 1. 重複ジョブ投入（duplicate enqueue）
同一 submission の同一 attempt に対して、API または再投入制御が意図せず複数のジョブ登録を行うこと。

### 2. 重複実行（duplicate execution）
同一 submission の同一 attempt を、複数 Worker が並行または時間差で実行してしまうこと。

### 3. 重複完了（duplicate completion）
同一 submission の終端状態（`passed/failed/infra_failed`）保存が複数回成功し、最終結果整合性が壊れること。

## 設計方針（採用）

### A. idempotency key 相当の責務
- 目的: **重複ジョブ投入**と**重複実行**を抑止する前段ガード。
- 対象スコープ: **submission + attempt 単位**（submission 単独ではなく、再試行 attempt を識別する）。
- 生成タイミング:
  1. 初回受付（`queued` 作成時）
  2. `retry_pending -> queued` 再投入時（attempt increment と同時）
- 非包含情報:
  - hidden tests 結果/詳細
  - 提出コード本文
  - secret / 認証情報
  - learner 向けに露出不要な内部障害詳細

### B. completion guard の責務
- 目的: **重複完了**を防ぐ最終ガード。
- 性質: 状態語彙ではなく、終端保存時の一意完了制約（Issue #83 方針を踏襲）。
- 判定対象: 同一 submission の終端化を一度だけ許可する。
- idempotency key との差分:
  - idempotency key: ジョブ投入/実行の重複抑止（前段）
  - completion guard: 終端保存の重複抑止（後段）

### C. submission 単位 vs attempt 単位（方針確定）
- 完了判定（completion guard）は **submission 単位**。
- 実行識別（idempotency key 相当）は **attempt 単位**。
- 理由:
  - retry は同一 submission 内で複数 attempt が正当化されるため。
  - ただし最終結果は submission で一意に確定させる必要があるため。

## API / Worker / DB 責務境界（実装前整理）

### API責務（将来実装時）
- submission 受付時に attempt=1 の実行識別子を割当てる。
- `retry_pending -> queued` 再投入時に attempt を進め、新しい実行識別子を割当てる。
- learner-safe 返却語彙（`queued/running/retrying/passed/failed`）を維持する。
- internal/admin の監査用途で correlation id と判定結果を連携可能にする。

### Worker責務（将来実装時）
- 受け取った submission id / attempt / correlation id / 実行識別子を用いて処理トレース可能にする。
- 実行結果保存時には completion guard と競合しうることを前提に、二重完了時は idempotent に終了する。
- hidden tests 詳細を learner-safe 経路へ出さない。

### DB責務（将来拡張時）
- 実行識別子（idempotency key 相当）を保持できる構造。
- attempt 追跡（番号、一意性、最新 attempt 判定）。
- completion guard を実現する一意制約/compare-and-set 相当の保存制御。

## 将来必要になり得る DB 変更候補（別Issue分離）
- カラム候補:
  - `grading_attempt`
  - `idempotency_key`
  - `completion_recorded_at`（または終端保存フラグ相当）
  - `last_error_category`, `last_error_at`
- index / 制約候補:
  - `(submission_id, grading_attempt)` の一意制約
  - completion guard 用の一意完了制約
- 保存タイミング候補:
  - enqueue 時（attempt 採番と識別子保存）
  - terminal 保存時（guard 判定結果記録）

※ 本Issueでは schema/migration を実施しない。DB変更は別Issue/別PR。

## API / Worker contract への将来影響（docs-only）
- Worker入力に `submission_id`, `grading_attempt`, `correlation_id`, `idempotency_key` を明示化する候補。
- `retry_pending -> queued` 再投入時に attempt increment が必須であることを contract 上で表現する候補。
- learner-safe API 応答は語彙追加なし（既存の `retrying` 抽象化を維持）。

## 監査ログ最小要件（admin/internal）
- submission id
- grading attempt
- idempotency key（または hash/参照ID）
- correlation id
- failure category
- retry decision reason
- completion guard 判定結果（保存成功/重複抑止）
- timestamp（UTC）

※ hidden tests 実データ、secret、生の提出コード本文は記録禁止。

## 商用/教育運用での意義
- 重複採点抑止により将来の重複課金相当リスクを低減。
- 問い合わせ時に「どの attempt が正規結果か」を監査証跡で説明可能。
- 手動復旧時の再投入判断（`retry_pending` 経由）をトレースしやすくする。

## 却下した代替案
1. submission 単位の単一 idempotency key のみで運用する案
   - 却下理由: 再試行 attempt の正当な複数実行まで抑止し、復旧不能になり得るため。
2. completion guard なしで idempotency key のみ導入する案
   - 却下理由: 並行実行時の終端競合で重複完了を防ぎきれないため。
3. learner 向けに infra_failed や内部識別子を返す案
   - 却下理由: learner-safe 境界違反であり、hidden tests/内部実装推測リスクを増やすため。

## リスク
- DB制約未導入期間は、運用だけでは重複完了競合を完全排除できない。
- queue 実装詳細（visibility timeout / DLQ / ack semantics）未確定のため、重複実行抑止の最終形は次Issue依存。

## 次アクション（分離Issue推奨）
1. idempotency key 導入実装Issue（API/Worker/DB contract 同期）
2. completion guard 実装Issue（終端保存の一意化）
3. DB schema/migration Issue（attempt/識別子/制約追加）
4. queue運用 Issue（visibility timeout / DLQ / backoff）
