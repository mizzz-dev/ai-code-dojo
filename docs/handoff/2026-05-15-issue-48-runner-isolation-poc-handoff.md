# Handoff: Issue #48 Runner隔離実行PoC

## 変更概要
- Workerに `RUNNER_ISOLATION_POC=1` で有効化されるPoC経路を追加。
- child processベースの最小隔離実行スクリプトを追加。
- PoC結果・リスク・作業ログ・AI prompt log を追加。

## 運用注意
- 本PoCは non-production 前提。productionでは有効化しない。
- 実ランタイム隔離（network deny/read-only rootfs）は follow-up で実装必須。
- hidden tests詳細の露出禁止を継続する。

## 引き継ぎタスク
1. productionガード（`NODE_ENV=production`で flag拒否）追加。
2. コンテナジョブ実装へ移行し、resource/network/filesystem制約を実強制。
3. internal artifact 保持・監査・マスキングの設計Issue化。
