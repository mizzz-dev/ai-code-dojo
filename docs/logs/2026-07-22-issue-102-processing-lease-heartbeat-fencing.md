# Issue #102 processing lease / heartbeat / attempt fencing 作業ログ

## Summary

Issue #101 / PR #103で確定した設計に基づき、stale scannerより先に必要なlease ownership、heartbeat、attempt fencingを最小差分で実装した。

## Current PR / Issue

- Current Issue: #102
- Issue URL: `https://github.com/mizzz-dev/ai-code-dojo/issues/102`
- Current PR: #104
- PR URL: `https://github.com/mizzz-dev/ai-code-dojo/pull/104`
- Linear mirror: `MIZ-27`
- Branch: `feat/submission-processing-lease-heartbeat`

## Completed Tasks

- Issue #101 / PR #103の完了状態を確認した。
- Linear MIZ-25をDoneへ更新した。
- Linear MIZ-27をIn Progressへ更新した。
- `submissions`へprocessing lease関連nullable列をadditive migrationで追加した。
- lease付きclaimを実装した。
- expected attempt / attempt key / lease未失効を条件とするheartbeatを実装した。
- Workerのnon-terminal / terminal保存をattempt/key/lease期限でfenceした。
- retry attempt開始時にprocessing lease情報をクリアした。
- heartbeat feature flagと設定値検証を追加した。
- migration / repository / config / integration testを追加・更新した。
- current-status / active-issues / system-overview / runbookを更新した。
- PR #104をDraftで作成した。
- 最終headで全品質ゲートの成功を確認した。

## Repository Findings

- PR #100でqueued起動時回収と条件付きclaimは実装済みだった。
- terminal保存はcompletion guardのみで、旧attemptを拒否するfencingが不足していた。
- Runnerは子プロセス実行であり、Worker本体からheartbeat timerを維持できる。
- learner-safe APIは明示的なDTOを返しており、repository内部のlease列を返さない構造になっている。

## Technical Decisions

- lease列はnullableなadditive migrationとする。
- heartbeatは `WORKER_HEARTBEAT_ENABLED=1` の場合だけ有効化する。
- feature flag無効時は従来のclaim・採点挙動を維持する。
- heartbeat intervalはlease durationの3分の1以下とする。
- attempt idempotency keyをfencing tokenとして再利用する。
- heartbeat・状態更新・terminal保存はexpected attempt/keyとlease未失効を条件とする。
- heartbeat更新0件またはエラー時は所有権喪失として結果保存を抑止する。
- completion guardはsubmission単位の終端一意化として維持する。
- stale scanner / recovery transactionは本Issueへ混在させない。

## Rejected Alternatives

- heartbeatを常時有効化する案
  - rolling deploy時の後方互換と段階導入性を損なうため不採用。
- `updated_at` をlease期限として利用する案
  - 状態更新全般の時刻であり所有権期限を表さないため不採用。
- completion guardだけで旧attemptを無害化する案
  - 新attempt開始後の旧Workerが先にterminal保存できるため不十分。
- stale scannerを同一PRへ実装する案
  - fencing完成前の自動回収は競合リスクが高く、差分も大きくなるため分離。

## Risks

- heartbeat feature flag有効化後のDB書き込み頻度増加。
- event loop遅延によるlease失効。
- heartbeatエラー後はscanner実装まで `running` が残る。
- SQLiteの単一ホスト前提を超える運用は対象外。
- stale大量発生時のbatch size・同時実行数は未設計。

## Validation Results

GitHub Actions（PR #104 最終実装head）:

- docs validation: Success
- lint: Success
- typecheck: Success
- unit test: Success
- integration test: Success
- schema validation: Success
- build: Success

確認済み:

- 旧DBへのlease列additive migrationと冪等性
- lease付きclaim
- heartbeatによるlease延長
- attempt/key不一致時のno-op
- lease期限切れ後のheartbeat no-op
- retry後の旧attempt terminal保存no-op
- terminal保存後のlease情報クリア
- learner-safeへのlease・attempt情報非露出
- queued起動時回収とretry state machineの回帰なし

## Remaining Tasks

- PR #104をReady for reviewへ変更する。
- PR merge後にIssue #102 / Linear MIZ-27を完了へ更新する。
- 後続Issueでstale候補一覧 / recovery transaction / periodic scannerを実装する。
- merge後にbranch cleanupを確認する。

## AI Prompts Used

- `docs/ai-prompts/2026-07-22-issue-102-processing-lease-heartbeat-fencing-codex.md`

## Handoff

- `docs/handoff/2026-07-22-issue-102-processing-lease-heartbeat-fencing-handoff.md`
