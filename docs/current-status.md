# current-status（正本）

最終更新: 2026-07-22（Issue #101 stale running recovery設計に着手）

## この文書の目的
「今どこまで実装済みか」を短時間で把握するための現況スナップショット。

## 今の状態（要約）
- ai-code-dojo は、AI生成コードのバグ修正・機能追加を実務フローで学ぶ練習プラットフォームとしてMVP運用を継続中。
- docs正本（`current-status` / `active-issues`）は ai-code-dojo 文脈を Source of Truth とし、他プロダクト文脈の混入を禁止する。
- Issue #85 / PR #86 で確定した設計を前提に、attempt単位idempotency key、SQLite migration順序、completion guard、retry state machineを段階導入した。
- Issue #96 / PR #97 / PR #98 で、retry再投入先と終端済みsubmission保護を補強した。
- Issue #99 / PR #100 で、Worker起動時の `queued` submission回収と `queued -> running` 条件付きclaimを実装し、integration testをCI品質ゲートへ追加した。
- Issue #101 では、Worker停止後に残る stale `running` を安全に回収するlease / heartbeat / attempt fencing方針をdocs-onlyで確定する。
- 後続実装Issue #102を作成し、stale scannerより先にlease / heartbeat / fenced completionを実装する順序を固定した。
- 不変条件（API本体で提出コードを直接実行しない、hidden testsは内部専用、challengeはversion追加方式）を維持する。

## 稼働中の運用基盤
- Canonical Source: `README.md` / `docs/project-overview.md` / `docs/current-status.md` / `docs/active-issues.md` / `docs/architecture/system-overview.md`
- 採点系は API→Worker 非同期連携を維持し、API直接実行は禁止。
- Workerは起動時にDB上の `queued` submissionを回収する。
- `queued -> running` はattempt / idempotency key / completion guard条件付きclaimで一件だけ成功させる。
- learner-safe / internal 境界を維持し、hidden tests詳細は学習者向け返却禁止。
- PR本文、レビュー文面、運用docsは日本語で統一する。
- CIは lint / typecheck / unit / integration / schema validation / build / docs validationを品質ゲートとする。

## 進行中事項
- Issue #101: stale `running` の定義、lease期限、heartbeat、recovery責務を確定する。
- Issue #101: 既存のattempt idempotency keyをfencing tokenとして利用し、旧Workerの遅延heartbeat・完了保存を拒否する方針を確定する。
- Issue #101: stale回収時は新attemptを開始し、completion guardとattempt fencingを併用する。
- Issue #101はdocs-onlyとし、DB schema / migration / Worker / APIの実変更はIssue #102以降へ分離する。

## 直近完了事項
- Issue #99 / PR #100 を完了し、Worker起動時に `queued` submissionを回収して既存採点経路へ戻す導線を実装した。
- PR #100 で、submission id / attempt / idempotency key / completion guardを条件に `queued -> running` をclaimし、通常enqueueとの競合でも二重採点を防止した。
- PR #100 でWorker起動時回収integration testを追加し、GitHub Actionsのbuild前必須jobとして `pnpm test:integration` を追加した。
- Issue #96（retry再投入導線 follow-up）として、Worker retry再投入先と終端後上書き防止を補強した。
- PR #95 でWorkerのinfrastructure failure経路へretry state machineを統合した。
- Issue #93でcompletion guardとretry attemptの互換性を回復した。
- Issue #91でsubmission単位completion guardを実装した。
- Issue #89でSQLite既存DB migration順序を修正した。
- Issue #87でattempt単位idempotency keyを実装した。
- Issue #83でRetry state machineの状態語彙・状態遷移を確定した。

## 優先順位（直近）
1. Issue #101: stale `running` のlease / heartbeat / recovery設計をdocs-onlyで確定する。
2. Issue #102: lease付きclaim / heartbeat / fenced non-terminal・terminal updateを実装する。
3. 後続P1: stale scanner / recovery transaction / attempt上限判定を実装する。
4. 後続候補: queue運用改善（visibility timeout / DLQ / backoff）を現行構成と将来queue基盤に分けて設計する。
5. 後続候補: completion guard / retry判断理由の監査ログ粒度を拡張する。

## branch cleanup 状態
- PR #100 は2026-07-22にmerge済み。
- PR #100のhead branch `fix/recover-queued-submissions-on-worker-startup` の削除状態はGitHub UIで最終確認する。
- Issue #101の作業branchは `docs/stale-running-recovery-design`。
- Issue #101のPR merge後にhead branchを削除する。

## 参照先
- 進行中Issue: `docs/active-issues.md`
- Issue #101: `https://github.com/mizzz-dev/ai-code-dojo/issues/101`
- 後続Issue #102: `https://github.com/mizzz-dev/ai-code-dojo/issues/102`
- Issue #101設計レポート: `docs/reports/2026-07-22-stale-running-lease-recovery-design.md`
- Issue #101 ADR: `docs/adr/2026-07-22-stale-running-lease-recovery.md`
- Issue #99 / PR #100 作業ログ: `docs/logs/2026-07-22-issue-99-worker-startup-queued-recovery.md`
- 重複採点防止設計: `docs/reports/2026-05-20-duplicate-grading-prevention-design.md`
- Retry state machine設計: `docs/reports/2026-05-20-retry-state-machine-state-vocabulary-decision.md`
- Worker障害復旧runbook: `docs/runbooks/2026-05-18-worker-failure-recovery-runbook.md`
