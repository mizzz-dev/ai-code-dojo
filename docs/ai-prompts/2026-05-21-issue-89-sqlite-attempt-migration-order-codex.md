# 2026-05-21 Issue #89 Codexプロンプト記録

## 依頼要約
- Issue #89 対応として、SQLite既存DBで attempt列追加前に index 作成が走る順序不整合を修正する。
- 最小差分で `apps/api/src/db/database.mjs` を中心に対応し、必要最小限の再現検証を追加する。

## 制約
- completion guard / retry state machine本統合 / UI変更は行わない。
- hidden tests の詳細は記録しない。
- API本体で提出コードを直接実行しない方針を維持する。

## 実装方針
- migrationを「テーブル作成 → 列追加保証 → index作成」の順へ整理。
- 旧スキーマDBアップグレードを unit test で再現し、起動不能リスクを回避できることを検証。
