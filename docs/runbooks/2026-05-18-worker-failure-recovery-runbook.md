# 2026-05-18 Worker failure recovery runbook（Issue #75）

## 目的
Worker障害発生時に、採点停止・再試行・失敗確定・手動復旧を一貫運用し、learner-safe 境界と監査可能性を維持する。

## 対象外
- runner/Worker/queue/DB schema の実装変更
- auth/adminロジック変更
- hidden tests 仕様変更

## 障害判定フロー
1. 障害イベントを受領（監視/ログ/問い合わせ）
2. failure分類を判定
   - Worker到達不能
   - 実行中断
   - timeout
   - runtime failure
   - infrastructure failure
3. learner-safe返却に内部情報混入がないか確認
4. 自動再試行可否を判定
5. 最大試行回数超過時は失敗確定・手動復旧へ移行

## 再試行判断マトリクス
- Worker到達不能: 再試行可（最大2回）
- 実行中断: 再試行可（最大2回）
- infrastructure failure: 再試行可（最大2回、基盤復旧確認後）
- timeout: 原則失敗確定（必要時のみ運用承認で単発再実行）
- runtime failure: 原則失敗確定

## 手動復旧手順（実装前運用）
1. 対象submissionの一意識別（submission id / correlation id）
2. 重複完了状態の有無を確認
3. 失敗分類と過去attemptを確認
4. 再実行可の場合のみ運用者承認で再投入
5. learner向け表示を一般化文言で更新（内部情報は非表示）
6. 復旧結果を監査ログに記録

## 監査ログ最小要件
- submission id
- attempt番号
- failure分類
- retry判断理由
- 復旧担当者
- 時刻（UTC）

## セキュリティ境界チェック
- hidden tests 実データをログ/通知に含めない
- secrets を記録しない
- internal stack trace は admin/internal のみ
- learner向けには抽象化エラーのみ表示

## エスカレーション基準
- 同分類障害が短時間に多発
- infrastructure failure が継続
- 重複完了/整合性異常の兆候

## 連携先
- 設計根拠: `docs/reports/2026-05-18-worker-failure-retry-policy.md`
- docs同期手順: `docs/runbooks/2026-05-18-post-merge-docs-sync-checklist.md`
