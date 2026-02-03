#!/bin/bash
# fix-sed-compatibility.sh

echo "🔧 Checking current frontend state with compatible commands..."
echo ""

# Use a different approach that works on macOS sed
echo "=== NFLAnalyticsScreen.tsx Current State ==="
echo "1. React imports:"
grep "import.*React" src/pages/NFLAnalyticsScreen.tsx | head -2

echo ""
echo "2. State variables:"
grep -n "const \[.*, set.*\] = useState" src/pages/NFLAnalyticsScreen.tsx

echo ""
echo "3. API fetch calls:"
grep -n "fetch.*nfl.*standings" src/pages/NFLAnalyticsScreen.tsx

echo ""
echo "4. setStandings call (check if commented):"
grep -n "setStandings" src/pages/NFLAnalyticsScreen.tsx

echo ""
echo "=== PrizePicksScreen.tsx Current State ==="
echo "1. React imports:"
grep "import.*React" src/pages/PrizePicksScreen.tsx | head -2

echo ""
echo "2. State variables:"
grep -n "const \[.*, set.*\] = useState" src/pages/PrizePicksScreen.tsx

echo ""
echo "3. API fetch calls:"
grep -n "fetch.*prizepicks.*analytics" src/pages/PrizePicksScreen.tsx

echo ""
echo "4. setAnalytics call (check if commented):"
grep -n "setAnalytics" src/pages/PrizePicksScreen.tsx

echo ""
echo "🔧 Now let's fix manually..."
echo ""

# Create manual fixes using a different approach
cat > /tmp/fix-nfl.jsx << 'EOF'
// Manual fix for NFLAnalyticsScreen.tsx

// 1. Check and fix imports at the top of the file
// Look for: import React from 'react';
// Change to: import React, { useState, useEffect } from 'react';

// 2. Add state inside component (after component declaration):
// const [standings, setStandings] = useState([]);

// 3. Find the fetchNFLStandings function and uncomment:
// Change: // setStandings(standingsData);
// To: setStandings(standingsData);
EOF

cat > /tmp/fix-prizepicks.jsx << 'EOF'
// Manual fix for PrizePicksScreen.tsx

// 1. Check and fix imports at the top of the file
// Look for: import React from 'react';
// Change to: import React, { useState, useEffect } from 'react';

// 2. Add state inside component (after component declaration):
// const [analytics, setAnalytics] = useState([]);

// 3. Find the fetchPrizePicksAnalytics function and uncomment:
// Change: // setAnalytics(analyticsData);
// To: setAnalytics(analyticsData);
EOF

echo "📝 Manual fix instructions created."
echo ""
echo "🚀 Let me create a better fix script using awk (works on macOS):"

# Create a macOS-compatible fix script
cat > fix-frontend-macos.sh << 'EOF'
#!/bin/bash
# macOS-compatible frontend fix

echo "🛠️  macOS-compatible frontend fix..."

# Function to fix a file
fix_file() {
    local file="$1"
    local component_name="$2"
    local state_name="$3"
    local setter_name="$4"
    
    echo ""
    echo "📄 Fixing $file..."
    
    # Backup original
    cp "$file" "${file}.backup-$(date +%Y%m%d-%H%M%S)"
    
    # 1. Fix imports using awk (macOS compatible)
    if ! grep -q "import.*useState.*useEffect" "$file"; then
        echo "   Adding useState and useEffect imports..."
        awk '
        /import React from .react.;/ {
            print "import React, { useState, useEffect } from '\''react'\'';"
            next
        }
        /import React,/ {
            if (!/useState/ && !/useEffect/) {
                gsub(/\);/, ", useState, useEffect });")
            }
            print $0
            next
        }
        { print $0 }
        ' "$file" > "${file}.tmp" && mv "${file}.tmp" "$file"
    fi
    
    # 2. Add state variable if not exists
    if ! grep -q "const \[$state_name, $setter_name\]" "$file"; then
        echo "   Adding $state_name state..."
        # Find component function and add state after it
        awk -v state="const [$state_name, $setter_name] = useState([]);" '
        /const '"$component_name"'.*=.*() => {/ {
            print $0
            print "  " state
            next
        }
        { print $0 }
        ' "$file" > "${file}.tmp" && mv "${file}.tmp" "$file"
    fi
    
    # 3. Uncomment setState call
    echo "   Uncommenting $setter_name call..."
    awk -v setter="$setter_name" '
    /\/\/.*setter.*\(.*Data\)/ {
        gsub(/\/\/ /, "")
        print $0
        next
    }
    /\/\/.*setter.*\(.*\)/ {
        gsub(/\/\/ /, "")
        print $0
        next
    }
    { print $0 }
    ' "$file" > "${file}.tmp" && mv "${file}.tmp" "$file"
    
    echo "   ✅ Done fixing $file"
}

# Fix NFLAnalyticsScreen
fix_file "src/pages/NFLAnalyticsScreen.tsx" "NFLAnalyticsScreen" "standings" "setStandings"

# Fix PrizePicksScreen  
fix_file "src/pages/PrizePicksScreen.tsx" "PrizePicksScreen" "analytics" "setAnalytics"

echo ""
echo "✅ Fix script created: fix-frontend-macos.sh"
echo "Run: chmod +x fix-frontend-macos.sh && ./fix-frontend-macos.sh"
EOF

chmod +x fix-frontend-macos.sh

echo ""
echo "🎯 QUICK MANUAL FIX OPTION:"
echo "==========================="
echo ""
echo "For NFLAnalyticsScreen.tsx:"
echo "1. Open the file and check line 1. If it says:"
echo "   'import React from \"react\";'"
echo "   Change to: 'import React, { useState, useEffect } from \"react\";'"
echo ""
echo "2. Find the component function (around line where it says:"
echo "   'const NFLAnalyticsScreen = () => {'"
echo "   Add on the next line:"
echo "   '  const [standings, setStandings] = useState([]);'"
echo ""
echo "3. Find where it says '// setStandings(standingsData);'"
echo "   Remove the '// ' to uncomment it"
echo ""
echo "For PrizePicksScreen.tsx:"
echo "1. Same import fix"
echo "2. Add: 'const [analytics, setAnalytics] = useState([]);' after component"
echo "3. Uncomment: '// setAnalytics(analyticsData);'"
echo ""
echo "🔧 Or run the automated fix: ./fix-frontend-macos.sh"
echo ""
echo "📊 After fixing, deploy and test with:"
cat > /tmp/deploy-and-test.sh << 'EOF'
#!/bin/bash
echo "🚀 Deploying frontend..."
vercel --prod --yes

echo ""
echo "🧪 Testing endpoints (run in browser console):"
cat << 'TESTCODE'
async function testFixedEndpoints() {
  const endpoints = [
    '/api/nfl/standings',
    '/api/nhl/standings', 
    '/api/prizepicks/analytics'
  ];
  
  for (const endpoint of endpoints) {
    try {
      const response = await fetch('https://pleasing-determination-production.up.railway.app' + endpoint);
      const data = await response.json();
      console.log(`✅ ${endpoint}:`, data.success ? 'Success' : 'Failed');
      console.log(`   Data type:`, Array.isArray(data.standings || data.analytics) ? 'ARRAY ✅' : 'OBJECT ❌');
    } catch (error) {
      console.log(`❌ ${endpoint}:`, error.message);
    }
  }
}
testFixedEndpoints();
TESTCODE
EOF

chmod +x /tmp/deploy-and-test.sh
echo "Run: /tmp/deploy-and-test.sh"
