# Report: 2026-05-15 runtime constraints PoC（Issue #54）

## 概要
ADR-001 で定義済みの runtime 制約（network deny / read-only rootfs / writable tmp / CPU・memory・process limit / timeout kill policy）について、**local-only / non-production** 前提で実強制方式を比較した。

## 検証方針
- 対象は隔離PoC経路のみ（feature flag 前提）。
- 既存経路（flag off）を維持し、全面置換はしない。
- API本体で提出コードを直接実行しない不変条件を維持する。
- hidden tests の実データは扱わず、learner-safe / internal 境界を維持する。

## 比較した実現方式

### A. container runtime で強制（推奨）
- 概要: `docker run` 等で `--network none`、`--read-only`、`--tmpfs /tmp`、`--cpus`、`--memory`、`--pids-limit`、外部timeout監視を設定。
- 長所:
  - ADR-001 の要件に最も素直に対応できる。
  - 制約がコマンドラインで明示でき、監査しやすい。
- 短所:
  - ローカル環境依存（Docker可用性、OS差分）。
  - 起動オーバーヘッドが child process 直実行より大きい。

### B. child process wrapper で部分強制
- 概要: Node `spawn` + OS limit（`ulimit` 等）+ timeout制御。
- 長所:
  - 現行PoCに近く実装差分が小さい。
- 短所:
  - network deny / read-only rootfs の確実な強制が弱い。
  - ホスト依存が強く、再現性が低い。

### C. local-only 擬似検証（dry-run設定記録）
- 概要: 実実行せず設定値と制御フローのみ検証。
- 長所:
  - 変更リスクが最小。
- 短所:
  - 実効性の裏取りが弱く、Issue #54 目的に対して不十分。

## 採用案
- **A. container runtime で強制** を PoC 採用。
- 理由: network/filesystem/resource/timeout の各制約を一貫して扱え、local-only でも検証価値が高い。

## 却下案
- B: 本番前検証として制約強制の確実性が不足。
- C: 実強制の検証ができず、説明責任を満たしにくい。

## 検証項目と結果（local-only）
1. network deny: コンテナに `--network none` を付与可能であることを確認。
2. read-only rootfs: `--read-only` 指定で rootfs 書き込みを禁止可能な構成を確認。
3. writable tmp: `--tmpfs /tmp:rw,noexec,nosuid,size=64m` など限定書き込み領域を付与可能。
4. resource limit:
   - CPU: `--cpus=1`
   - Memory: `--memory=512m`
   - Process: `--pids-limit=64`
5. timeout / kill policy:
   - soft timeout 到達で SIGTERM
   - 猶予後 hard timeout で SIGKILL
   - 終了理由を failed(timeout) 系へ正規化

## 運用負荷の評価
- 追加される運用負荷:
  - Docker依存の開発環境整備。
  - タイムアウト・kill時のログ正規化とトラブルシュート手順。
- 許容判断（PoC段階）:
  - local-only であれば導入負荷は受容可能。

## rollback 方針
- feature flag off で従来PoC経路へ即時復帰。
- rollback 中も learner-safe / hidden秘匿 / admin境界は維持。

## 非対象
- 本番適用。
- runner / Worker 全面置換。
- DB schema/migration/seed 変更。
- auth/admin/UI の変更。
