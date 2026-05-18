# 2026-05-18 hidden tests / internal artifact / learner-safe 境界レビュー（Issue #64）

## 1. 目的とスコープ
- 目的: hidden tests / internal artifact / learner-safe レスポンス境界の漏洩防止について、既存実装・既存テスト・既存ドキュメントの自動検査カバレッジを棚卸しする。
- 非目的: runner/Worker全面置換、DB schema/migration/seed変更、auth/admin権限ロジック変更、UI変更。
- 前提: APIで提出コードを直接実行しない、hidden testsは内部専用、challengeはversion追加方式。

## 2. レビュー観点
1. learner-safe レスポンスに hidden 詳細が混入しないか。
2. internal artifact が admin/internal 境界でのみ扱われるか。
3. visible / hidden 出力分離と timeout / runtime failure 時の漏洩防止。
4. 既存 unit/integration で自動検査できている範囲と未検査範囲。

## 3. 実装レビュー結果（確認済み境界）
### 3.1 learner-safe / internal レスポンス境界
- `GET /api/submissions/:id` は呼び出しユーザーの role に応じて `result.logs` と `result.internal` の返却を分岐しており、admin以外には `logs/internal` を返さない。
- learner向けには `visibleTests` と `hiddenTests` 集計（passed/total/passedCount）のみ返却する構造になっている。

### 3.2 hidden tests 実行ログのマスキング
- Worker側の通常ランナーは `logs` に visible の実行出力のみを入れ、hidden 側は固定文言（詳細非公開）を保存している。
- isolation job runner 側でも hidden 実行ログは固定文言化され、artifact メタ情報は internal visibility 扱い。

### 3.3 admin/internal 境界
- `/api/admin/*` は `requireRole(..., 'admin')` でガードされており、非adminは 403/401 になる。
- challenge編集は `/versions` エンドポイントで version追加運用を維持し、既存version上書き前提の実装は見当たらない。

### 3.4 timeout / runtime failure の正規化
- container runtime PoC は host timeout で SIGTERM→3秒後SIGKILL を送る設計で、timeout系終了コード（124/137/143）を `timeout` に正規化している。
- runtime unavailable（ENOENT等）は `runtime unavailable` として失敗正規化している。

## 4. 自動検査で確認できている範囲
- integration: challenge一覧/詳細、submission作成/取得、`result.visibleTests` 配列と `result.hiddenTests.passed` 型を確認。
- unit: isolated job 失敗正規化（stdin EPIPE、spawn ENOENT、構造化失敗payload維持）を確認。
- unit: container runtime timeout時の SIGTERM/SIGKILL escalation と single resolve を確認。
- unit: `/api/admin/*` 認可境界・auth動作は既存テストで分離検証済み。

## 5. 未確認・不足している自動検査
1. **learnerロール/guestで `result.internal` が常に absent であることの明示テスト**
   - 現状は hidden summary の型確認が中心で、internalフィールド非露出の断言テストが弱い。
2. **timeout/runtime failure 時に learner-safe 返却へ hidden由来の詳細文字列が混入しないことの統合検査**
   - failure経路のテキストマスキングを API返却まで通したテストが不足。
3. **artifact境界の回帰テスト（admin/internalでのみ参照可能）**
   - artifact visibility は実装されているが、API返却境界の自動検査は未整備。
4. **ログ境界の自動検査（ADR-001段階導入の未完項目）**
   - hidden関連ログマスキング違反をCIで検知する仕組みが不足。

## 6. 結論
- 現行実装は learner-safe / internal 境界の基本要件を満たしている。
- 一方、漏洩防止の説明責任を高めるには「failure経路」「artifact境界」「ログ境界」の自動検査を追加する必要がある。
- 大きな実装変更は本Issueでは行わず、follow-up Issue へ分離する方針が妥当。
