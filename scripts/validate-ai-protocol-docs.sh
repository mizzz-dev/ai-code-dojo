#!/usr/bin/env bash
set -euo pipefail
required=(
  docs/ai-protocol/README.md
  docs/ai-protocol/PROMPT.md
  docs/ai-protocol/ai-code-dojo-specific-policy.md
)
for file in "${required[@]}"; do
  [[ -f "$file" ]] || { echo "missing: $file"; exit 1; }
done
echo "ai-protocol docs ok"
