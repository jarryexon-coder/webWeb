#!/bin/bash

echo "Cleaning up duplicate declarations..."

# 1. Fix useSportsData.ts - Remove duplicate fetchFromBackend
sed -i '' '/fetchFromBackend?:.*Promise<any>;/d' src/hooks/useSportsData.ts
sed -i '' '/interface SportsData {/a\
  fetchFromBackend?: (endpoint: string) => Promise<any>;' src/hooks/useSportsData.ts

# Add null checks
sed -i '' '324s/    const backendData = await fetchFromBackend(endpoint);/    if (!fetchFromBackend) return null;\
    const backendData = await fetchFromBackend(endpoint);/' src/hooks/useSportsData.ts
sed -i '' '343s/    const backendData = await fetchFromBackend(endpoint);/    if (!fetchFromBackend) return null;\
    const backendData = await fetchFromBackend(endpoint);/' src/hooks/useSportsData.ts
sed -i '' '365s/    const backendData = await fetchFromBackend(endpoint);/    if (!fetchFromBackend) return null;\
    const backendData = await fetchFromBackend(endpoint);/' src/hooks/useSportsData.ts

# 2. Fix NFLAnalyticsScreen.tsx - Remove duplicate standings
sed -i '' '121s/const \[standings, setStandings\] = useState<any\[\]>(\[\]);  //.*//' src/pages/NFLAnalyticsScreen.tsx
sed -i '' '121s/const \[standings, setStandings\] = useState<any\[\]>(\[\]);//' src/pages/NFLAnalyticsScreen.tsx
sed -i '' '/const \[standings, setStandings\] = useState<any\[\]>(\[\]);/{N;N;d;}' src/pages/NFLAnalyticsScreen.tsx

# Add types
sed -i '' '1265s/division.teams.map(team => {/division.teams.map((team: any) => {/' src/pages/NFLAnalyticsScreen.tsx
sed -i '' '1276s/division.teams.map(team => {/division.teams.map((team: any) => {/' src/pages/NFLAnalyticsScreen.tsx

# 3. Fix SportsWireScreen.tsx - Remove this. references
# Use a simpler approach: replace with basic values
sed -i '' "227s/category: (this && this.mapCategory && article?.category) ? this.mapCategory(article.category) : 'analytics'/category: article?.category || 'analytics'/" src/pages/SportsWireScreen.tsx
sed -i '' "229s|time: (this && this.formatTime && (article?.date || article?.createdAt)) ? this.formatTime(article.date || article.createdAt) : \`\${Math.floor(Math.random() * 24)}h ago\`|time: \`\${Math.floor(Math.random() * 24)}h ago\`|" src/pages/SportsWireScreen.tsx
sed -i '' '233s/sentiment: (this && this.getSentiment && article?.sentiment) ? this.getSentiment(article.sentiment) : undefined/sentiment: undefined/' src/pages/SportsWireScreen.tsx

sed -i '' "252s/category: (this && this.mapCategory && story?.category) ? this.mapCategory(story.category) : 'analytics'/category: story?.category || 'analytics'/" src/pages/SportsWireScreen.tsx
sed -i '' "253s/time: (this && this.formatTime && story?.date) ? this.formatTime(story.date) : '1h ago'/time: '1h ago'/" src/pages/SportsWireScreen.tsx
sed -i '' '256s/emoji: (this && this.getEmoji && story?.category) ? this.getEmoji(story.category) : undefined/emoji: undefined/' src/pages/SportsWireScreen.tsx
sed -i '' '257s/type: (this && this.getType && story?.category) ? this.getType(story.category) : undefined/type: undefined/' src/pages/SportsWireScreen.tsx
sed -i '' '260s/sentiment: (this && this.getSentiment && story?.sentiment) ? this.getSentiment(story.sentiment) : undefined/sentiment: undefined/' src/pages/SportsWireScreen.tsx

# 4. Fix NewsDeskScreen.tsx
sed -i '' "218s/category: (this && this.mapCategory && article?.category) ? this.mapCategory(article.category) : 'announcement'/category: 'announcement'/" src/pages/NewsDeskScreen.tsx

echo "Done! Manual fixes may still be needed for Kalshi."
