#!/bin/bash
# precise-fixes.sh

echo "🔧 Applying precise fixes..."

# 1. Fix NFLAnalyticsScreen.tsx line 1289
echo "📄 Uncommenting setStandings on line 1289 in NFLAnalyticsScreen.tsx..."
awk 'NR==1289 {gsub(/\/\/ /, ""); print $0; next} {print $0}' src/pages/NFLAnalyticsScreen.tsx > /tmp/nfl-fixed.tsx && mv /tmp/nfl-fixed.tsx src/pages/NFLAnalyticsScreen.tsx
echo "   Line 1289 now:"
sed -n '1289p' src/pages/NFLAnalyticsScreen.tsx

# 2. Fix PrizePicksScreen.tsx imports
echo ""
echo "📄 Fixing PrizePicksScreen.tsx imports..."
# Change from: import * as React from 'react';
# To: import React, { useState, useEffect } from 'react';
sed -i '' 's/import \* as React from '\''react'\'';/import React, { useState, useEffect } from '\''react'\'';/' src/pages/PrizePicksScreen.tsx
echo "   Import line updated"

# 3. Add analytics state to PrizePicksScreen.tsx
echo ""
echo "📄 Adding analytics state to PrizePicksScreen.tsx..."
# Find the component function and add state after it
if ! grep -q "const \[analytics, setAnalytics\]" src/pages/PrizePicksScreen.tsx; then
    # Look for: const PrizePicksScreen = () => {
    awk '/const PrizePicksScreen.*=.*() => {/ {print $0; print "  const [analytics, setAnalytics] = useState([]);"; next} {print $0}' src/pages/PrizePicksScreen.tsx > /tmp/pp-fixed.tsx && mv /tmp/pp-fixed.tsx src/pages/PrizePicksScreen.tsx
    echo "   Added analytics state"
else
    echo "   Analytics state already exists"
fi

# 4. Uncomment setAnalytics on line 1072
echo ""
echo "📄 Uncommenting setAnalytics on line 1072 in PrizePicksScreen.tsx..."
awk 'NR==1072 {gsub(/\/\/ /, ""); print $0; next} {print $0}' src/pages/PrizePicksScreen.tsx > /tmp/pp-fixed2.tsx && mv /tmp/pp-fixed2.tsx src/pages/PrizePicksScreen.tsx
echo "   Line 1072 now:"
sed -n '1072p' src/pages/PrizePicksScreen.tsx

echo ""
echo "✅ Precise fixes applied!"
echo ""
echo "📋 Verification:"
echo "=== NFLAnalyticsScreen.tsx ==="
echo "Line 1289 (should NOT start with //):"
sed -n '1289p' src/pages/NFLAnalyticsScreen.tsx

echo ""
echo "=== PrizePicksScreen.tsx ==="
echo "Import (should have useState, useEffect):"
head -5 src/pages/PrizePicksScreen.tsx
echo ""
echo "Analytics state exists:"
grep -n "const \[analytics, setAnalytics\]" src/pages/PrizePicksScreen.tsx
echo ""
echo "Line 1072 (should NOT start with //):"
sed -n '1072p' src/pages/PrizePicksScreen.tsx
