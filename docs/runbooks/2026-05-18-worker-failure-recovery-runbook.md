# 2026-05-18 Worker failure recovery runbook（Issue #75）

## 目的
Worker障害発生時に、採点停止・再試行・失敗確定・手動復旧を一貫運用し、learner-safe 境界と監査可能性を維持する。

## 対象外
- runner/Worker/queue/DB schema の大規模変更
- auth/adminロジック変更
- hidden tests 仕様変更

## 障害判定フロー
1. 障害イベントを受領（監視/ログ/問い合わせ）
2. failure分類を判定
   - Worker到達不能
   - Worker再起動後の未処理 `queued`
   - 実行中断
   - timeout
   - runtime failure
   - infrastructure failure
3. learner-safe返却に内部情報混入がないか確認
4. 自動再試行・起動時回収の適用可否を判定
5. 最大試行回数超過時は失敗確定・手動復旧へ移行

## Worker起動時のqueued自動回収（Issue #99）
- Worker起動時にDB上の `queued` submissionを取得する。
- 回収対象は既存のWorker採点経路へ渡し、APIプロセスでは実行しない。
- `queued -> running` は、submission id / grading attempt / attempt idempotency key / completion guard条件を満たす場合のみclaimする。
- claimに失敗した場合は、他のWorkerまたは通常enqueue経路が取得済みとみなし、採点を実行しない。
- 終端済みsubmissionは回収対象に含めず、非終端状態へ戻さない。
- stale `running` の自動復旧は対象外。該当時は手動復旧または後続のlease / heartbeat設計に従う。

## 起動時回収の確認手順
1. Worker停止中にDB上で対象submissionが `queued` であることを確認する。
2. Workerを起動する。
3. Workerログで回収件数のみを確認する。提出コード本文、hidden tests、secretはログへ出さない。
4. 対象submissionが `running` を経て終端状態へ遷移することを確認する。
5. 同一submissionへ重複ジョブを投入しても、条件付きclaimにより一方のみが処理することを確認する。
6. learner-safe APIでinternal logs・hidden test結果・attempt idempotency keyが返らないことを確認する。

## 再試行判断マトリクス
- Worker到達不能: 再試行可（最大2回）
- Worker再起動後の `queued`: 起動時自動回収
- 実行中断: 再試行可（最大2回）
- infrastructure failure: 再試行可（最大2回、基盤復旧確認後）
- timeout: 原則失敗確定（必要時のみ運用承認で単発再実行）
- runtime failure: 原則失敗確定
- stale `running`: 自動復旧対象外。運用判断と後続設計が必要

## 手動復旧手順
1. 対象submissionの一意識別（submission id / correlation id）
2. 現在状態、completion guard、attempt番号を確認
3. `queued` の場合はWorker再起動による自動回収を優先
4. `running` のまま停止している場合は自動で `queued` へ戻さず、実行中プロセスの有無を確認
5. 失敗分類と過去attemptを確認
6. 再実行可の場合のみ運用者承認で再投入
7. learner向け表示を一般化文言で更新（内部情報は非表示）
8. 復旧結果を監査ログに記録

## 監査ログ最小要件
- submission id
- attempt番号
- failure分類
- retry / recovery判断理由
- 復旧担当者
- 時刻（UTC）

## セキュリティ境界チェック
- hidden tests 実データをログ/通知に含めない
- 提出コード本文を起動時回収ログへ含めない
- secrets を記録しない
- internal stack trace は admin/internal のみ
- learner向けには抽象化エラーのみ表示

## エスカレーション基準
- 同分類障害が短時間に多発
- infrastructure failure が継続
- 起動時回収後も `queued` が減少しない
- stale `running` が残存する
- 重複完了/整合性異常の兆候

## 連携先
- Issue #99: `https://github.com/mizzz-dev/ai-code-dojo/issues/99`
- 設計根拠: `docs/reports/2026-05-18-worker-failure-retry-policy.md`
- docs同期手順: `docs/runbooks/2026-05-18-post-merge-docs-sync-checklist.md`
