# 2026-05-19 Issue #77 作業ログ（Source of Truth復旧 + Idempotency ADR候補）

## Summary
- Issue #77 の目的である Source of Truth 復旧と、Retry state machine / idempotency key / completion guard のADR候補整理を docs-only で実施した。
- PR #79 は merge 済みだが、レビューで参照されていた作業ログファイルがリポジトリ上に存在しないことが判明したため、Issue #77 を reopen してログ欠落を補完する。

## Current PR
- #79（merged）

## Current Issue
- #77（Open / reopened）

## PR #79で完了した内容
- `docs/current-status.md` / `docs/active-issues.md` の Source of Truth を ai-code-dojo 文脈へ復旧。
- `docs/reports/2026-05-19-retry-state-machine-idempotency-adr-candidate.md` を追加し、Retry state machine / idempotency key / completion guard の候補を整理。
- `docs/ai-prompts/2026-05-19-issue-77-source-of-truth-recovery-and-idempotency-adr-codex.md` と `docs/handoff/2026-05-19-issue-77-source-of-truth-recovery-and-idempotency-adr-handoff.md` を整備。

## PR #79レビュー指摘
- 参照されていた `docs/logs/2026-05-19-issue-77-source-of-truth-recovery-and-idempotency-adr.md` が存在しない、という指摘を受領。

## 欠落していたログの補完理由
- Issue #77 の完了条件に「作業ログ保存」が含まれており、参照先不在のままでは完了扱いにできないため。
- 監査可能性（いつ・何を・なぜ決めたか）を会話外でも追跡可能にするため。

## Source of Truth復旧結果
- `docs/current-status.md` / `docs/active-issues.md` を ai-code-dojo 文脈に統一し、混入文脈を排除。
- Canonical Source と運用上の不変条件（API直接実行禁止 / hidden tests非露出 / challenge version追加方式）を維持。

## Retry state machine / idempotency key / completion guard のADR候補整理結果
- 状態遷移候補: `queued -> running -> passed/failed` を基底に、`retry_pending` / `infra_failed` / completion guard相当の完了保護を追加候補として整理。
- 自動再試行対象を infrastructure 起因に限定し、timeout/runtime failure は原則除外。
- idempotency key と completion guard を併用し、重複実行・重複完了の抑止を将来実装候補として定義。
- DB/queue/API/Worker への具体反映は別Issueで段階化する方針を維持。

## runner / Worker / hidden tests / auth / DB / challenge versioning 不変条件への影響
- runner: 変更なし（interface・実行方式ともに不変）。
- Worker: 実装変更なし（再試行は設計候補整理のみ）。
- hidden tests: 実データ非記載・学習者向け非露出を維持。
- auth/admin: 実装・権限ロジック変更なし。
- DB schema/migration/seed: 変更なし。
- challenge versioning: 既存version直接上書きなし、運用原則のみ確認。

## 実施しなかったこと
- runner / Worker / queue / DB / auth / API / UI / infra のコード変更。
- hidden tests 詳細、secret、内部機微情報のドキュメント記載。

## 残課題
- ADR候補の採用範囲（状態語彙・完了保護・監査ログ項目）の確定。
- retry_count / idempotency_key / completion_guard 反映要否の別Issue化。
- queue運用（visibility timeout / DLQ / backoff）の別Issue設計。

## 次アクション
1. 欠落ログ補完を含む docs 参照整合をレビューで確認。
2. Issue #77 の完了条件（ログ保存を含む）充足を確認してクローズ判断。
3. ADR候補の実装化は別Issue/別PRに分離して着手。

## テスト/確認結果
- `test -f docs/logs/2026-05-19-issue-77-source-of-truth-recovery-and-idempotency-adr.md` で実体存在を確認。
- `rg "2026-05-19-issue-77-source-of-truth-recovery-and-idempotency-adr.md" docs/ai-prompts docs/handoff docs/logs` で参照整合を確認。
- `rg "RouteGarage|PR #64|Issue #63|Issue #65" docs/current-status.md docs/active-issues.md` で無関係文脈の残存がないことを確認。
- docs-only 差分であり、実装コード・DB・auth・infra・runner・Worker 本体への変更がないことを確認。
