# Issue #41 作業ログ: Source of Truth 再整合

- 日付: 2026-05-14
- 対象Issue: #41
- 目的: docs上で誤って完了扱いされていた Issue #37 の意味付けを是正し、GitHub Issue 正本と一致させる。

## スコープ
- `docs/current-status.md` と `docs/active-issues.md` の是正。
- Runner安全性レビュー（Issue #37）を「未完了・再開対象」として再配置。

## 非スコープ
- runner / Worker / 採点ロジック / hidden tests 仕様の実装変更。
- auth / admin / DB schema / migration / seed の変更。

## 実施内容
1. current-status の「Issue #37完了」記述を撤回し、未完了の前提へ修正。
2. active-issues の進行中Issueに #37（Runner安全性レビュー）を再掲。
3. recently completed には #41（今回のdocs再整合）を記録。

## 確認結果
- docs変更のみで完結。
- hidden tests の詳細は追記していない。
- learner-safe / internal 境界説明を崩していない。
