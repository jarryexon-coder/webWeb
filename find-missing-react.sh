#!/bin/bash
# find-missing-react.sh

echo "🔍 FINDING FILES WITH HOOKS BUT NO REACT IMPORT"
echo "================================================"

found_issues=0

# Check all TypeScript/JavaScript files
for file in $(find src -name "*.tsx" -o -name "*.ts" -o -name "*.jsx" -o -name "*.js"); do
    # Skip node_modules and test files
    if [[ "$file" == *"node_modules"* ]] || [[ "$file" == *".test."* ]] || [[ "$file" == *".spec."* ]]; then
        continue
    fi
    
    # Check if file uses React hooks
    if grep -q "useState\|useEffect\|useContext\|useReducer\|useCallback\|useMemo\|useRef\|createContext" "$file"; then
        # Check if it imports React
        if ! grep -q "^import React" "$file" && ! grep -q "^import.*React.*from" "$file" && ! grep -q "require.*react" "$file"; then
            echo "❌ $file uses hooks but doesn't import React"
            echo "   First 5 lines:"
            head -5 "$file"
            echo ""
            found_issues=$((found_issues + 1))
        fi
    fi
done

if [ $found_issues -eq 0 ]; then
    echo "✅ No files found with missing React imports"
else
    echo "⚠️ Found $found_issues files with missing React imports"
fi
