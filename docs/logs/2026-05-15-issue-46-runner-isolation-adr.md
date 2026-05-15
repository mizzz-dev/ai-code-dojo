# Issue #46 Runner隔離実行基盤 ADR化ログ

- 日付: 2026-05-15
- Issue: #46
- 目的: Runner隔離実行基盤の採用方式をADRとして正式化し、後続実装の前提条件を固定する。

## 着手時前提
- APIで提出コードを直接実行しない。
- hidden testsは内部専用で、学習者向け返却は禁止。
- challenge更新は version追加方式を維持。
- 実装変更（runner/Worker/auth/DB/migration/UI/infra本番適用）は行わない。

## 実施内容
- Issue #44 設計結果および関連docsを参照し、ADRを新規作成。
- 採用案（短命コンテナジョブ）、却下案、トレードオフ、影響範囲、rollback方針を明文化。
- `current-status` / `active-issues` を #44 completed / #46 open 前提に同期。

## 変更範囲確認
- docsのみ更新。
- runner / Worker / auth / DB schema / migration の実装変更なし。
- hidden tests 実データの記載なし。
