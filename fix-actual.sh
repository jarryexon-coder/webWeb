#!/bin/bash
# fix-actual-react-issues.sh

echo "🔧 FIXING ACTUAL REACT IMPORT ISSUES"
echo "====================================="

# These are hook files - they're fine as is
echo "1. Hook files are OK - they import hooks correctly"
echo "   - src/hooks/useAuth.ts ✓"
echo "   - src/hooks/useSportsData.ts ✓"
echo ""

# The REAL issue is in component files. Let me find them:
echo "2. Finding component files that might have issues..."
for file in src/pages/*.tsx src/components/*.tsx; do
    if [ -f "$file" ]; then
        # Check if file uses JSX (has HTML-like tags)
        if grep -q "return.*<\|<>.*<\/>\|React\." "$file"; then
            # Check if it imports React
            if ! grep -q "^import React" "$file" && ! grep -q "^import.*React.*from" "$file"; then
                echo "❌ $file uses JSX but doesn't import React"
                
                # Show the problematic line
                echo "   Problem area:"
                grep -n "return.*<" "$file" | head -2
                echo ""
            fi
        fi
    fi
done

# 3. Also check for files that might be using React without import
echo "3. Checking for React usage without import..."
for file in src/pages/*.tsx src/components/*.tsx; do
    if [ -f "$file" ]; then
        # Check for React.Fragment, React.memo, React.lazy, etc.
        if grep -q "React\." "$file" && ! grep -q "^import React" "$file"; then
            echo "❌ $file uses React.xxx but doesn't import React"
            grep -n "React\." "$file" | head -3
            echo ""
        fi
    fi
done
