# Test your backend health
curl https://pleasing-determination-production.up.railway.app/api/health

# Test all endpoints (save this as test_backend.sh)
#!/bin/bash
BASE_URL="https://pleasing-determination-production.up.railway.app"

echo "Testing all endpoints..."
echo "========================"

endpoints=(
  "/api/health"
  "/api/fantasy/players?sport=nba"
  "/api/fantasy/teams?sport=nba"
  "/api/prizepicks/selections?sport=nba"
  "/api/analytics"
  "/api/sports-wire?sport=nba"
  "/api/picks"
  "/api/predictions"
  "/api/trends"
  "/api/history"
  "/api/player-props?sport=nba"
  "/api/odds/games?sport=basketball_nba"
  "/api/parlay/suggestions"
)

for endpoint in "${endpoints[@]}"; do
  echo -n "Testing $endpoint ... "
  status=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL$endpoint")
  if [ "$status" -eq 200 ]; then
    echo "✅ OK"
  else
    echo "❌ Failed ($status)"
  fi
done
