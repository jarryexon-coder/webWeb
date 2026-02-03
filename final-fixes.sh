#!/bin/bash
# final-fixes.sh

echo "🔧 Applying final fixes..."

# 1. Fix NFLAnalyticsScreen.tsx line 1289
echo "📄 Fixing NFLAnalyticsScreen.tsx line 1289..."
# Replace the whole line with just the function call
awk 'NR==1289 {print "        setStandings(standingsData);"; next} {print $0}' src/pages/NFLAnalyticsScreen.tsx > /tmp/nfl-final.tsx && mv /tmp/nfl-final.tsx src/pages/NFLAnalyticsScreen.tsx
echo "   ✅ Fixed line 1289"

# 2. Fix PrizePicksScreen.tsx imports (remove duplicate)
echo ""
echo "📄 Fixing PrizePicksScreen.tsx imports..."
# Remove the duplicate import line
awk 'NR==2 && /import.*useState.*useEffect.*from.*react/ {next} {print $0}' src/pages/PrizePicksScreen.tsx > /tmp/pp-imports.tsx && mv /tmp/pp-imports.tsx src/pages/PrizePicksScreen.tsx
echo "   ✅ Fixed imports"

# 3. Fix PrizePicksScreen.tsx line 1072
echo ""
echo "📄 Fixing PrizePicksScreen.tsx line 1072..."
# Replace with correct function call
awk 'NR==1072 {print "        setAnalytics(analyticsData);"; next} {print $0}' src/pages/PrizePicksScreen.tsx > /tmp/pp-final.tsx && mv /tmp/pp-final.tsx src/pages/PrizePicksScreen.tsx
echo "   ✅ Fixed line 1072"

# 4. Also check the actual fetch function in PrizePicksScreen.tsx
echo ""
echo "📄 Checking fetch function in PrizePicksScreen.tsx..."
# Look for the fetch function and make sure it uses the analytics state
if grep -q "fetchPrizePicksAnalytics" src/pages/PrizePicksScreen.tsx; then
    echo "   ✅ Fetch function exists"
    # Check if it's calling setAnalytics
    if grep -q "setAnalytics" src/pages/PrizePicksScreen.tsx; then
        echo "   ✅ setAnalytics is being called"
    else
        echo "   ⚠️  setAnalytics not found in fetch function"
    fi
fi

echo ""
echo "✅ Final fixes applied!"
echo ""
echo "🔍 Final verification:"
echo "=== NFLAnalyticsScreen.tsx line 1289 ==="
sed -n '1289p' src/pages/NFLAnalyticsScreen.tsx

echo ""
echo "=== PrizePicksScreen.tsx imports (first 3 lines) ==="
head -3 src/pages/PrizePicksScreen.tsx

echo ""
echo "=== PrizePicksScreen.tsx line 1072 ==="
sed -n '1072p' src/pages/PrizePicksScreen.tsx

echo ""
echo "=== Analytics state in PrizePicksScreen.tsx ==="
grep -n "const \[analytics, setAnalytics\]" src/pages/PrizePicksScreen.tsx

echo ""
echo "🚀 Ready to deploy!"
echo "Run: vercel --prod --yes"
echo ""
echo "📊 After deployment, run this test in browser console:"
cat > /tmp/final-test.js << 'EOF'
async function finalTest() {
  console.log('🎯 FINAL TEST - All 3 Endpoints');
  console.log('===============================\n');
  
  const baseUrl = 'https://pleasing-determination-production.up.railway.app';
  const endpoints = [
    { path: '/api/nfl/standings', name: 'NFL Standings' },
    { path: '/api/nhl/standings', name: 'NHL Standings' },
    { path: '/api/prizepicks/analytics', name: 'PrizePicks Analytics' }
  ];
  
  let allPassed = true;
  
  for (const endpoint of endpoints) {
    console.log(`🧪 ${endpoint.name}...`);
    try {
      const response = await fetch(baseUrl + endpoint.path);
      const data = await response.json();
      
      if (data.success) {
        const key = endpoint.path.includes('analytics') ? 'analytics' : 'standings';
        const isArray = Array.isArray(data[key]);
        
        if (isArray && data[key].length > 0) {
          console.log(`   ✅ WORKING - ${data[key].length} items in array`);
        } else if (isArray) {
          console.log(`   ⚠️  EMPTY - Array exists but has 0 items`);
          allPassed = false;
        } else {
          console.log(`   ❌ FAILED - ${key} is not an array`);
          console.log(`      Type: ${typeof data[key]}`);
          allPassed = false;
        }
      } else {
        console.log(`   ❌ FAILED - success: false`);
        allPassed = false;
      }
    } catch (error) {
      console.log(`   ❌ ERROR - ${error.message}`);
      allPassed = false;
    }
    console.log('');
  }
  
  if (allPassed) {
    console.log('🎉 ALL ENDPOINTS ARE NOW WORKING!');
    console.log('✅ Your frontend screens should display real data');
  } else {
    console.log('⚠️  Some endpoints still need fixing');
  }
}

finalTest();
EOF

echo "Copy and run the JavaScript test above"
echo ""
echo "💡 Also check browser console when loading:"
echo "   - NFLAnalyticsScreen.tsx for '📊 NFL Standings response:'"
echo "   - PrizePicksScreen.tsx for '📈 PrizePicks Analytics response:'"
