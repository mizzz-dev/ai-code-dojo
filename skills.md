# skills.md

## ドメイン説明
本プロジェクトは「AI生成コードの修正・拡張学習」を目的としたオンラインジャッジ型学習基盤。

## 問題の作り方
1. `problems/examples/<problem-id>/problem.json` を作成
2. `starter/` に初期コードを配置
3. `tests/visible` と `tests/hidden` を分離して作成
4. `npm run schema:validate` を実行

## 問題スキーマ説明
- スキーマは `packages/problem-schema/src/index.ts` で管理
- 必須: id/title/type/difficulty/language/tags/description/starterFiles/visibleTests/hiddenTests/runner

## 新しい言語ランナー追加手順
1. `packages/runner-sdk` に必要な拡張型を追加
2. runner側で enqueue/status/result 契約を実装
3. 問題の `language` と `runner.image` / `entrypoint` を整備
4. CIに最小検証を追加

## hidden / visible tests の扱い
- visible: 学習者に表示・実行可能
- hidden: 採点時のみ使用、APIレスポンスへ含めない

## ローカル実行方法
```bash
npm install
npm run lint
npm run typecheck
npm run test:unit
npm run test:integration
npm run schema:validate
npm run build
```

## CIで確認するポイント
- schema validation failure が出ていないか
- typecheck/buildで将来拡張の型破壊がないか
- integration test が runner 接続契約を満たすか

## デプロイ時の注意点
- staging / production を workflow と GitHub Environment で分離
- deployは build/test成功後のみ実行
- 実デプロイ先が未確定の場合は TODO で抽象化層を維持

## よくある失敗例
- hidden tests を problem metadata に入れ忘れる
- runner の timeout/memory を未設定にする
- APIで直接コード実行する実装を入れてしまう
