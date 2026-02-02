#!/bin/bash
# verify-navigation-fixes.sh

echo "🔍 Final Verification of Navigation Fixes"

echo ""
echo "📋 Checking all navigation paths:"

# Check Layout.tsx
echo "1. Layout.tsx navigation:"
grep -n "path:" src/layouts/Layout.tsx

echo ""
echo "2. HomeScreen.tsx navigation:"
grep -n "to=\|path:" src/pages/HomeScreen.tsx | grep -v "//"

echo ""
echo "3. App.tsx routes:"
grep -n "path=" src/App.tsx | grep -v "path=\"/\"" | head -10

echo ""
echo "4. Checking for any remaining hub references:"
REMAINING=$(grep -r "all-access\|super-stats\|ai-generators\|elite-tools" src/ --include="*.tsx" --include="*.ts" | grep -v "backup" | grep -v ".backup" | wc -l)
if [ "$REMAINING" -eq "0" ]; then
  echo "✅ No hub references found!"
else
  echo "⚠️  Found $REMAINING remaining hub references:"
  grep -r "all-access\|super-stats\|ai-generators\|elite-tools" src/ --include="*.tsx" --include="*.ts" | grep -v "backup" | grep -v ".backup"
fi

echo ""
echo "📊 Summary of new navigation structure:"
echo "• /live-games → LiveGamesScreen"
echo "• /fantasy-hub → FantasyHubScreen" 
echo "• /daily-picks → DailyPicksScreen"
echo "• /kalshi-predictions → KalshiPredictionsScreen"
echo "• Plus all other direct routes for NFL analytics, news desk, etc."

echo ""
echo "🚀 Ready to test and deploy!"
