# Risks: 2026-05-15 runtime constraints PoC（Issue #54）

## 主要リスク
1. **ローカル環境差異**
   - Docker Desktop / Linux daemon 差で挙動差が出る可能性。
2. **誤設定による制約不全**
   - `--read-only` や `--network none` の付け漏れでPoC意図を満たさない。
3. **timeout境界の競合**
   - プロセス終了イベントとkill処理の競合で二重完了リスク。
4. **ログ過多/秘匿境界逸脱**
   - internal ログに不要詳細を残すと運用監査が難化。

## 低減策
- 実行オプションを1箇所で組み立て、レビュー可能にする。
- timeout制御を `resolveOnce` 相当で単一完了に統一。
- learner-safe 出力は集計のみ、internal artifact は最小情報に限定。
- feature flag で段階導入し、問題時は即rollback。

## 残課題
- OOM/kill reason の分類粒度（exit code/signal 正規化）の標準化。
- 実環境監視（メトリクス/監査ログ）設計は別Issueで整理。
