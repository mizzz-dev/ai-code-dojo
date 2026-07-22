# Issue #101 Handoff

## Summary

stale `running` submissionを安全に回収するためのlease / heartbeat / attempt fencing / recovery設計をdocs-onlyで確定した。

## Current State

- GitHub Issue #101: Open / In Progress
- Linear mirror: MIZ-25 / In Progress
- Branch: `docs/stale-running-recovery-design`
- PR: #103 / Draft（CI成功確認済み）
- PR URL: `https://github.com/mizzz-dev/ai-code-dojo/pull/103`
- 後続実装Issue: #102
- 後続Linear mirror: MIZ-27 / Todo

## Completed Tasks

- PR #100 / Issue #99の完了状態を確認
- Linear MIZ-19をDoneへ更新
- Issue #101 / Linear MIZ-25を作成
- stale running recovery設計レポートを作成
- stale running recovery ADRを作成
- ADR一覧を更新
- current-status / active-issuesを更新
- system-overviewを更新
- Worker failure recovery runbookを更新
- log / AI prompt / handoffを作成
- 後続実装Issue #102を作成
- Linear MIZ-27をTodoで作成しMIZ-25をblockerに設定
- PR #103を作成
- GitHub Actionsの全品質ゲート成功を確認

## Key Decisions

- stale判定には専用lease期限を利用する。
- `updated_at` だけでstale判定しない。
- lease列候補は `processing_claimed_at` / `processing_heartbeat_at` / `processing_lease_expires_at`。
- 既存のattempt idempotency keyをfencing tokenとして利用する。
- heartbeat・非終端更新・terminal保存・recoveryはexpected attempt/keyを条件とする。
- stale回収は新attemptを開始する。
- completion guardとattempt fencingを併用する。
- stale scannerはWorker責務とする。
- lease NULLのlegacy runningは自動回収しない。
- stale scannerより先にIssue #102を実装する。

## Review Focus

- attempt idempotency keyをfencing tokenとして再利用する判断が妥当か。
- completion guardとattempt fencingの責務分離が明確か。
- legacy runningを自動回収しないrollout方針が安全か。
- lease / heartbeatの初期設定候補と制約が妥当か。
- DB schema候補が最小差分か。
- stale scannerよりfencingを先行させる依存順が妥当か。
- learner-safe / hidden tests境界が維持されているか。

## Validation Results

GitHub Actions run #51:

- docs validation: Success
- lint: Success
- typecheck: Success
- unit test: Success
- integration test: Success
- schema validation: Success
- build: Success

本変更はdocs-onlyであり、実装・schema変更は含まない。

## Known Risks

- heartbeat遅延による誤回収
- 旧Workerの遅延完了
- 複数scannerの競合
- legacy runningの運用負荷
- 大量staleの一斉再投入
- feature flag有効化順序の誤り

## Remaining Tasks

1. PR #103をReady for reviewへ変更する。
2. レビュー後にmergeする。
3. Issue #101 / Linear MIZ-25を完了へ更新する。
4. branch cleanupを確認する。
5. Issue #102 / Linear MIZ-27でlease / heartbeat / fenced completionを実装する。
6. Issue #102完了後にstale scanner / recovery transaction実装Issueを作成する。

## Handoff Notes

- Source of TruthはGitHub Issue #101とRepository内docs。
- GitHub Issue #102が次の実装タスク。
- Notion / Linearは追跡用ミラーであり、技術判断はRepository docsを正本とする。
- Issue #101のPRへ実装変更を混在させないこと。
- hidden tests詳細・提出コード本文・secretをIssue / PR / docs / logsへ記載しないこと。
