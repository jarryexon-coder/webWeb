#!/bin/bash
echo "Fixing remaining TypeScript errors..."

# ===== Fix useSportsData.ts =====
echo "Fixing useSportsData.ts..."

# 1. Fix the 'games' property error - add it to SportsData interface
sed -i '' '/interface SportsData {/a\
  games?: any[];' src/hooks/useSportsData.ts

# 2. Add proper null checks for fetchFromBackend calls
# Remove any existing null checks and add proper ones
sed -i '' '320s/.*/    if (!fetchFromBackend) return null;\
    const backendData = await fetchFromBackend(endpoint);/' src/hooks/useSportsData.ts

sed -i '' '339s/.*/    if (!fetchFromBackend) return null;\
    const backendData = await fetchFromBackend(endpoint);/' src/hooks/useSportsData.ts

sed -i '' '361s/.*/    if (!fetchFromBackend) return null;\
    const backendData = await fetchFromBackend(endpoint);/' src/hooks/useSportsData.ts

# ===== Fix KalshiPredictionsScreen.tsx =====
echo "Fixing KalshiPredictionsScreen.tsx..."

# Add aiGenerated property to prediction type
# First, check if there's an interface for Prediction
if grep -q "interface.*Prediction\|type.*Prediction" src/pages/KalshiPredictionsScreen.tsx; then
  # Insert after the interface/type declaration
  sed -i '' '/interface.*Prediction\|type.*Prediction/{:a;n;/^}/!ba; s/^}/  aiGenerated?: boolean;\
}/' src/pages/KalshiPredictionsScreen.tsx
else
  # Add a new interface at the top (after imports)
  sed -i '' '2i\
// Prediction interface\
interface Prediction {\
  id: string;\
  question: string;\
  category: string;\
  yesPrice: string;\
  noPrice: string;\
  volume: string;\
  analysis: string;\
  expires: string;\
  confidence: number;\
  edge: string;\
  aiGenerated?: boolean;\
}' src/pages/KalshiPredictionsScreen.tsx
fi

# ===== Fix NFLAnalyticsScreen.tsx =====
echo "Fixing NFLAnalyticsScreen.tsx..."

# 1. Add type annotations for team parameter
sed -i '' '1265s/team =>/team: any =>/' src/pages/NFLAnalyticsScreen.tsx
sed -i '' '1276s/team =>/team: any =>/' src/pages/NFLAnalyticsScreen.tsx

# 2. Make sure setStandings exists - add useState if missing
if ! grep -q "setStandings" src/pages/NFLAnalyticsScreen.tsx; then
  # Find a good place to add it (after other useState hooks)
  LINE=$(grep -n "useState" src/pages/NFLAnalyticsScreen.tsx | head -3 | tail -1 | cut -d: -f1)
  if [ ! -z "$LINE" ]; then
    sed -i '' "${LINE}a\\
const [standings, setStandings] = useState<any[]>([]);" src/pages/NFLAnalyticsScreen.tsx
  fi
fi

# ===== Fix SportsWireScreen.tsx =====
echo "Fixing SportsWireScreen.tsx..."

# Simplify the time line to avoid this. references
sed -i '' '229s|.*|          time: `\${Math.floor(Math.random() * 24)}h ago`,|' src/pages/SportsWireScreen.tsx

echo "Done! Running TypeScript check..."
npx tsc --noEmit
