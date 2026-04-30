# requirements（MVP縦切り版）

## 1. 今回の達成範囲
- 問題一覧表示
- 問題詳細表示
- starter code 編集
- submission 作成
- Worker採点
- visible tests 実行結果保存
- hidden tests 実行構造
- 提出結果表示（pass/fail, ログ, 実行時間）
- 1問（js-bugfix-add）でE2E確認

## 2. 非機能・制約
- APIプロセスで提出コードを直接実行しない
- hidden tests の内容は API/Web に返さない
- 実装は最小差分で責務分離を優先

## 3. 今回の実装方式
- challenge: ファイルベース repository
- submission: ローカルJSONファイル
- queue: Worker HTTP endpoint（簡易）
- runner: JavaScript向け最小実装（`node --test`）

## 4. 今回の対象外（未対応）
- 認証/課金/ランキング
- マルチ言語完全対応
- 本番隔離実行基盤
- 高度な運用監視

## 5. 要確認（次フェーズ）
- DBの正式採用（PostgreSQL等）
- queueの正式採用（Redis/SQS等）
- セキュアな分離実行基盤（container/job）
- hidden tests 管理運用（暗号化・アクセス制御）

## 追加要件（問題管理運用）
- challenge の公開/非公開管理と version 追跡を必須とする。
- hidden tests は内部保存し、学習者向けAPI/UIに露出しない。
- reviewConfig から日本語のPRタイトル/本文/レビューコメント雛形を生成できること。
