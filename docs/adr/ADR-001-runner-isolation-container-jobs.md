# ADR-001: Runner隔離実行基盤として短命コンテナジョブ方式を採用する

- 日付: 2026-05-15
- ステータス: Accepted
- 関連Issue: #44（設計整理・完了）, #46（ADR正式化・進行中）

## 目的
Runner隔離実行基盤の採用方式を正式化し、後続実装（PoC/段階導入）の拘束条件を明文化する。

## 背景
- 現行はWorker内の簡易実行に依存しており、任意コード実行リスクに対する隔離境界が十分ではない。
- Issue #44で、採用案/却下案/トレードオフ/次アクションを設計文書として整理済み。
- 商用・教育利用の説明可能性のため、制限値・返却境界・rollback方針をADRとして固定する必要がある。

## 決定事項（採用案）
### 1) 実行方式
- 提出コード実行は **短命コンテナジョブ** へ委譲する。
- Worker責務は「ジョブ作成・状態管理・結果集約」に寄せる。
- API本体は提出コードを直接実行しない不変条件を維持する。

### 2) resource制限（初期固定値）
- CPU: 1 vCPU
- Memory: 512MiB
- Process数上限: 64
- Timeout: visible/hidden それぞれ20秒、総量40秒上限

### 3) network / filesystem制限
- Network: デフォルト deny（egress/ingress遮断）。
- Root filesystem: read-only を原則。
- 書き込み可能領域: job専用一時領域のみ（例: `/tmp/job/<id>`）。
- challenge fixture: read-only mount。

### 4) artifact返却境界
- 回収artifactは whitelist 方式（`results.json`, `stdout.log`, `stderr.log`）に限定。
- hidden tests の詳細（個別失敗理由・テスト断片）は learner-safe に返却しない。
- learner-safe は hidden 集計（`passed/failed/total`）のみ返却。
- internal artifact は admin/internal 境界でのみ閲覧可能とする前提を維持。

### 5) timeout / kill policy
- soft timeout 到達: SIGTERM 送信、3秒猶予。
- hard timeout 到達: SIGKILL で強制終了。
- 終了理由は `failed(timeout)` 等へ正規化し、再試行可否はWorker側ポリシーで判定。

## 却下案
1. **Worker内 `node --test` 直実行継続**
   - 却下理由: プロセス境界が弱く、P0リスクを構造的に解消できない。
2. **microVM/VM の即時全面採用**
   - 却下理由: 導入初手として運用複雑性・コストが高い。
   - ただし高信頼要件向けに将来再評価する。
3. **language runner の全面再設計を先行**
   - 却下理由: 隔離方式確定よりスコープが大きく、目的逸脱。

## 比較理由・トレードオフ
- 短命コンテナ方式は、現行継続より安全性が高く、microVM即時採用より導入速度が高い。
- 一方で、ジョブオーケストレーション・監視・artifact管理の運用負荷は増える。
- visible/hidden を同一ジョブ内で論理分離するため、内部ログ境界の運用厳格化が前提となる。

## 影響範囲
- **Worker**: 将来、実行責務の外部委譲実装が必要（本Issueでは未実装）。
- **queue**: 再試行・冪等制御の見直しが必要（follow-up）。
- **DB**: runner job / artifact / audit log を保持する場合は schema変更が必要（別Issue化）。
- **auth/admin**: internal artifact 閲覧は admin 限定を維持。監査要件は後続整理。
- **hidden tests**: learner-safe 非公開原則を維持。

## 段階導入方針
1. ADR確定（本書）
2. PoC（隔離ジョブ呼び出し最小経路）
3. 結果正規化（timeout/OOM/kill reason）
4. ログ境界の自動検査
5. runbook整備（障害一次切り分け）

## rollback方針
- 隔離ジョブ導入後に重大障害が発生した場合、feature flag/ルーティング切替で実行経路を一時的に従来経路へ戻せる設計を前提とする。
- ただし rollback 中も learner-safe / hidden秘匿 / admin境界の不変条件は維持する。
- rollback実施条件・承認フロー・復旧判断基準は後続runbookで規定する。

## 未確定事項（後続Issueで確定）
- artifact保存期間、マスキング粒度、監査ログ設計。
- internal artifact の閲覧監査（誰が・いつ・何を参照したか）。
- durable queue 採用有無と冪等キー設計。
- 商用高信頼モードでのmicroVM再評価基準。
