#!/usr/bin/env bash
# =============================================================================
# setup-webhook.sh — Install & activate forbasi-webhook on the VPS
#
# Run ONCE from local machine:
#   bash deploy/setup-webhook.sh
#
# Requirements: ssh access to root@72.61.140.193
# =============================================================================

set -euo pipefail

VPS="root@72.61.140.193"
WEBHOOK_FILE="$(dirname "$0")/webhook-server.js"
NGINX_CONF="$(dirname "$0")/nginx-forbasi.conf"

# ---------------------------------------------------------------------------
# 1. Prompt for webhook secret (never hardcode in version control)
# ---------------------------------------------------------------------------
if [[ -z "${WEBHOOK_SECRET:-}" ]]; then
  read -rsp "Enter WEBHOOK_SECRET (will be set as PM2 env var): " WEBHOOK_SECRET
  echo
fi

if [[ -z "$WEBHOOK_SECRET" ]]; then
  echo "ERROR: WEBHOOK_SECRET cannot be empty." >&2
  exit 1
fi

echo "==> Copying webhook-server.js to VPS..."
scp "$WEBHOOK_FILE" "$VPS:/var/www/webhook-server.js"

echo "==> Copying nginx config to VPS..."
scp "$NGINX_CONF" "$VPS:/etc/nginx/sites-available/forbasi"

echo "==> Configuring and starting webhook service on VPS..."
ssh "$VPS" bash -s <<EOF
set -euo pipefail

# Stop existing instance if any
pm2 delete forbasi-webhook 2>/dev/null || true

# Start with secret injected as env var
WEBHOOK_SECRET="$WEBHOOK_SECRET" \\
WEBHOOK_BRANCH="main" \\
pm2 start /var/www/webhook-server.js \\
  --name forbasi-webhook \\
  --env WEBHOOK_SECRET="$WEBHOOK_SECRET" \\
  --env WEBHOOK_BRANCH="main"

pm2 save

# Persist env in PM2 ecosystem (so it survives pm2 resurrect)
pm2 set forbasi-webhook:env:WEBHOOK_SECRET "$WEBHOOK_SECRET"

# Validate and reload nginx
nginx -t && systemctl reload nginx

echo ""
echo "==> Webhook service status:"
pm2 show forbasi-webhook | grep -E 'status|pid|uptime'

echo ""
echo "==> Health check:"
curl -sf http://127.0.0.1:9000/webhook/ping && echo " OK" || echo " FAILED (service may still be starting)"
EOF

echo ""
echo "==================================================="
echo " Webhook installed successfully!"
echo ""
echo " GitHub Webhook settings:"
echo "   Payload URL : https://forbasi.or.id/webhook"
echo "   Content type: application/json"
echo "   Secret      : (the value you just entered)"
echo "   Events      : Just the push event"
echo "==================================================="
