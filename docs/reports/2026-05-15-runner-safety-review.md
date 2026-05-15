# Runner / Worker / Submission 安全性レビュー（Issue #37）

- 日付: 2026-05-15
- 対象Issue: #37
- 目的: 現行 Runner / Worker / submission 実行フローの安全性を評価し、次段階の設計判断材料を正本として残す。
- 非目的: runner/Worker実装修正、採点ロジック変更、hidden tests仕様変更、auth/DB schema変更。

## 1. レビュー範囲
- Runner 実行境界
- Worker 経由の非同期採点フロー
- timeout / resource policy / retry safety / failure isolation
- hidden tests の保存・返却・ログ露出経路
- learner-safe / internal レスポンス境界
- `/api/admin/*` 認可境界
- queue 依存と障害時の停止/再試行方針

## 2. 現行アーキテクチャの確認結果（事実）
- API は `POST /api/submissions` で submission を保存し、Worker `/jobs` へ `submissionId` を送信する。API本体で提出コードを実行していない。
- Worker は受理後に `setImmediate` で非同期実行し、`queued -> running -> completed/failed` へ状態遷移する。
- Runner は challenge ディレクトリを一時領域に複製し、提出コードを差し替えたうえで `node --test` を visible/hidden それぞれ実行する。
- learner 向け submission 返却は hidden tests の詳細を含まず、集計のみを返す。
- admin は `result.logs` と hidden/full test results を internal 情報として参照可能。
- `/api/admin/*` は `requireRole(..., 'admin')` でガードされる。

## 3. リスク評価（優先順位付き）

### P0（商用運用前に恒久対策必須）
1. **任意コード実行の隔離不足**
   - 状況: Runner は Worker プロセス上で `node --test` を直接 spawn。
   - 影響: 悪意ある提出コードがプロセス/ホスト資源へ干渉する余地。
   - 暫定対策: 実行ノード分離、最小権限実行ユーザー、監査ログの定型化。
   - 恒久対策候補: container/job ベース分離実行（CPU/メモリ/FS/ネットワーク制限）。

2. **resource policy の不足（メモリ・プロセス数・I/O 制限未実装）**
   - 状況: timeout はあるが、メモリ上限・プロセス上限・ファイルI/O 制限は未定義。
   - 影響: DoS 的負荷、worker停止、隣接ジョブ巻き込み。
   - 暫定対策: Worker を専用実行基盤へ隔離、ジョブ同時実行数制御。
   - 恒久対策候補: cgroup/コンテナ実行制御と kill policy の明文化。

### P1（次スプリントで計画化）
3. **再試行安全性（idempotency）未定義**
   - 状況: `/jobs` は受理時に重複排除キーを持たず、同一 submissionId の多重投入を抑止しない。
   - 影響: 二重実行、状態競合、ログ不整合。
   - 暫定対策: 運用上は再送を最小化し、障害時に手動再実行ルールを定義。
   - 恒久対策候補: submission 単位の排他ロック/冪等キー/状態遷移ガード。

4. **queue の耐障害性不足（in-memory setImmediate）**
   - 状況: durable queue ではなく、Worker プロセス障害時に失われる可能性。
   - 影響: 採点取りこぼし、学習者体験低下、運用調査コスト増。
   - 暫定対策: 監視で `queued` 滞留検知し、再投入オペレーションを runbook 化。
   - 恒久対策候補: Redis/SQS 等の永続キューへ移行。

5. **ログ秘匿境界の運用依存**
   - 状況: hidden 実行の生ログは result.logs に保存しない設計だが、例外メッセージは保存される。
   - 影響: エラー内容次第で内部情報が広く参照される可能性。
   - 暫定対策: 例外ログを定型メッセージ化し、内部詳細は監査ストアへ分離。
   - 恒久対策候補: 構造化ログ + 機密フィールド自動マスキング。

### P2（将来移行で対応）
6. **SQLite 単体運用の同時実行/監査限界**
   - 状況: 現行MVPでは妥当だが、商用スケール時のロック/可観測性に限界。
   - 影響: スループット制約、障害解析負荷。
   - 対策候補: RDB（PostgreSQL 等）への段階移行計画を runbook / ADR で整備。

## 4. hidden tests 漏洩観点の確認
- learner-safe レスポンスは `visibleTests` と `hiddenTests(集計)` のみで、hidden の個別内容は返却しない。
- admin internal のみ hidden/full results を返す境界は実装済み。
- review preview は `reviewConfig` ベース生成であり hidden tests 実データを直接参照しない。
- 本レビューでは hidden tests 実データは未出力（方針遵守）。

## 5. Auth / Admin 境界の確認
- `/api/admin/*` は admin ロール必須。
- submission internal 情報は admin のみ参照可能。
- learner/guest は hidden詳細・internalログ非表示。
- ただし `x-web-user` ヘッダー方式はMVP簡易実装のため、商用化時はセッション/トークン基盤強化が前提。

## 6. 設計判断（今回確定）
1. **Issue #37 は「レビュー記録Issue」として完遂する。**
   - 理由: 現時点は不変条件維持を優先し、実装修正を混在させないため。
2. **恒久対策は follow-up Issue へ分離する。**
   - 理由: 隔離実行/キュー移行/auth強化は影響範囲が広く、個別設計・段階導入が必要なため。
3. **hidden tests 秘匿境界は現行方針を維持し、ログ運用で補強する。**
   - 理由: learner-safe 境界は満たしており、短期は運用統制で漏洩面を縮小できるため。

## 7. follow-up Issue 候補（優先度順）
1. P0: Runner の隔離実行基盤設計（container/job、resource 制限、network 制限、artifact 方針）
2. P1: Worker ジョブ冪等化（重複投入防止、状態遷移ガード、再試行ポリシー）
3. P1: durable queue 導入（Redis/SQS など）と `queued` 滞留監視
4. P1: submission ログ秘匿ポリシー（機密分類、マスキング、保持期限）
5. P2: SQLite から将来RDB移行の段階計画（互換API維持）

## 8. 未対応事項
- 本レビューは設計評価のみで、実装変更は未着手。
- 本番隔離実行基盤の具体選定（Kubernetes Job / Firecracker など）は別Issueで比較検討が必要。
- auth の本格化（header依存の縮退）は別Issueで実施が必要。
