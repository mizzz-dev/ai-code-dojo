# AI Prompt Log: 2026-05-15 Issue #54 runtime constraints PoC（Codex）

## 目的
ADR-001 に基づく runtime 制約の実強制方針を、local-only / non-production 前提で検証・文書化する。

## 制約
- API本体で提出コードを直接実行しない。
- hidden tests は内部専用（学習者向け返却禁止）。
- 変更は最小差分。
- 本番適用はしない。

## 実施サマリ
- 方式比較、採用案/却下案、運用負荷、rollback を docs に記録。
- `docs/current-status.md` / `docs/active-issues.md` を Issue 状態へ同期。
