# 2026-05-20 Retry state machine 状態語彙・状態遷移確定（Issue #83）

## 目的
idempotency key / completion guard / DB拡張 / queue本格運用 / Worker再試行制御へ進む前提として、submission の状態語彙と状態遷移を docs-only で確定する。

## スコープ
- 対象: 状態語彙、遷移元/遷移先、終了状態、learner-safe と internal/admin 境界、将来の実装影響整理。
- 非対象: runner/Worker実装変更、queue実装変更、DB schema/migration/seed変更、API/UI/auth/infra変更。

## 不変条件（再確認）
- API本体で提出コードを直接実行しない。
- hidden tests は内部専用で、学習者向けには露出しない。
- challenge は version 追加方式で更新する。
- 本資料は docs-only 決定であり、実装差分は含めない。

## 採用する状態語彙（確定）
### Internal/Admin 向け（正規語彙）
1. `queued`
2. `running`
3. `retry_pending`
4. `infra_failed`
5. `passed`
6. `failed`

### Learner-safe 向け（返却語彙）
- `queued`
- `running`
- `retrying`（internal の `retry_pending` を抽象化）
- `passed`
- `failed`

`infra_failed` は learner へ直接返さず、最終的には learner-safe な `failed` と一般化メッセージへ変換する。

## 状態定義（確定）
### `queued`
- 意味: 採点待ち。未実行。
- 遷移元: 初回受付、`retry_pending` からの再投入。
- 遷移先: `running`。

### `running`
- 意味: Worker が採点を実行中。
- 遷移元: `queued`。
- 遷移先: `passed` / `failed` / `retry_pending`。

### `retry_pending`
- 意味: infrastructure failure 系として再試行待ち（自動再試行対象）。
- 遷移元: `running`。
- 遷移先: `queued`（再投入）/ `infra_failed`（試行上限到達）。

### `infra_failed`
- 意味: 基盤要因で失敗確定。手動復旧候補。
- 遷移元: `retry_pending`。
- 遷移先: なし（終了状態）。

### `passed`
- 意味: 採点成功で完了。
- 遷移元: `running`。
- 遷移先: なし（終了状態）。

### `failed`
- 意味: 採点失敗で完了（提出コード要因/timeout 含む）。
- 遷移元: `running`。
- 遷移先: なし（終了状態）。

## 状態遷移（確定）
1. `queued -> running`
2. `running -> passed`
3. `running -> failed`
4. `running -> retry_pending`（Worker到達不能 / 実行中断 / infrastructure failure）
5. `retry_pending -> queued`（再試行可能かつ試行上限内）
6. `retry_pending -> infra_failed`（試行上限超過または復旧不能）

## 終了状態（terminal states）
- `passed`
- `failed`
- `infra_failed`

## failure分類と再試行可否（Issue #75整合）
- 自動再試行対象: Worker到達不能 / 実行中断 / infrastructure failure。
- 自動再試行対象外: timeout / runtime failure。
- timeout / runtime failure は `running -> failed` へ遷移し、`retry_pending` には入れない。

## completion guard の扱い（確定）
- completion guard は**状態として持たない**。
- completion guard は「完了保存時の一意完了制約（同一submissionの終端化を一度だけ許可）」として扱う。
- したがって状態語彙は6語で固定し、guard判定は保存時制御（将来実装）へ分離する。

## learner-safe / internal-admin 境界
- learner-safe 返却語彙は `queued/running/retrying/passed/failed` に限定。
- internal/admin では `retry_pending/infra_failed` を保持し、障害調査・手動復旧判断に使用。
- hidden tests の詳細、internal stack trace、secrets は learner 経路へ返却しない。

## 監査ログ（将来実装の必須観点）
- submission id
- attempt番号
- failure category
- retry decision reason
- correlation id
- completion guard 判定結果（保存成功/重複抑止）

※ hidden tests 実データ・secrets は記録禁止。

## DB/contract への将来影響（本Issueでは未実装）
### DB拡張候補（次Issueへ分離）
- `retry_count`
- `last_error_category`
- `last_error_at`
- `idempotency_key`
- completion guard 実現に必要な一意制約/完了記録カラム

### API/Worker contract 影響候補（次Issueへ分離）
- Worker 入出力に attempt 番号・相関ID・idempotency key を拡張する設計。
- learner-safe レスポンスで `retrying` 抽象語彙を扱う整合設計。

## 採用理由
- 実装前に語彙を固定することで、後続Issueを「idempotency」「completion guard」「DB migration」「queue運用」に責務分離できる。
- learner-safe 境界を保ったまま、internal の障害分類と手動復旧導線を維持できる。
- timeout/runtime failure を再試行対象外に固定し、無駄な再実行・輻輳を抑制できる。

## 却下した代替案
1. completion guard を独立状態にする案
   - 却下理由: 状態爆発により語彙が複雑化し、実装責務（保存制約）と運用責務（遷移）が混在するため。
2. `infra_failed` を廃止し `failed` に統合する案
   - 却下理由: 手動復旧判断と監査の粒度が失われ、問い合わせ対応で原因追跡が困難になるため。
3. timeout/runtime failure も `retry_pending` に入れる案
   - 却下理由: Issue #75方針と不整合であり、再試行負荷増大を招くため。

## 次Issue候補
1. idempotency key 導入設計（API/Worker/DB責務分離）
2. completion guard 実装設計（終端状態一意化）
3. DB schema/migration 設計（retry観測性カラム）
4. queue本格運用設計（visibility timeout / DLQ / backoff）
