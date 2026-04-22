# architecture（MVP縦切り実装）

## challenge 読み込み方式
- `apps/api/src/repositories/challenge-repository.mjs` で `problems/examples/*/problem.json` をファイルベースで読み込む。
- 返却モデルは API レイヤで使う最小DTO（一覧用 summary / 詳細）に分ける。
- 目的: MVPでDBなしで動かしつつ、後で repository を DB 実装へ差し替えやすくする。

## submission フロー
1. Web が `POST /api/submissions` を呼ぶ
2. API は submission を `.data/submissions.json` に保存（status=queued）
3. API は Worker `/jobs` へ `submissionId` を送る
4. Worker が status=running に更新
5. Worker が runner を呼んで visible/hidden tests 実行
6. Worker が normalize した結果を submission に保存（status=completed/failed）
7. Web は `GET /api/submissions/:id` をポーリングして結果表示

## Worker の責務
- queue受理（`POST /jobs`）
- submission 読み込み・状態遷移管理
- challenge の test 定義を元に runner 実行
- 結果正規化と保存
- hidden tests の詳細は公開レスポンスに含めない前提で内部保持

## runner の責務
- 実行用ワークディレクトリ準備
- 提出コードの差し替え
- visible tests 実行
- hidden tests 実行
- 実行ログ・実行時間・テスト結果の正規化

## visible tests / hidden tests の扱い
- challenge 定義で `visibleTests` と `hiddenTests` を明示分離
- Worker は双方を実行
- APIレスポンスでは
  - visible: 個別結果を返却
  - hidden: 中身は返さず `passedCount/total/passed` のみ返却

## 簡易実装と今後の安全な分離実行への移行ポイント
### 今回の簡易実装
- Workerプロセスで `node --test` を起動する簡易方式
- ストレージは `.data/submissions.json`（ローカルファイル）
- キューは Worker HTTP endpoint + `setImmediate` で代替

### 今後の移行ポイント
- queue を Redis/SQS 等へ置換
- submission/results を RDB へ移行
- runner を container/job 実行へ置換（タイムアウト・メモリ制限・ネットワーク制限を強化）
- artifact 保存先をオブジェクトストレージへ移行
