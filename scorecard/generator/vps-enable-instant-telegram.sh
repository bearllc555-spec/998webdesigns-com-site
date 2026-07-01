#!/usr/bin/env bash
# Enable instant scorecard_ready Telegram from the VPS worker.
# The worker POSTs to https://998webdesigns.com/api/scorecard/notify after each report.
#
# Run on the Hostinger box as root (same host as scorecard-api / scorecard-worker):
#   bash vps-enable-instant-telegram.sh YOUR_GENERATOR_API_KEY
#
# Key must match Cloudflare Worker GENERATOR_API_KEY
# (slatepress/.local/scorecard-generator-api-key.txt on your PC).
set -euo pipefail

ENV_FILE="${ENV_FILE:-/opt/scorecard/.env}"
KEY="${1:-${GENERATOR_API_KEY:-}}"

if [[ -z "$KEY" ]]; then
  echo "Usage: $0 <GENERATOR_API_KEY>" >&2
  echo "  Or:  GENERATOR_API_KEY=... $0" >&2
  exit 1
fi

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Missing $ENV_FILE — copy scorecard/generator/.env.example first." >&2
  exit 1
fi

set_kv() {
  local name="$1"
  local value="$2"
  if grep -q "^${name}=" "$ENV_FILE"; then
    sed -i "s|^${name}=.*|${name}=${value}|" "$ENV_FILE"
  else
    echo "${name}=${value}" >> "$ENV_FILE"
  fi
}

set_kv "GENERATOR_API_KEY" "$KEY"
set_kv "PUBLIC_BASE_URL" "https://998webdesigns.com"

echo "Updated $ENV_FILE:"
grep -E '^(GENERATOR_API_KEY|PUBLIC_BASE_URL)=' "$ENV_FILE" | sed 's/GENERATOR_API_KEY=.*/GENERATOR_API_KEY=***set***/'

if systemctl is-active --quiet scorecard-worker 2>/dev/null; then
  systemctl restart scorecard-worker scorecard-api
  echo "Restarted scorecard-worker + scorecard-api."
else
  echo "systemd units not running — start with: systemctl restart scorecard-worker scorecard-api"
fi

echo ""
echo "Smoke test (optional — needs a real report token + score):"
echo '  curl -s -X POST https://998webdesigns.com/api/scorecard/notify \'
echo '    -H "Content-Type: application/json" \'
echo "    -H \"x-generator-key: \$GENERATOR_API_KEY\" \\"
echo '    -d "{\"event\":\"ready\",\"token\":\"TOKEN\",\"domain\":\"example.com\",\"score\":50}"'
