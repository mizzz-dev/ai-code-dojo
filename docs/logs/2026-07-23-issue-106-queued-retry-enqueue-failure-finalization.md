# Issue #106 queued retry enqueue failure finalization 作業ログ

## Summary

PR #104のマージ後レビューで確認した、retry再投入失敗時に新attemptが `queued` のまま残るP1不具合を修正した。

## Current PR / Issue

- Current Issue: #106
- Issue URL: `https://github.com/mizzz-dev/ai-code-dojo/issues/106`
- Current PR: #107
- PR URL: `https://github.com/mizzz-dev/ai-code-dojo/pull/107`
- Branch: `fix/finalize-queued-retry-enqueue-failure`
- Related merged PR: #104
- Next Issue: #105

## Completed Tasks

- PR #104がmerge済み、Issue #102がClosed / Completedであることを確認した。
- PR #104のCodex reviewでP1指摘を確認した。
- 重複Issueがないことを確認し、GitHub Issue #106を作成した。
- queued retry attempt専用の `finalizeQueuedAttemptAsInfraFailed` をsubmission repositoryへ追加した。
- Workerのretry再投入失敗経路を新しいfenced終端化関数へ変更した。
- attempt/key不一致、running、terminal済み、重複更新をno-op化した。
- completion guard設定とprocessing lease情報クリアを維持した。
- unit testとintegration regression testを追加した。
- current-status / active-issues / Worker failure recovery runbookを更新した。
- Linear MIZ-27をDoneへ更新した。
- Linearの無料Issue上限によりIssue #106のmirror作成は失敗したため、MIZ-34へGitHub #106 / PR #107のblocker情報を追記した。
- GitHub Actionsの全品質ゲート成功を確認した。

## Repository Findings

- `startRetryAttempt` 成功後のsubmissionは新attemptの `queued` 状態となる。
- `updateSubmissionForAttempt` のterminal更新は旧Workerの遅延完了を拒否するため `status = running` を必須としている。
- このrunning条件を緩めると、retry_pending移行後やstale recoveryとの競合防止が弱くなる。
- retry再投入失敗はqueued状態で発生するため、running terminal updateとは別の状態限定経路が必要だった。
- learner-safe APIは `infra_failed` を `failed` へ抽象化し、internal logsを非表示にする既存境界を持つ。

## Technical Decisions

- 既存のrunning terminal fencingは変更しない。
- queued retry attempt専用のrepository関数を追加する。
- 更新条件はsubmission id / status=`queued` / completion guard未設定 / expected attempt / expected keyとする。
- 成功時のみ `infra_failed`、result、completion guardを一括保存する。
- processing lease関連列はNULLへクリアする。
- attempt/key不一致や状態不一致は例外ではなくno-opとして扱う。
- result statusは `infra_failed` のみ許可し、誤用を防止する。
- stale scanner / recovery transactionはIssue #105へ分離したままとする。

## Rejected Alternatives

- `updateSubmissionForAttempt` のterminal条件から `status = running` を削除する案
  - retry_pending移行後の遅延terminal保存を再び許すため不採用。
- `status IN ('running', 'queued')` とする案
  - queued terminal化の用途が曖昧になり、通常queued submissionを誤って終端化する危険があるため不採用。
- Worker側でget後にgeneric updateを呼ぶ案
  - checkとupdateの間に競合窓が生じ、attempt fencingをDBで保証できないため不採用。
- retry enqueue失敗時にqueuedのまま起動時回収へ任せる案
  - 結果確定がWorker再起動まで遅延し、明示的な再投入失敗を失敗確定できないため不採用。

## Validation Results

- docs validation: Success
- lint: Success
- typecheck: Success
- unit test: Success
- integration test: Success
- schema validation: Success
- build: Success

確認した主要ケース:

- queued retry attemptの正常終端化
- attempt/key不一致のno-op
- running状態のno-op
- terminal済み・重複要求のno-op
- completion guard設定
- processing lease情報クリア
- retry再投入先到達不能時の `infra_failed` 到達
- learner-safe `failed` 抽象化
- admin/internalの一般化ログ

## Risks

- retry再投入失敗が連続する場合、外部queue・network・Worker endpointの運用障害を別途調査する必要がある。
- internal result logはadmin/internal専用であり、learner-safe境界の回帰を継続確認する必要がある。
- Issue #105のstale scanner実装時も、queued retry attemptの終端化条件と競合しないことを確認する必要がある。
- Linear workspaceは無料Issue上限に達しており、新規mirror Issueを追加できない。

## Remaining Tasks

- PR #107をReady for reviewへ変更する。
- PR #107 merge後にIssue #106をCompletedへ更新する。
- PR #107 merge後にIssue #105 / MIZ-34のblockerを解除し、stale scanner実装へ着手する。
- merge後にbranch cleanupを確認する。

## Suggested Next Actions

1. PR #107をレビュー・mergeする。
2. Issue #106をcloseし、MIZ-34のblocker記載を完了状態へ更新する。
3. Issue #105でstale候補一覧 / recovery CAS / periodic scannerを実装する。

## AI Prompts Used

- `docs/ai-prompts/2026-07-23-issue-106-queued-retry-enqueue-failure-finalization-codex.md`

## Handoff

- `docs/handoff/2026-07-23-issue-106-queued-retry-enqueue-failure-finalization-handoff.md`