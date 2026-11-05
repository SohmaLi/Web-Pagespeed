#!/usr/bin/env bash
# One PageSpeed Insights API run, saved as JSON. The API key is read from shared/.env
# (PAGESPEED_API_KEY=…) into a variable and never printed. PSI_ENV overrides the file.
# Usage: psi-api.sh <url> <out.json> <mobile|desktop>
set -u
URL="${1:?url}"; OUT="${2:?out.json}"; DEV="${3:-mobile}"
ENV_FILE="${PSI_ENV:-$(cd "$(dirname "$0")/.." && pwd)/.env}"
K=$(awk -F= '/^[[:space:]]*PAGESPEED_API_KEY[[:space:]]*=/ {sub(/^[^=]*=/,""); gsub(/[[:space:]"\x27]/,""); print; exit}' "$ENV_FILE" 2>/dev/null)
if [ -z "$K" ]; then echo "no PAGESPEED_API_KEY in $ENV_FILE" >&2; exit 2; fi
mkdir -p "$(dirname "$OUT")"
curl -s --max-time 180 -G "https://www.googleapis.com/pagespeedonline/v5/runPagespeed" \
  --data-urlencode "url=$URL" --data-urlencode "strategy=$DEV" \
  --data-urlencode "category=performance" --data-urlencode "key=$K" -o "$OUT"
