# 2026-05-17 Issue #62 SIGKILL test flakiness 対応用プロンプト（Codex）

## 目的
SIGKILL escalation unit test の非決定性を抑え、低速CIでも品質ゲートが安定するようにする。

## 制約
- `docs/ai-protocol/PROMPT.txt` を最優先で遵守。
- 変更は最小差分。
- production logic は不要に変更しない。
- hidden tests 詳細を外部公開しない。

## 実装方針
- `runNodeTestsInContainer host timeout escalates to SIGKILL and resolves on close` テストの fallback close margin を拡大する。
- fallback timer をテスト完了時に明示的に解放し、不要ハンドル残留を防ぐ。

## 検証
- `pnpm -s test:unit` の成功確認。
