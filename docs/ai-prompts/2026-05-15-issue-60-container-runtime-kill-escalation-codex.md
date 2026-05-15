# AI Prompt 実行記録（Issue #60）

## 目的
host timeout 時に failed result へ正規化しつつ、SIGKILL escalation が必ず実行可能な kill policy に修正する。

## 実施方針
- `finalize` を host timeout 直後に呼ばない。
- timeout後は `SIGTERM -> 3s -> SIGKILL` を確実に実行可能にする。
- `close` / `error` / timeout 競合時の二重 resolve を `settled` で抑止する。
- hidden tests 情報を learner-safe 境界外へ出さない。

## 非対象
- 本番適用
- DB schema / migration / seed 変更
- auth/admin/UI 変更
