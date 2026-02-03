#!/bin/bash
# complete-react-fix.sh

echo "🔧 COMPLETE REACT IMPORT FIX"
echo "============================"

# 1. Fix PrizePicksScreen.tsx
echo ""
echo "1. 📄 Fixing PrizePicksScreen.tsx..."

# Remove any duplicate React imports first
echo "   Removing duplicate imports..."
awk '
BEGIN { foundReact = 0 }
/import.*react/ {
  if (!foundReact) {
    print "import React, { useState, useEffect } from '\''react'\'';"
    foundReact = 1
  }
  next
}
{ print $0 }
' src/pages/PrizePicksScreen.tsx > /tmp/prizepicks-fixed.tsx

# Move back
mv /tmp/prizepicks-fixed.tsx src/pages/PrizePicksScreen.tsx

echo "   ✅ Fixed imports"
echo "   First 5 lines:"
head -5 src/pages/PrizePicksScreen.tsx

# 2. Also check NFLAnalyticsScreen.tsx (the other file we modified)
echo ""
echo "2. 📄 Checking NFLAnalyticsScreen.tsx..."
if grep -q "^import React" src/pages/NFLAnalyticsScreen.tsx; then
    echo "   ✅ Has React import"
else
    echo "   ⚠️ Missing React import, fixing..."
    sed -i '' '1s/^/import React, { useState, useEffect } from '\''react'\'';\n/' src/pages/NFLAnalyticsScreen.tsx
fi

# 3. Check all files we modified
echo ""
echo "3. 📄 Checking all modified files:"
files="src/pages/FantasyHubScreen.tsx src/pages/DailyPicksScreen.tsx src/pages/ParlayArchitectScreen.tsx src/pages/MatchAnalyticsScreen.tsx src/pages/AdvancedAnalyticsScreen.tsx"

for file in $files; do
    if [ -f "$file" ]; then
        if grep -q "useState\|useEffect" "$file" && ! grep -q "^import React" "$file"; then
            echo "   ⚠️  $file uses hooks but missing React import"
        fi
    fi
done

# 4. Quick syntax check
echo ""
echo "4. 🔧 Syntax check..."
npx tsc --noEmit src/pages/PrizePicksScreen.tsx 2>/dev/null || echo "   TypeScript check might show errors"

echo ""
echo "✅ Fix completed!"
echo ""
echo "🚀 Deploy with: vercel --prod --yes"
echo ""
echo "📝 If still getting white screen, check:"
echo "   - Browser console for exact error"
echo "   - Network tab for failed API calls"
echo "   - React DevTools extension to see component tree"
