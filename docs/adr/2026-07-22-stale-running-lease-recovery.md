# stale running submissionのlease・heartbeat・回収方針

- Status: Accepted
- Date: 2026-07-22
- Issue: #101
- Related: Issue #99 / PR #100

## 目的

Worker停止後に `running` のまま残るsubmissionを、二重採点・旧Workerの遅延完了・hidden tests境界侵害を起こさず安全に回収できる設計を確定する。

## 背景

PR #100では、Worker起動時の `queued` 回収と `queued -> running` の条件付きclaimを実装した。

一方、claim後にWorkerが停止した場合は、実行所有権の期限を判断する情報がなく、`running` を自動回収できない。単純に全runningをqueuedへ戻すと、正常実行中Workerとの競合や旧Worker結果の誤保存が発生する。

詳細設計は `docs/reports/2026-07-22-stale-running-lease-recovery-design.md` を参照する。

## 決定事項

### 1. stale判定には専用lease期限を利用する

`updated_at` はstale判定に使用しない。

将来schema候補:

- `processing_claimed_at`
- `processing_heartbeat_at`
- `processing_lease_expires_at`

`status = running`、completion guard未設定、lease期限切れ、条件付き更新成功を満たす場合のみstaleとして回収する。

### 2. attempt idempotency keyをfencing tokenとして利用する

新しいlease tokenはMVPでは追加しない。

claim、heartbeat、非終端更新、terminal保存、recoveryは、submission idに加えてexpected grading attemptとexpected attempt idempotency keyを条件とする。

### 3. stale回収は新attemptを開始する

同一attemptを再利用しない。

```text
running(attempt=N, lease expired)
  -> retry_pending
  -> queued(attempt=N+1, new key)
```

旧Workerのattempt/keyは失効し、遅延heartbeat・遅延完了はno-opとなる。

### 4. completion guardとattempt fencingを併用する

- attempt fencing: 旧attempt・所有権喪失Workerの更新を拒否する。
- completion guard: submissionの終端保存を一度だけ許可する。

どちらか一方だけでは、stale回収と遅延完了の競合を安全に処理できない。

### 5. heartbeatとstale scannerはWorker責務とする

APIはstale判定や提出コード実行を行わない。

Workerはclaim後にheartbeatを更新し、起動時および定期的にstale候補を走査する。複数Workerによる回収競合はDBのcompare-and-setで一件だけ成功させる。

### 6. legacy runningは自動回収しない

lease列追加前から存在しlease期限がNULLのrunning行は、rolling deploy中の旧Worker実行を否定できないため手動確認対象とする。

### 7. 段階的に有効化する

1. additive migration
2. lease付きclaim・heartbeat・fenced completionを導入
3. stale recovery無効状態で検証
4. stale recoveryをfeature flagで有効化

stale scannerを先に有効化しない。

## 変更点

後続実装では以下が必要になる。

- submission lease列のadditive migration
- lease付きclaim
- fenced heartbeat
- fenced terminal update
- stale候補一覧
- recovery transaction
- periodic scanner
- attempt上限到達時のinfra_failed終端
- learner-safe非露出確認
- unit / integration / CI品質ゲート

## 不変条件

- APIで提出コードを直接実行しない。
- hidden tests詳細を学習者へ返さない。
- challengeはversion追加方式で更新する。
- completion guardを維持する。
- auth / admin境界を変更しない。
- Issue #101では実装・schema変更を行わない。

## 却下した案

- `updated_at` のみでstale判定する。
- Worker起動時に全runningをqueuedへ戻す。
- stale回収で同じattemptを再利用する。
- completion guardだけで旧Worker結果を防止する。
- APIが回収後の採点を直接実行する。
- MVPでlease tokenとattempt keyを二重管理する。

## リスク

- heartbeat遅延による誤回収
- 複数scannerによる競合
- 旧Workerの遅延完了
- migration直後のlegacy running
- 大量staleの一斉再投入

対策は詳細設計レポートの「リスクと対策」を正本とする。

## 未確定事項

後続実装Issueで確定する。

- lease duration / heartbeat interval / scanner intervalの最終値
- recovery batch sizeと同時実行上限
- Worker runner処理のbest effort中断方式
- worker instance IDを永続監査情報へ含めるか
- stale回収実装を1PRにまとめるか、fencingとscannerで分割するか

## 結果

Issue #101ではdocs-onlyで設計を確定し、実装は「lease / heartbeat / fenced completion」と「stale scanner / recovery」の順に分離して進める。
