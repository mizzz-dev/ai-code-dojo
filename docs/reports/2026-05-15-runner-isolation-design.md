# Runner隔離実行基盤 設計方針整理（Issue #44）

- 日付: 2026-05-15
- 対象Issue: #44
- 目的: Runner の隔離実行基盤について、MVPから本格運用へ移行するための設計方針を明文化する。
- 非目的: runner/Workerの全面置換、hidden tests仕様変更、DB schema/migration変更、auth/admin実装変更、UI変更、infra本番適用。

## 1. 前提・不変条件
- API本体で提出コードを直接実行しない。
- hidden tests は内部専用で、学習者向けには集計のみ返却する。
- challenge更新は既存version上書きではなく version追加方式を維持する。
- 実装変更は本Issue内で混在させず、必要時は follow-up Issue / ADR に分離する。

## 2. 設計対象
1. Runner 実行境界（Workerとの接続境界を含む）
2. resource 制限（CPU / memory / process / timeout）
3. filesystem 制限（一時ディレクトリ、読み書き範囲、artifact）
4. network 制限（原則 deny）
5. timeout / kill policy
6. visible / hidden tests 実行分離
7. learner-safe / internal 境界でのログ・artifact返却方針

## 3. 採用案（推奨）
### A案: 「Worker + 外部隔離実行ジョブ（コンテナ）方式」を段階導入

#### 概要
- Worker は「ジョブ作成・状態管理・結果集約」のみに責務を限定。
- 提出コード実行は、Worker外の隔離実行ジョブ（短命コンテナ）へ委譲。
- 1 submission を最小単位とし、visible/hidden は同一ジョブ内で論理分離して実行。

#### 制限ポリシー（初期推奨値）
- CPU: 1 vCPU（超過時はスロットリング）
- Memory: 512MiB（超過時 OOM kill）
- Process数: 64（fork bomb抑止）
- Timeout: 20秒（visible/hidden別カウント、総量40秒上限）
- Filesystem:
  - rootfs は read-only を原則
  - 書き込みは job専用tmp (`/tmp/job/<id>`) のみ
  - challenge fixture は read-only mount
  - artifact は whitelist（`results.json`, `stdout.log`, `stderr.log`）のみ回収
- Network:
  - デフォルト deny（egress/ingress どちらも遮断）
  - 必要時のみ allowlist を ADR 管理で例外化

#### timeout / kill policy
- soft timeout 到達時: SIGTERM 送信（3秒猶予）
- hard timeout 到達時: SIGKILL 強制終了
- kill後は `failed(timeout)` で正規化し、再試行可否は Worker 側ポリシーで判定

#### hidden tests保護
- hidden tests の個別失敗内容・テストコード断片は learner-safe へ返さない。
- hidden 実行ログは internal 専用artifactとして分離保存。
- learner-safe には `hiddenTests: { passed, failed, total }` の集計のみ返却。

## 4. 却下案（今回不採用）
### B案: 現行Worker内 `node --test` 直実行を強化継続
- 却下理由: プロセス境界が弱く、P0（任意コード実行リスク）を構造的に解消できない。

### C案: VM / microVM を即時全面採用
- 却下理由: セキュリティ強度は高いが、MVPからの移行初手として運用複雑性・コストが高すぎる。
- 補足: 将来の高信頼要件では再評価対象。

### D案: language runner を先に全面再設計
- 却下理由: 隔離境界問題よりスコープが大きく、Issue #44の目的（隔離基盤方針）から逸脱。

## 5. トレードオフ
- A案は B案より安全性が高い一方で、ジョブオーケストレーションと監視の運用負荷が増える。
- A案は C案より導入速度が高い一方で、分離強度はmicroVMに劣る。
- visible/hidden を同一ジョブ内で分離実行することで実装負荷を抑えられる一方、内部ログ管理を厳格化しないと漏洩面が残る。

## 6. 影響範囲整理（変更しないものを含む）
- Worker: 実行責務を委譲する設計変更が将来必要（本Issueでは実装しない）。
- queue: ジョブ再試行・冪等制御の見直しが必要（follow-up）。
- DB: artifactメタデータや監査ログ保存の追加要件が将来発生（schema変更は別Issue）。
- auth/admin: internal artifact の閲覧境界を維持し、admin限定を前提。
- learner-safe: hidden詳細非公開の不変条件を維持。

## 7. 次に実装すべき最小ステップ（MVP→本格運用の第一歩）
1. **ADR作成**: 隔離方式を「短命コンテナ実行」で確定（制限値・例外条件を明記）。
2. **実験実装（PoC）**: Workerから外部ジョブ実行APIを呼ぶ最小経路を作る（本番導入なし）。
3. **結果正規化**: timeout/OOM/kill reason を runner-sdk互換の失敗型に統一。
4. **ログ方針実装**: learner-safe / internal の返却フィールドを固定し、hidden漏洩を自動検査。
5. **運用runbook追加**: timeout多発/OOM多発時の一次切り分け手順を標準化。

## 8. Follow-up Issue候補
1. P0: 隔離実行PoC（container job + resource/network/filesystem制限）
2. P1: Workerジョブ冪等化（重複実行防止、状態遷移ガード）
3. P1: durable queue導入（取りこぼし防止）
4. P1: internal artifact 管理（保持期間・閲覧監査・マスキング）
5. P2: microVM再評価（商用高信頼モード向け）

## 9. ADR要否
- **要**。
- 理由: 制限値（CPU/メモリ/プロセス/timeout）、network deny原則、artifact返却境界は運用・セキュリティの中核判断であり、後続実装の拘束条件となるため。

## 10. Issue #37 との関係
- Issue #37で特定したP0リスク（Worker上での直接spawn）に対する設計フォローが本Issue #44。
- #37はレビュー記録、#44は設計方針確定と実装分離計画、という役割分担で継続する。
