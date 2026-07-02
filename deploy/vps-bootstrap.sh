#!/bin/bash
set -euo pipefail

echo "==> Restart PostgreSQL to clear connection pool"
systemctl restart postgresql
sleep 2

if ! sudo -u postgres psql -tc "SELECT 1 FROM pg_database WHERE datname='dosumart'" | grep -q 1; then
  sudo -u postgres createdb dosumart
  echo "Created database dosumart"
else
  echo "Database dosumart already exists"
fi

chmod +x /home/dosumart/deploy/deploy.sh /home/dosumart/deploy/setup-nginx-ssl.sh
bash /home/dosumart/deploy/deploy.sh
