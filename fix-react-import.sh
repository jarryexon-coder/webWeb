#!/bin/bash
# fix-react-imports.sh

echo "🔧 Fixing React imports..."

# Check and fix NFLAnalyticsScreen.tsx
echo "📄 Checking NFLAnalyticsScreen.tsx imports..."
if grep -q "import React.*from" src/pages/NFLAnalyticsScreen.tsx; then
    echo "   ✅ Has React import"
else
    echo "   ❌ Missing React import"
    # Add React import at the top
    sed -i '' '1s/^/import React, { useState, useEffect } from "react";\n/' src/pages/NFLAnalyticsScreen.tsx
fi

# Check and fix PrizePicksScreen.tsx  
echo "📄 Checking PrizePicksScreen.tsx imports..."
current_import=$(head -2 src/pages/PrizePicksScreen.tsx | tail -1)
echo "   Current import: $current_import"

# Fix the import - should be: import React, { useState, useEffect } from 'react';
sed -i '' '2s/.*import.*react.*/import React, { useState, useEffect } from '\''react'\'';/' src/pages/PrizePicksScreen.tsx

echo "✅ Imports fixed. Now let's check the middleware issue..."
