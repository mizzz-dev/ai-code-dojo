# skills.md

## このプロダクトの目的
ai-code-dojo は、AI生成コードに対する **読解・修正・テスト・PR作成** の実務フローを学習するための基盤です。

## 問題の作り方
1. `problems/examples/<slug>/problem.json` を作成する
2. `starter/` に学習者が編集するコードを配置する
3. `tests/visible` と `tests/hidden` を分離して配置する
4. `pnpm schema:validate` で問題定義を検証する

## 問題スキーマの説明
`packages/problem-schema/src/index.ts` で型と schema を管理する。主要項目は以下。
- `metadata`: 問題識別・難易度・カテゴリ・対応言語
- `statement`: 背景・課題・受け入れ条件・対象外
- `starterCode`: 編集可能/不可ファイル定義
- `visibleTests` / `hiddenTests`: テスト分離定義
- `runnerConfig`: build/test/run/timeout/network方針
- `reviewConfig`: PR運用ルール

## visible tests と hidden tests の扱い
- visible tests: 学習者へ公開し、ローカル確認用に利用する
- hidden tests: 採点専用。UI/APIレスポンスには内容を返さない
- hidden tests は機密扱いとし、公開領域へ出力しない

## 新しい言語ランナー追加手順
1. `packages/runner-sdk` の `RunnerAdapter` を満たす実装を追加
2. `prepare / executeVisibleTests / executeHiddenTests / collectArtifacts / normalizeResult` を実装
3. 新言語用サンプル問題を追加し schema validate を通す
4. CI（unit/integration）に最小検証を追加する

## ローカル起動方法
```bash
pnpm install
pnpm lint
pnpm typecheck
pnpm test:unit
pnpm test:integration
pnpm schema:validate
pnpm build
```

## ローカルでの問題検証方法
1. `problem.json` を更新
2. 対応する `starter/` `tests/visible` `tests/hidden` を更新
3. `pnpm schema:validate` で構造検証
4. 必要なら `node --test <visible test path>` で個別確認

## CI で確認するポイント
- lint: 禁止実装や危険APIの混入がないか
- typecheck: 公開契約（schema/runner/config）の互換性維持
- unit/integration: 問題定義とAPI契約の基本保証
- schema validation: 問題フォーマットの破壊検知
- build: 配布アーティファクト生成可否

## デプロイ時の注意点
- staging/production を workflow と GitHub Environment で分離する
- deploy は verify 成功後のみ実行する
- migration step を deploy と同一workflowで明示し、失敗時はデプロイ中止
- rollback 手順（直前安定版へ戻す）を運用手順として保持する

## よくある失敗例
- `hiddenTests` の定義漏れ、または visible と同一パスを指定する
- `runnerConfig.timeoutSeconds` を極端に短く設定する
- API側で提出コードを直接実行する実装を混入させる
- workflowで build/test をスキップして deploy する

## challenge追加/運用スキル
- challenge追加は admin API `POST /api/admin/challenges` を利用し、初版はversion=1で作成。
- 新versionは `POST /api/admin/challenges/:id/versions` で切る（直接上書き禁止）。
- 公開は `PATCH /api/admin/challenges/:id/publish` の status=`published` で切替。
- reviewConfig は `prTitleTemplate`, `prBodyTemplate`, `reviewerCommentTemplates`, `focusPoints`, `language` を設定。
- よくあるschemaエラー: unsupported language, reviewConfig必須キー欠落, visible/hidden testsの配列不備。
- review preview は `GET /api/challenges/:slug/review-preview` で確認。

## auth-ops（運用スキル）
- `/login` の障害運用: 401（認証失敗）と 502（API到達不能）を分離し、再試行可能な文言で案内する。
- 管理画面・管理APIのガード、ロール検証、レスポンス境界の点検手順を標準化する。
- `ADMIN_PASSWORD` / `LEARNER_PASSWORD` を必須設定にし、未設定時は認証失敗が正しい状態として監視する。
- DB移行時はセッションストア差し替えと監査ログ導入をセットで実施する。


## DB移行後の運用メモ（Issue #27）
- `pnpm db:migrate` で `challenges/challenge_versions/submissions` テーブルを作成する。
- `pnpm db:seed` は空DBのみ初期challengeを投入する。
- 旧JSONが存在する場合、API初回起動時にSQLiteへ自動移行される。
