# Runner Safety Risks Ledger（Issue #37）

- 日付: 2026-05-15
- 対象: Runner / Worker / submission / hidden tests / auth 境界

## リスク台帳

| ID | 優先度 | リスク | 影響 | 暫定対策 | 恒久対策候補 |
|---|---|---|---|---|---|
| RS-01 | P0 | 任意コード実行の隔離不足 | ホスト干渉、権限逸脱、DoS | 実行ノード分離・最小権限 | container/job分離 + resource/network制限 |
| RS-02 | P0 | resource policy不足（メモリ/プロセス/I/O） | Worker不安定化、採点停止 | 同時実行数制御、監視強化 | cgroup等による強制上限制御 |
| RS-03 | P1 | ジョブ再試行の冪等性未定義 | 二重採点、状態競合 | 手動再実行ルール | 排他ロック、冪等キー、状態遷移制約 |
| RS-04 | P1 | durable queue不在 | 障害時のジョブ取りこぼし | queued滞留監視・手動復旧 | Redis/SQS等の永続キュー化 |
| RS-05 | P1 | 例外ログ由来の情報露出 | internal情報の過露出 | 定型エラーメッセージ化 | 構造化ログ + 自動マスキング |
| RS-06 | P2 | SQLite運用の将来限界 | 同時実行/運用監査の制約 | 運用監視ルール整備 | RDB段階移行 |

## 監視指標（次段階で導入推奨）
- `queued` 滞留時間の分布（p50/p95）
- `running` から `completed/failed` までの遷移失敗率
- timeout発生率・強制終了率
- submission再実行率（重複ジョブ検知）
- admin/internalログ参照イベント監査
