# architecture（MVP縦切り実装）

## challenge 読み込み方式
- `apps/api/src/repositories/challenge-repository.mjs` で `problems/examples/*/problem.json` をファイルベースで読み込む。
- 返却モデルは API レイヤで使う最小DTO（一覧用 summary / 詳細）に分ける。
- 目的: MVPでDBなしで動かしつつ、後で repository を DB 実装へ差し替えやすくする。

## submission フロー
1. Web が `POST /api/submissions` を呼ぶ
2. API は submission を SQLite（`.data/app.db`）に保存（status=queued）
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
- ストレージは `.data/app.db`（SQLite）
- キューは Worker HTTP endpoint + `setImmediate` で代替

### 今後の移行ポイント
- queue を Redis/SQS 等へ置換
- submission/results を RDB へ移行
- runner を container/job 実行へ置換（タイムアウト・メモリ制限・ネットワーク制限を強化）
- artifact 保存先をオブジェクトストレージへ移行

## challenge repository / versioning
- 管理機能は `apps/api/src/repositories/admin-challenge-repository.mjs` から SQLite 永続化へ移行。Repository契約は維持。
- `challenges` は公開状態とcurrentVersion参照のみを持ち、実体は `challenge_versions` に分離。
- admin API と learner API を分離し、hiddenTestsはlearner向けレスポンスに含めない。
- review preview は `reviewConfig` テンプレートを利用する生成層で実装し、将来AI生成に差し替え可能。

## 認証・認可（MVP運用）
- 認証: cookieベースの最小セッション導線を導入。
- ロール: `learner` / `admin` を定義し、管理導線は `admin` のみに制限。
- 認証情報: `ADMIN_PASSWORD` / `LEARNER_PASSWORD` を必須化し、未設定時は `/api/auth/login` と `x-web-user` の認証を安全に失敗させる。
- API境界: `/api/admin/*` は admin必須。`/api/submissions/:id` は learner-safe を標準とし、internal情報は admin のみ。
- 将来拡張: `apps/api/src/auth.mjs` を差し替えることで OAuth / DB session へ移行可能。

## Webログイン可用性（Issue #23）
- Web `/login` は API 認証呼び出しを `try/catch` で保護し、`fetch failed` を未処理例外として伝播させない。
- ステータス方針:
  - 認証失敗: 401（認証情報の見直しを促す）
  - API到達不能: 502（再試行を促す）
- 目的は認証方式の刷新ではなく、MVP責務を保ったまま可用性を上げること。

