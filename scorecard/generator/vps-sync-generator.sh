#!/usr/bin/env bash
# Sync all scorecard generator Python modules to the VPS (not just service.py).
# design_intel.py is required for CRM "Design intelligence" (Awwwards + WebsiteRating).
#
# Run on VPS as root:
#   curl -fsSL -o /tmp/vps-sync-generator.sh \
#     "https://raw.githubusercontent.com/bearllc555-spec/998webdesigns-com-site/main/scorecard/generator/vps-sync-generator.sh"
#   bash /tmp/vps-sync-generator.sh
set -euo pipefail

DEST="${DEST:-/opt/scorecard/generator}"
BASE="${BASE:-https://raw.githubusercontent.com/bearllc555-spec/998webdesigns-com-site/main/scorecard/generator}"

FILES=(service.py design_intel.py scorer_core.py supabase_generator.py)

mkdir -p "$DEST"
for f in "${FILES[@]}"; do
  curl -fsSL -o "$DEST/$f" "$BASE/$f"
  echo "  synced $f"
done

if systemctl is-active --quiet scorecard-worker 2>/dev/null; then
  systemctl restart scorecard-worker scorecard-api
  echo "Restarted scorecard-worker + scorecard-api."
else
  echo "Start units: systemctl restart scorecard-worker scorecard-api"
fi

echo "Done. Worker will backfill missing internal_intel on idle (~10s). Or POST /fetch-intel per report."
