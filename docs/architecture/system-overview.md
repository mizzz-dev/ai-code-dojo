# system-overview（正本）

最終更新: 2026-07-22（Issue #101 stale running recovery設計反映）

## この文書の目的
実装詳細に入る前に、システム境界・責務分担・データフローを把握するためのアーキテクチャ概観を提供する。

## システム境界
- 学習者: Web UIから問題取得・提出・結果確認
- API: challenge/submission/adminの公開境界と認可制御
- Worker: 採点ジョブのclaim、実行、heartbeat、結果保存、障害回復
- Runner: テスト実行と結果正規化

## 高レベル構成
1. WebがAPIからchallengeを取得する。
2. WebがAPIにsubmissionを作成する。
3. APIがWorkerに採点依頼する。
4. WorkerがDB上のsubmissionを条件付きclaimする。
5. WorkerがRunnerでvisible/hidden testsを実行する。
6. Workerが結果をfenced updateとcompletion guardで保存する。
7. Webがsubmission結果をポーリング表示する。

## 採点ジョブ回復

### 実装済み

- Worker起動時にDB上の `queued` submissionを回収する。
- `queued -> running` はsubmission id / grading attempt / attempt idempotency key / completion guard条件付きclaimで一件だけ成功させる。

### 設計確定・未実装（Issue #101）

- claim後はleaseとheartbeatで実行所有権の生存を表す。
- attempt idempotency keyをfencing tokenとしてheartbeat・完了保存・recoveryへ適用する。
- lease期限切れのstale `running` は新attemptとして回収する。
- 旧Workerの遅延heartbeat・完了保存はattempt/key不一致で拒否する。
- lease情報がない `legacy_running` は自動回収しない。
- stale scannerはAPIではなくWorker責務とする。

詳細:

- `docs/reports/2026-07-22-stale-running-lease-recovery-design.md`
- `docs/adr/2026-07-22-stale-running-lease-recovery.md`

## データ管理
- challenge本体: `challenges` + `challenge_versions`
- submission: `submissions`
- 永続化: SQLite（`.data/app.db`）
- 現行submission内部制御:
  - `grading_attempt`
  - `attempt_idempotency_key`
  - `completion_guard_at`
- 将来lease列候補:
  - `processing_claimed_at`
  - `processing_heartbeat_at`
  - `processing_lease_expires_at`

Issue #101ではschema変更を行わない。

## セキュリティ境界
- learner-safeとinternalレスポンスを分離する。
- hidden tests詳細はlearnerへ非公開とする。
- `/api/admin/*` はadminロール必須とする。
- attempt key、lease、heartbeat、worker識別情報はlearnerへ返さない。
- 回復ログへ提出コード本文・hidden tests実データ・secretを記録しない。

## 重要な不変条件
- API本体で提出コードを直接実行しない。
- challenge編集はversion追加方式とし、既存versionを上書きしない。
- publish状態で学習者公開を制御する。
- submissionの終端結果はcompletion guardで一意化する。
- stale回収後の旧attempt更新はfencingで拒否する。

## 依存関係と制約
- 現行Runnerは簡易実行であり、将来は隔離強化が前提。
- キューは簡易HTTP連携であり、将来置換を想定する。
- SQLite leaseは将来queueのvisibility timeout相当を補う暫定機構とする。
- 将来queue導入後もDBのattempt fencingとcompletion guardは維持する。
- ドキュメント正本は `docs/project-overview.md` のCanonical Source Rulesに従う。

## 詳細文書への導線
- 実装詳細: `docs/architecture.md`
- 要件定義: `docs/requirements.md`
- 現在状態: `docs/current-status.md`
- 進行中Issue: `docs/active-issues.md`
- Worker障害復旧: `docs/runbooks/2026-05-18-worker-failure-recovery-runbook.md`
