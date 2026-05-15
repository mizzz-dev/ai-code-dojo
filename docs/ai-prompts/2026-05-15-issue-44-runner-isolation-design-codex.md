# AI Prompt Log: Issue #44 Runner隔離実行基盤 設計整理

- 日付: 2026-05-15
- 担当: Codex
- 対象Issue: #44

## 目的
Runner の隔離実行基盤について、MVPから本格運用へ移行する設計方針を整理し、採用案・却下案・トレードオフ・次ステップを明文化する。

## 制約
- APIで提出コードを直接実行しない。
- hidden tests 詳細は学習者へ返却しない。
- runner/Worker全面置換やDB schema変更などの実装変更は行わない。
- 変更はdocs中心の最小差分に限定する。

## 出力
- `docs/reports/2026-05-15-runner-isolation-design.md`
- `docs/risks/2026-05-15-runner-isolation-risks.md`
- `docs/logs/2026-05-15-issue-44-runner-isolation-design.md`
- `docs/handoff/2026-05-15-issue-44-runner-isolation-design-handoff.md`

## 補足
Issue #37（Runner安全性レビュー）で特定されたP0リスクのフォローアップとして、設計確定と実装分離を優先。
