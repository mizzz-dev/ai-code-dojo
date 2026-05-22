# 2026-05-22 Issue #91 completion guard（Codex実行プロンプト記録）

- 最優先ルールとして `docs/ai-protocol/PROMPT.txt` を遵守。
- 対象Issue: #91 completion guard 実装。
- 要件:
  - 同一 submission の終端保存を一度だけ成功させる。
  - 後続の終端保存は idempotent に無害化。
  - attempt単位 idempotency key とは責務分離。
  - hidden tests の露出禁止、API直接実行禁止、不必要な仕様変更禁止。
- 変更範囲:
  - API repository / worker / 必要最小限のDB migration / completion guard テスト / 運用docs。
