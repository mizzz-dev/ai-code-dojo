# current-status（正本）

最終更新: 2026-07-22（Issue #102 lease / heartbeat / attempt fencing実装中）

## この文書の目的
「今どこまで実装済みか」を短時間で把握するための現況スナップショット。

## 今の状態（要約）
- ai-code-dojo は、AI生成コードのバグ修正・機能追加を実務フローで学ぶ練習プラットフォームとしてMVP運用を継続中。
- docs正本（`current-status` / `active-issues`）は ai-code-dojo 文脈を Source of Truth とし、他プロダクト文脈の混入を禁止する。
- attempt単位idempotency key、SQLite migration順序、submission単位completion guard、retry state machineを段階導入済み。
- Issue #99 / PR #100 で、Worker起動時の `queued` submission回収と条件付きclaimを実装した。
- Issue #101 / PR #103 で、stale `running` recoveryのlease / heartbeat / attempt fencing設計をdocs-onlyで確定した。
- Issue #102 / PR #104 で、stale scannerより先にlease付きclaim、heartbeat、fenced non-terminal・terminal updateを実装している。
- 不変条件（API本体で提出コードを直接実行しない、hidden testsは内部専用、challengeはversion追加方式）を維持する。

## 稼働中の運用基盤
- Canonical Source: `README.md` / `docs/project-overview.md` / `docs/current-status.md` / `docs/active-issues.md` / `docs/architecture/system-overview.md`
- 採点系は API→Worker 非同期連携を維持し、API直接実行は禁止。
- Workerは起動時にDB上の `queued` submissionを回収する。
- `queued -> running` はattempt / idempotency key / completion guard条件付きclaimで一件だけ成功させる。
- learner-safe / internal境界を維持し、hidden tests詳細、attempt key、lease、heartbeat情報は学習者向け返却禁止。
- CIは lint / typecheck / unit / integration / schema validation / build / docs validationを品質ゲートとする。

## 進行中事項
- Issue #102: `submissions` にprocessing lease関連nullable列をadditive migrationで追加する。
- Issue #102: heartbeat有効時のclaimで `processing_claimed_at` / `processing_heartbeat_at` / `processing_lease_expires_at` を保存する。
- Issue #102: heartbeat・非終端更新・terminal保存をexpected attempt / attempt idempotency key / lease期限でfenceする。
- Issue #102: heartbeat無効時は従来挙動を維持し、feature flagで段階導入する。
- Issue #102ではstale scanner / recovery transactionを実装せず、後続Issueへ分離する。

## 直近完了事項
- Issue #101 / PR #103 を完了し、stale `running` / `legacy_running` の定義、lease所有権、heartbeat、attempt fencing、rollout / rollback方針を確定した。
- Issue #99 / PR #100 を完了し、Worker起動時に `queued` submissionを回収して既存採点経路へ戻す導線を実装した。
- Issue #96 / PR #97 / PR #98 でWorker retry再投入先と終端済みsubmission保護を補強した。
- PR #95 でWorkerのinfrastructure failure経路へretry state machineを統合した。
- Issue #93でcompletion guardとretry attemptの互換性を回復した。
- Issue #91でsubmission単位completion guardを実装した。
- Issue #89でSQLite既存DB migration順序を修正した。
- Issue #87でattempt単位idempotency keyを実装した。

## 優先順位（直近）
1. Issue #102 / PR #104: lease付きclaim / heartbeat / fenced non-terminal・terminal updateを実装・検証する。
2. 後続P1: stale候補一覧 / recovery transaction / periodic scanner / attempt上限判定を実装する。
3. 後続P1: queue運用改善（visibility timeout / DLQ / backoff）を現行構成と将来queue基盤に分けて設計する。
4. 後続P2: completion guard / heartbeat / retry判断理由の監査ログ粒度を拡張する。

## branch cleanup 状態
- PR #103 は2026-07-22にmerge済み。
- PR #103のhead branch `docs/stale-running-recovery-design` の削除状態はGitHub UIで確認する。
- Issue #102の作業branchは `feat/submission-processing-lease-heartbeat`。
- PR #104 merge後にhead branchを削除する。

## 参照先
- 進行中Issue: `docs/active-issues.md`
- Issue #102: `https://github.com/mizzz-dev/ai-code-dojo/issues/102`
- PR #104: `https://github.com/mizzz-dev/ai-code-dojo/pull/104`
- Issue #101設計レポート: `docs/reports/2026-07-22-stale-running-lease-recovery-design.md`
- Issue #101 ADR: `docs/adr/2026-07-22-stale-running-lease-recovery.md`
- Worker障害復旧runbook: `docs/runbooks/2026-05-18-worker-failure-recovery-runbook.md`
