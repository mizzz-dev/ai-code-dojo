# Handoff: Issue #50 isolation PoC hardening

## 変更概要
- Worker isolation PoC の payload 伝搬を stdin 経由へ変更し、E2BIG リスクを低減。
- isolation child の structured failure payload を親側で保持するよう修正。
- production + PoC flag の誤有効化を起動時 guard で拒否。
- unit test を追加して回帰を防止。

## 運用注意
- PoC 経路は引き続き non-production 前提。
- hidden tests 詳細の learner 向け露出禁止は継続。

## 次の推奨タスク
1. コンテナジョブ経路へ移行して runtime 制約（network/filesystem/resource）を実強制する。
2. internal artifacts/logs のマスキング・保管期間・監査方針を runbook 化する。
