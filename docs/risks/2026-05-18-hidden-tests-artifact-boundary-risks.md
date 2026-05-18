# 2026-05-18 hidden tests / internal artifact 境界リスク台帳（Issue #64）

| ID | 優先度 | リスク | 影響 | 低減策（現状/提案） |
|---|---|---|---|---|
| HT-64-01 | P1 | learner-safe 返却へ internal フィールドが混入する回帰 | hidden詳細や内部ログの漏洩 | `getSubmissionResult` の role分岐に対する否定系integration testを追加 |
| HT-64-02 | P1 | timeout/runtime failure 経路で hidden由来文字列が露出 | 失敗時のみ漏洩する検知困難な事故 | failure系fixtureを使ったAPI E2Eテストでマスキング不変条件を検証 |
| HT-64-03 | P2 | internal artifact 参照監査の不足 | 商用/教育利用で説明責任が不足 | artifact参照イベント監査ログを別Issueで設計（DB変更は後続） |
| HT-64-04 | P2 | ログ境界の自動検査不足（ADR未完） | hidden関連ログの運用逸脱をCIで検出できない | log-scan系CI checkを追加し、hidden詳細文字列パターンを検出 |
| HT-64-05 | P2 | runbook不足で障害一次切り分けが属人化 | インシデント時の復旧遅延 | learner-safe/internal境界の監査・切り分け手順をrunbook化 |

## 備考
- 本レビューでは hidden tests の実データは扱っていない。
- DB schema/migration 変更を伴う監査基盤整備は follow-up Issue で分離する。
