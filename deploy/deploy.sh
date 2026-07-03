#!/bin/bash
set -euo pipefail

ROOT="/home/dosumart"
API_URL="https://api-mart.dosutech.site/api"

echo "==> Install dependencies"
cd "$ROOT"
corepack enable
pnpm install --frozen-lockfile

echo "==> Generate Prisma client"
pnpm db:generate

echo "==> Push DB schema"
pnpm db:push

echo "==> Seed (skip if already seeded)"
pnpm db:seed || true

echo "==> Build backend"
pnpm --filter @dosumart/backend build

echo "==> Build frontends"
VITE_API_URL="$API_URL" pnpm --filter @dosumart/storefront build
VITE_API_URL="$API_URL" pnpm --filter @dosumart/admin build
VITE_API_URL="$API_URL" pnpm --filter @dosumart/pos build

echo "==> Restart PM2"
mkdir -p "$ROOT/logs"
pm2 delete dosumart-api 2>/dev/null || true
pm2 start "$ROOT/ecosystem.config.cjs"
pm2 save

echo "==> Reload nginx"
cp "$ROOT/deploy/nginx/"*.conf /etc/nginx/sites-available/ 2>/dev/null || true
for f in mart.dosutech.site admin-mart.dosutech.site pos-mart.dosutech.site api-mart.dosutech.site; do
  ln -sf "/etc/nginx/sites-available/${f}.conf" "/etc/nginx/sites-enabled/${f}.conf" 2>/dev/null || true
done
nginx -t && systemctl reload nginx

echo "==> Done. API on :3086, static via nginx."
