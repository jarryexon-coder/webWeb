#!/bin/bash
# fix-prizepicks-syntax.sh

echo "🔧 Fixing PrizePicksScreen.tsx syntax error..."

# Remove the invalid line 1071
awk 'NR!=1071' src/pages/PrizePicksScreen.tsx > /tmp/prizepicks-fixed.tsx && mv /tmp/prizepicks-fixed.tsx src/pages/PrizePicksScreen.tsx

echo "✅ Removed invalid line 1071"

# Verify the fix
echo ""
echo "🔍 Checking lines 1065-1075 now:"
sed -n '1065,1075p' src/pages/PrizePicksScreen.tsx

echo ""
echo "🚀 Also check the fetch function is complete..."
# Check if the fetch function is properly closed
echo "Lines around fetchPrizePicksAnalytics function:"
grep -n "fetchPrizePicksAnalytics" src/pages/PrizePicksScreen.tsx
grep -n "fetch.*analytics" src/pages/PrizePicksScreen.tsx -A5 -B5 | tail -20

echo ""
echo "📋 Quick syntax check:"
# Check for common syntax issues
echo "1. Check for unclosed strings..."
grep -n "\"" src/pages/PrizePicksScreen.tsx | grep -v "console.log\|import\|from" | head -10

echo ""
echo "2. Check for proper function closure..."
# Count braces after fetch function
start_line=$(grep -n "const fetchPrizePicksAnalytics" src/pages/PrizePicksScreen.tsx | cut -d: -f1)
if [ ! -z "$start_line" ]; then
    echo "Fetch function starts at line: $start_line"
    # Check next 50 lines for proper structure
    sed -n "${start_line},$((start_line+50))p" src/pages/PrizePicksScreen.tsx | grep -n "}\|{"
fi

echo ""
echo "✅ Fix applied. Now deploy: vercel --prod --yes"
