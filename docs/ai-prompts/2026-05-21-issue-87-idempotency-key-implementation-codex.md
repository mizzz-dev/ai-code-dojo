# 2026-05-21 Issue #87 AI Prompt Log（Codex）

- 指示: `docs/ai-protocol/PROMPT.txt` を最優先で遵守。
- 目的: attempt単位 idempotency key 相当の実装（重複投入・重複実行抑止）。
- 制約: completion guard 実装は混在させない。hidden tests / auth / UI / queue本格運用を変更しない。
- 実施方針:
  1. DBに attempt と idempotency key を保持できる最小拡張。
  2. 初回attempt=1の生成保存。
  3. retry時increment可能な関数追加（呼び出し統合は別Issueで段階導入可能）。
  4. Worker入力で attempt/key を受け、照合失敗時は実行しない。
