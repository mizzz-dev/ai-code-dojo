# ai-code-dojo固有ポリシー

## 高リスク領域
- 採点実行は Worker 非同期で実施し、APIプロセスで提出コードを直接実行しない。
- MVP は本番レベルの完全サンドボックス未対応であり、任意コード実行リスクを前提に運用する。
- タイムアウト、メモリ上限、プロセス分離、FS/ネットワーク制限は段階的に強化する。

## visible / hidden tests
- visible tests: 学習者に表示可能。
- hidden tests: 内部実行のみ。詳細をAPIレスポンス・ログ・PRへ出さない。
- hidden tests 失敗理由は learner-safe な集計/概要に限定する。

## challenge / submission / DB
- `challenges` + `challenge_versions` の2層管理を維持し、version直接上書きは禁止。
- submissions保存範囲と `.data/app.db` 取り扱いを明示する。
- learner向けとadmin向けの情報境界を維持する。

## 認証・認可
- learner/admin ロールを分離する。
- `/api/admin/*` は admin のみ。
- `ADMIN_PASSWORD` / `LEARNER_PASSWORD` は secret 管理し、未設定時は安全側で失敗させる。

## 商用・教育利用
- 提出コード・学習者データの保存/削除方針を定める。
- 大量投稿/DoS対策、障害対応、コスト管理、利用規約/プライバシーポリシー整備を継続課題とする。
