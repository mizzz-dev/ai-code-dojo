# 2026-05-17 Issue #62 handoff（SIGKILL escalation test flakiness）

## 実施概要
- 対象: `tests/unit/worker-isolation-poc.test.mjs`
- 変更: fallback close タイマー猶予を 9s→20s に拡大し、結果確定後に clear するよう調整。
- 目的: 低速/高負荷CIで fallback close が SIGKILL より先行する競合を抑制。

## 影響範囲
- テストコードのみ。
- production runtime ロジックへの変更なし。

## 検証結果
- `pnpm -s test:unit` 成功。

## ロールバック
- 当該テストの fallback close 周辺差分を revert すれば即時ロールバック可能。

## 未解決/フォローアップ候補
- 必要に応じて将来、fake timer または依存注入による完全イベント駆動化を検討（現時点は最小差分優先）。
