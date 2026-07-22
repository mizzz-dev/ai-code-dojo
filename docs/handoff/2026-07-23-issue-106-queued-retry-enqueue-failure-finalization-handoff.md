# Issue #106 Handoff

## Summary

PR #104のマージ後レビューで確認した、retry再投入失敗時に新attemptが `queued` のまま残るP1不具合へ対応した。

既存のrunning terminal fencingは緩めず、queued retry attempt専用の条件付き `infra_failed` 終端化経路を追加した。

## Current State

- GitHub Issue #106: Open / In Progress
- GitHub PR #107: CI Success / Ready for reviewへ変更予定
- Branch: `fix/finalize-queued-retry-enqueue-failure`
- Related merged PR: #104
- Related completed Issue: #102
- Next Issue: #105（Issue #106 / PR #107 merge待ち）
- Linear:
  - MIZ-27: Done
  - MIZ-34: Todo。GitHub Issue #106 / PR #107をblockerとしてdescriptionとlinksへ記録
  - Issue #106の新規mirrorはworkspace無料Issue上限により作成不可

## Problem

`handleInfrastructureFailure` は以下の順序でretryを行う。

```text
running(attempt=N)
  -> retry_pending(attempt=N)
  -> queued(attempt=N+1)
  -> Workerへ再投入
```

再投入失敗時、submissionは新attemptの `queued` だが、既存 `updateSubmissionForAttempt` のterminal更新は `status = running` を要求する。このため `infra_failed` 保存がno-opとなり、queued状態が残っていた。

## Implemented Changes

- `finalizeQueuedAttemptAsInfraFailed` をsubmission repositoryへ追加。
- 更新条件:
  - submission id
  - `status = queued`
  - completion guard未設定
  - expected grading attempt
  - expected attempt idempotency key
- 保存内容:
  - `status = infra_failed`
  - result JSON
  - completion guard
  - processing lease関連列をNULLへクリア
- Workerのretry enqueue失敗時に新関数を利用。
- result statusが `infra_failed` 以外の場合はエラーとする。
- 更新0件はno-opとして扱う。

## Tests Added

### Unit

`tests/unit/queued-retry-finalization.test.mjs`

- wrong attemptのno-op
- queued attemptの正常終端化
- completion guard設定
- lease情報クリア
- 重複要求のno-op
- running状態のno-op
- `infra_failed` 以外のresult拒否

### Integration

`tests/integration/api-flow.test.mjs`

- retry再投入先を到達不能URLへ設定
- missing challengeでinfrastructure failureを発生
- learner-safeが `failed` へ到達
- admin/internalが `infra_failed` と一般化ログを確認
- queued状態が残らないことを確認

## Validation Results

- docs validation: Success
- lint: Success
- typecheck: Success
- unit test: Success
- integration test: Success
- schema validation: Success
- build: Success

## Key Decisions

- running terminal updateの `status = running` 条件は維持する。
- queued retry attemptだけを扱う専用経路に分離する。
- attempt fencingはDBの単一条件付きUPDATEで保証する。
- generic updateやWorker側check-then-writeは利用しない。
- stale scannerはIssue #105へ分離したままとする。

## Review Focus

- queued retry attempt専用経路として責務が限定されているか。
- expected attempt / key / completion guard条件が十分か。
- running terminal fencingを弱めていないか。
- retry enqueue成功時の既存経路に影響がないか。
- learner-safeでinternalログ・attempt key・lease情報が露出しないか。
- integration testが実際の到達不能retry endpointを再現できているか。

## Known Risks

- retry再投入失敗が連続する場合はWorker endpointまたはnetwork障害の運用調査が必要。
- stale scanner実装時にqueued retry finalizationとrecovery transactionの競合を再確認する必要がある。
- Linear workspaceの無料Issue上限により、GitHub Issue #106のmirrorを追加できていない。

## Remaining Tasks

1. PR #107をReady for reviewへ変更する。
2. レビュー後にPR #107をmergeする。
3. Issue #106をcloseする。
4. MIZ-34からblocker記載を解除し、Issue #105の実装へ着手する。
5. merge後にbranch cleanupを確認する。

## Handoff Notes

- Source of TruthはGitHub Issue #106、PR #107、Repository内docs。
- Issue #105の実装をPR #107へ混在させないこと。
- APIで提出コードを直接実行しないこと。
- hidden tests詳細、提出コード本文、secret、環境変数値をIssue / PR / docs / logsへ記載しないこと。
- challengeはversion追加方式を維持すること。