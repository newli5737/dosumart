#!/bin/bash
# Chạy trên VPS lần đầu sau khi clone repo
set -euo pipefail

echo "==> Copy nginx configs"
cp /home/dosumart/deploy/nginx/*.conf /etc/nginx/sites-available/
for f in mart.dosutech.site admin-mart.dosutech.site pos-mart.dosutech.site api-mart.dosutech.site; do
  ln -sf "/etc/nginx/sites-available/${f}.conf" "/etc/nginx/sites-enabled/${f}.conf"
done
nginx -t && systemctl reload nginx

echo "==> Certbot SSL"
certbot --nginx \
  -d mart.dosutech.site \
  -d admin-mart.dosutech.site \
  -d pos-mart.dosutech.site \
  -d api-mart.dosutech.site \
  --non-interactive --agree-tos -m admin@dosutech.site || true

echo "==> SSL done"
