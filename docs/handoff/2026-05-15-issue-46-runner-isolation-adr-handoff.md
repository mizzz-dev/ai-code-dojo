# Handoff: Issue #46 Runner隔離実行基盤 ADR化

- 日付: 2026-05-15
- 対象Issue: #46
- 状態: ADR作成完了（実装未着手）

## 実施済み
- `ADR-001` を追加し、短命コンテナジョブ方式を正式採用として明文化。
- resource制限、network deny原則、filesystem制限、artifact whitelist、timeout/kill policyを固定。
- hidden tests / learner-safe / internal 境界、Worker/queue/DB/auth 影響を整理。
- `current-status` / `active-issues` を #44 completed / #46 open の運用状態に同期。

## 未実施（意図的に分離）
- runner / Worker 実装
- queue実装刷新、DB schema/migration/seed変更
- auth/adminロジック変更
- UI変更
- infra本番適用

## follow-up候補
1. 隔離実行PoC（container jobs + policy enforcement）
2. Worker冪等化と再試行制御
3. durable queue導入検討
4. internal artifact 保持/監査/マスキング設計
5. rollback運用runbook整備

## 注意事項
- hidden tests 実データは継続して記録しない。
- internal artifact は admin限定閲覧を維持する。
