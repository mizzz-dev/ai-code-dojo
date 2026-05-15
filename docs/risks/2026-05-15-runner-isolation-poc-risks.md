# Runner隔離実行PoC リスク台帳（Issue #48）

- 日付: 2026-05-15

| ID | 優先度 | リスク | 現状 | 対応 |
|---|---|---|---|---|
| POC-RI-01 | P0 | PoC経路で実runtime隔離が不十分 | network deny/rootfs制約が未適用 | follow-upでコンテナruntime設定を必須化 |
| POC-RI-02 | P1 | child process結果の正規化不足 | timeout以外の失敗理由が粗い | `runner-sdk` failure taxonomy へ統一 |
| POC-RI-03 | P1 | artifact運用未定 | whitelistのみ先行、保存戦略なし | 保存期間・監査・マスキングを別Issue化 |
| POC-RI-04 | P1 | feature flag誤設定で本番有効化 | local-only前提を明示、保護未自動 | CI/起動時ガードでproduction拒否を追加 |
