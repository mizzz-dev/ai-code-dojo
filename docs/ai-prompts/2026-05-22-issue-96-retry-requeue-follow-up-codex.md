# 2026-05-22 Issue #96 retry requeue follow-up prompt（Codex）

## 指示要約
- `docs/ai-protocol/PROMPT.txt` を最優先ルールとして遵守する。
- PR #95 merge後に残った retry再投入導線のP1不整合を最小差分で修正する。
- Workerのretry再投入先を実待受ポートまたは明示設定と整合させる。
- 終端済みsubmissionを `retry_pending` など非終端状態で上書きしない。
- docs上に残る 旧番号プレースホルダを、PR #95 / Issue #96 として追跡可能な表記へ補正する。

## 実施方針
- Worker内retry再投入はAPI用環境変数に依存せず、Worker自己再投入用の明示設定または `WORKER_PORT` 由来URLを使う。
- API enqueue helperは既存のAPI呼び出し互換を維持しつつ、呼び出し側からURLを渡せるようにする。
- repositoryのcompletion guardを、終端結果保存だけでなく終端後の非終端上書き抑止にも使い、DB更新条件で競合時の no-op を担保する。
- unit/integration test と正本docsを同期更新する。

## 制約
- API本体で提出コードを直接実行しない。
- hidden tests 詳細を learner-safe 経路、docs、logs、PRへ露出しない。
- runner仕様、hidden tests仕様、auth/admin仕様、UI大規模変更、queue本格運用を混ぜない。
- DB schema / migration / seed は変更しない。
