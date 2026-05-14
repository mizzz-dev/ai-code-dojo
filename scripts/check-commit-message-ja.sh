#!/usr/bin/env bash
set -euo pipefail
msg=${1:-}
if [[ -z "$msg" ]]; then
  echo "usage: $0 '<commit message>'" >&2
  exit 1
fi
echo "$msg" | rg -q '[ぁ-んァ-ン一-龥]'
