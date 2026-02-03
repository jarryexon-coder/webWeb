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
