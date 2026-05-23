#!/bin/sh
# App3R Frontend Docker Entrypoint
# Starts all 5 Next.js apps in parallel on their respective ports

set -e

echo "Starting App3R Frontend Apps..."
echo "  Admin   -> http://localhost:3000"
echo "  WeeeR   -> http://localhost:3001"
echo "  WeeeU   -> http://localhost:3002"
echo "  WeeeT   -> http://localhost:3003"
echo "  Website -> http://localhost:3004"
echo ""

# Start all 5 apps in background
(cd /app/apps/admin  && node_modules/.bin/next start --port 3000) &
(cd /app/apps/weeer  && node_modules/.bin/next start --port 3001) &
(cd /app/apps/weeeu  && node_modules/.bin/next start --port 3002) &
(cd /app/apps/weeet  && node_modules/.bin/next start --port 3003) &
(cd /app/apps/app3r  && node_modules/.bin/next start --port 3004) &

# Wait for all background processes
wait
