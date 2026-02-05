#!/bin/bash

echo "🧪 Testing Local API Integration..."

echo "1. Testing API health..."
curl -s http://localhost:5001/api/health | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    print(f'✅ API Status: {data.get(\"status\")}')
    print(f'📊 Players: {data.get(\"data_stats\", {}).get(\"players\", 0)}')
    print(f'🏀 Teams: {data.get(\"data_stats\", {}).get(\"teams\", 0)}')
except Exception as e:
    print(f'❌ Error: {e}')
"

echo -e "\n2. Testing players endpoint..."
curl -s "http://localhost:5001/api/players" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    print(f'✅ Players loaded: {data.get(\"count\", 0)}')
    if data.get('players'):
        print(f'👤 Sample: {data[\"players\"][0][\"name\"]}')
        print(f'💰 Salary: ${data[\"players\"][0].get(\"salary\", 0)}')
        print(f'⭐ Fantasy: {data[\"players\"][0].get(\"fantasyScore\", 0)}')
except Exception as e:
    print(f'❌ Error: {e}')
"

echo -e "\n3. Testing PrizePicks endpoint..."
curl -s "http://localhost:5001/api/prizepicks/selections?sport=nba" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    print(f'✅ PrizePicks selections: {data.get(\"count\", 0)}')
except Exception as e:
    print(f'❌ Error: {e}')
"

echo -e "\n4. Checking frontend .env file..."
if [ -f .env ]; then
    grep "VITE_API_BASE" .env
else
    echo "❌ No .env file found"
fi

echo -e "\n🎉 Local API test complete!"
