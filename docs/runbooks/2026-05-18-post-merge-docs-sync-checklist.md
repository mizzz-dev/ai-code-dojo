# post-merge docs sync checklist（Issue/PR 完了時の同期チェックリスト）

作成日: 2026-05-18  
対象Issue: #73

## 目的
Issue/PR 完了後に、GitHub 状態（merged/closed）と Repository 内正本 docs の不整合を防止し、AI/人間のどちらでも再開可能な監査導線を維持する。

## 適用タイミング
- Current PR が merged になった直後
- Current Issue が closed/completed になった直後
- handoff 作成前の最終確認

## チェックリスト

### A. GitHub 状態確認（Source of Truth 起点）
- [ ] Current PR が `merged` であることを確認した。
- [ ] Current Issue が `closed/completed` であることを確認した。
- [ ] PR と Issue の参照関係（何をもって完了とするか）をログに記録した。

### B. 正本 docs 同期
- [ ] `docs/current-status.md` を最新完了状態に更新した。
- [ ] `docs/active-issues.md` で完了Issueを `Recently Completed` へ移動し、次の進行中Issueを明示した。
- [ ] 更新日時（最終更新日）と優先順位が現状に一致している。

### C. 作業証跡（ログ/プロンプト/handoff）
- [ ] `docs/logs/` に Issue 単位の作業ログを作成/更新した。
- [ ] `docs/ai-prompts/` に AI prompt log を作成/更新した。
- [ ] `docs/handoff/` に次担当向け handoff を作成/更新した。
- [ ] PR #72 / Issue #71 のような前回経緯と今回タスク接続を明記した。

### D. セキュリティ・プライバシー非混入確認
- [ ] hidden tests 実データを docs / issue / PR / logs / handoff に記載していない。
- [ ] secrets（token/password/key 等）を docs / commit に含めていない。
- [ ] `.data/app.db` がコミット対象に含まれていない。
- [ ] 内部ログ詳細（学習者非公開情報）を learner 向け文面へ転記していない。

### E. 不変条件（本プロジェクト運用ガード）
- [ ] runner / Worker 本体を変更していない。
- [ ] API本体で提出コードを直接実行しない不変条件を壊していない。
- [ ] hidden tests は内部専用のまま（learner-safe 境界を維持）である。
- [ ] `/api/admin/*` の認可境界を変更していない。
- [ ] DB schema / migration / seed を変更していない。
- [ ] challenge は既存version上書きではなく version 追加方式を維持している。

### F. 最終差分確認
- [ ] docs-only の最小差分であることを確認した。
- [ ] 無関係ファイル変更がないことを確認した。
- [ ] 次タスク（1件）を `docs/current-status.md` / `docs/active-issues.md` / handoff で一致させた。

## 運用メモ
- このチェックリストは merge 後処理の標準手順として再利用する。
- 仕様本文は Canonical Source（`current-status` / `active-issues` / `project-overview`）へ集約し、ログには要約を残す。
