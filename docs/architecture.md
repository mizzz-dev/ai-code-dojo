# architecture（初期設計）

## 全体方針
- モノレポで `apps/*` と `packages/*` を分離。
- 実行要求は API/Worker から runner へ委譲し、本体で任意コードを実行しない。
- 問題定義は `packages/problem-schema` で共通化し、`problems/examples` を機械検証する。

## コンポーネント
1. **web**
   - 問題閲覧、エディタ、実行/提出UI（MVPでは土台のみ）
2. **api**
   - 問題取得、提出受付、runner への実行依頼（MVPでは接続設定の土台）
3. **worker**
   - 非同期ジョブ実行と再試行制御（MVPでは土台のみ）
4. **runner-sdk**
   - enqueue/status/result の共通interface
5. **problem-schema**
   - 言語追加可能な問題メタデータJSON Schema

## hidden / visible tests
- `tests/visible`: 学習者向け事前確認
- `tests/hidden`: 提出時採点専用
- UI/API で hidden を返さない運用を前提にする

## CI/CD方針
- `develop.yml`: PR/push(develop)で品質ゲート
- `deploy-staging.yml`: develop更新後に staging deploy
- `deploy-production.yml`: main更新後に production deploy
- デプロイ本実装は TODO とし、workflow上は抽象化レイヤー（deploy script）を呼ぶ
