#!/bin/bash
# complete-frontend-setup.sh

echo "🔧 Completing frontend API setup..."
echo ""

# 1. Add state variables and fix imports for NFLAnalyticsScreen.tsx
echo "📄 Setting up NFLAnalyticsScreen.tsx..."

# Check if useState is imported
if ! grep -q "import.*useState" src/pages/NFLAnalyticsScreen.tsx; then
    echo "   Adding useState import..."
    sed -i 's/import React/import React, { useState }/' src/pages/NFLAnalyticsScreen.tsx
fi

# Check if useEffect is imported
if ! grep -q "import.*useEffect" src/pages/NFLAnalyticsScreen.tsx; then
    echo "   Adding useEffect import..."
    sed -i 's/import React/import React, { useEffect }/' src/pages/NFLAnalyticsScreen.tsx
fi

# Add state variable if not exists
if ! grep -q "const \[standings, setStandings\]" src/pages/NFLAnalyticsScreen.tsx; then
    echo "   Adding standings state..."
    # Find a good place to add state (after component declaration)
    if grep -q "const NFLAnalyticsScreen.*=.*() => {" src/pages/NFLAnalyticsScreen.tsx; then
        sed -i '/const NFLAnalyticsScreen.*=.*() => {/a\
  const [standings, setStandings] = useState([]);' src/pages/NFLAnalyticsScreen.tsx
    else
        # Try to find the component function
        sed -i '0,/const.*=.*() => {/!b; /const.*=.*() => {/a\
  const [standings, setStandings] = useState([]);' src/pages/NFLAnalyticsScreen.tsx
    fi
fi

# Uncomment setStandings call
echo "   Uncommenting setStandings call..."
sed -i 's/\/\/ setStandings(standingsData);/setStandings(standingsData);/' src/pages/NFLAnalyticsScreen.tsx

# 2. Add state variables and fix imports for PrizePicksScreen.tsx
echo ""
echo "📄 Setting up PrizePicksScreen.tsx..."

# Check if useState is imported
if ! grep -q "import.*useState" src/pages/PrizePicksScreen.tsx; then
    echo "   Adding useState import..."
    sed -i 's/import React/import React, { useState }/' src/pages/PrizePicksScreen.tsx
fi

# Check if useEffect is imported
if ! grep -q "import.*useEffect" src/pages/PrizePicksScreen.tsx; then
    echo "   Adding useEffect import..."
    sed -i 's/import React/import React, { useEffect }/' src/pages/PrizePicksScreen.tsx
fi

# Add state variable if not exists
if ! grep -q "const \[analytics, setAnalytics\]" src/pages/PrizePicksScreen.tsx; then
    echo "   Adding analytics state..."
    # Find a good place to add state (after component declaration)
    if grep -q "const PrizePicksScreen.*=.*() => {" src/pages/PrizePicksScreen.tsx; then
        sed -i '/const PrizePicksScreen.*=.*() => {/a\
  const [analytics, setAnalytics] = useState([]);' src/pages/PrizePicksScreen.tsx
    else
        # Try to find the component function
        sed -i '0,/const.*=.*() => {/!b; /const.*=.*() => {/a\
  const [analytics, setAnalytics] = useState([]);' src/pages/PrizePicksScreen.tsx
    fi
fi

# Uncomment setAnalytics call
echo "   Uncommenting setAnalytics call..."
sed -i 's/\/\/ setAnalytics(analyticsData);/setAnalytics(analyticsData);/' src/pages/PrizePicksScreen.tsx

echo ""
echo "✅ Frontend setup complete!"
echo ""
echo "📋 Verification steps:"
echo "   1. Check NFLAnalyticsScreen.tsx has:"
echo "      - import React, { useState, useEffect } from 'react';"
echo "      - const [standings, setStandings] = useState([]);"
echo "      - setStandings(standingsData); (not commented)"
echo ""
echo "   2. Check PrizePicksScreen.tsx has:"
echo "      - import React, { useState, useEffect } from 'react';"
echo "      - const [analytics, setAnalytics] = useState([]);"
echo "      - setAnalytics(analyticsData); (not commented)"
echo ""
echo "🚀 Quick verification script:"
cat > /tmp/verify-setup.sh << 'EOF'
#!/bin/bash
echo "🔍 Verifying frontend setup..."

echo "=== NFLAnalyticsScreen.tsx ==="
grep -n "import.*useState\|import.*useEffect" src/pages/NFLAnalyticsScreen.tsx
grep -n "const \[standings, setStandings\]" src/pages/NFLAnalyticsScreen.tsx
grep -n "setStandings(standingsData)" src/pages/NFLAnalyticsScreen.tsx

echo ""
echo "=== PrizePicksScreen.tsx ==="
grep -n "import.*useState\|import.*useEffect" src/pages/PrizePicksScreen.tsx
grep -n "const \[analytics, setAnalytics\]" src/pages/PrizePicksScreen.tsx
grep -n "setAnalytics(analyticsData)" src/pages/PrizePicksScreen.tsx

echo ""
echo "=== API Endpoints in use ==="
grep -n "fetch.*nfl.*standings" src/pages/NFLAnalyticsScreen.tsx
grep -n "fetch.*prizepicks.*analytics" src/pages/PrizePicksScreen.tsx
EOF

chmod +x /tmp/verify-setup.sh
echo "Run: /tmp/verify-setup.sh"
echo ""
echo "🎯 Next steps after verification:"
echo "   1. Deploy frontend: vercel --prod --yes"
echo "   2. Test endpoint conversion in backend"
echo "   3. Run your endpoint test to see if all 3 endpoints now work"
echo ""
echo "📝 Backend middleware test (run this in browser console after backend deploys):"
cat > /tmp/test-converted-endpoints.js << 'EOF'
async function testConvertedEndpoints() {
  console.log('🧪 Testing endpoints after middleware conversion');
  console.log('================================================\n');
  
  const endpoints = [
    { url: '/api/nfl/standings', name: 'NFL Standings', key: 'standings' },
    { url: '/api/nhl/standings', name: 'NHL Standings', key: 'standings' },
    { url: '/api/prizepicks/analytics', name: 'PrizePicks Analytics', key: 'analytics' }
  ];
  
  for (const endpoint of endpoints) {
    console.log(`Testing ${endpoint.name}...`);
    try {
      const response = await fetch(`https://pleasing-determination-production.up.railway.app${endpoint.url}`);
      const data = await response.json();
      
      console.log(`  ✅ Status: ${response.status}`);
      console.log(`  ✅ Success: ${data.success}`);
      
      const targetData = data[endpoint.key];
      if (Array.isArray(targetData)) {
        console.log(`  ✅ ${endpoint.key} is ARRAY with ${targetData.length} items`);
        if (targetData.length > 0) {
          console.log(`  ✅ First item:`, targetData[0]);
        }
      } else {
        console.log(`  ❌ ${endpoint.key} is NOT array (type: ${typeof targetData})`);
        console.log(`  ❌ Keys:`, targetData ? Object.keys(targetData) : 'null');
      }
      
    } catch (error) {
      console.log(`  ❌ Error: ${error.message}`);
    }
    console.log('');
  }
}

testConvertedEndpoints();
EOF

echo "Copy and run the JavaScript test in browser console"
echo ""
echo "🌐 Deploy backend after adding middleware:"
echo "   git add ."
echo "   git commit -m 'Add response converter middleware'"
echo "   git push"
echo "   # Wait for Railway to auto-deploy"
