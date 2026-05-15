# Issue #44 Runner隔離実行基盤 設計整理ログ

- 日付: 2026-05-15
- Issue: #44
- 目的: Runner隔離実行基盤の設計方針を整理し、採用案/却下案/次ステップを正本化する。

## 着手時前提
- APIで提出コードを直接実行しない。
- hidden testsは内部専用で、学習者へ詳細返却しない。
- challengeはversion追加方式を維持する。
- 実装修正は本Issueでは実施せず、必要時はfollow-upへ分離する。

## 実施内容
- 既存正本ドキュメントとIssue #37レビュー結果を参照し、隔離実行の設計観点を整理。
- `docs/reports/2026-05-15-runner-isolation-design.md` を作成。
- `docs/risks/2026-05-15-runner-isolation-risks.md` を作成。
- 採用案（短命コンテナジョブ方式）と却下案（現行継続 / microVM即時採用 / runner全面再設計）を比較。

## 主要判断
- 本Issueの成果物は「設計方針の確定」とし、実装はfollow-up Issue/ADRへ分離。
- hidden tests漏洩防止は learner-safe/internal 境界を維持したまま、artifact運用ルールで補強する。

## 変更範囲確認
- runner / Worker / auth / DB / migration の実装変更なし。
- hidden tests 実データの記載なし。
