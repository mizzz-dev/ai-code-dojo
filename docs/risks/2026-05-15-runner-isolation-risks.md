# Runner Isolation Risks Ledger（Issue #44）

- 日付: 2026-05-15
- 対象: Runner隔離実行基盤の設計方針

## リスク台帳

| ID | 優先度 | リスク | 影響 | 緩和策（設計） |
|---|---|---|---|---|
| RI-01 | P0 | 隔離境界不備（コンテナ設定ミス） | ホスト干渉、権限逸脱 | read-only rootfs / 非root / capability最小化 / network deny を標準化 |
| RI-02 | P0 | resource上限不足 | DoS、Worker枯渇、採点停止 | CPU/Memory/Process/Timeout の強制上限制御 |
| RI-03 | P1 | hidden関連ログ漏洩 | 学習者への内部情報露出 | learner-safe返却を集計のみ固定、internal artifact分離 |
| RI-04 | P1 | artifact肥大化・長期保持 | ストレージ圧迫、機密残留 | artifact whitelist、保持期限、admin監査 |
| RI-05 | P1 | queue再試行時の重複実行 | 状態競合、結果不整合 | submission単位の冪等キーと状態遷移ガード |
| RI-06 | P2 | 運用説明責任不足 | 商用/教育導入時の信頼低下 | ADR + runbookで制限値/障害対応を文書化 |

## 監視指標（導入推奨）
- timeout率、OOM率、強制kill率
- submissionあたりのartifactサイズ分布
- hidden関連ログマスキング違反件数
- 再試行時の重複実行検知件数
