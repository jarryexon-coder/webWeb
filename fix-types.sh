#!/bin/bash

# Fix useSportsData.ts
sed -i '' "315s/const { fetchFromBackend } = useSportsData({});/const sportsData = useSportsData({});\nconst { fetchFromBackend } = sportsData;/" src/hooks/useSportsData.ts

# Fix KalshiPredictionsScreen.tsx
sed -i '' "867s/{prediction.aiGenerated &&/{prediction.aiGenerated \&\&/" src/pages/KalshiPredictionsScreen.tsx

# Fix LiveGamesScreen.tsx
sed -i '' "207s/filtered = games.filter(game =>/filtered = games.filter((game: any) =>/" src/pages/LiveGamesScreen.tsx
sed -i '' "213s/filtered = filtered.filter(game =>/filtered = filtered.filter((game: any) =>/" src/pages/LiveGamesScreen.tsx
sed -i '' "226s/const liveGamesCount = filtered.filter(game =>/const liveGamesCount = filtered.filter((game: any) =>/" src/pages/LiveGamesScreen.tsx
sed -i '' "227s/const finalGamesCount = filtered.filter(game =>/const finalGamesCount = filtered.filter((game: any) =>/" src/pages/LiveGamesScreen.tsx
sed -i '' "228s/const totalPoints = filtered.reduce((sum, game) =>/const totalPoints = filtered.reduce((sum: number, game: any) =>/" src/pages/LiveGamesScreen.tsx

# Fix NewsDeskScreen.tsx
sed -i '' "218s/category: this.mapCategory(article.category) ||/category: this.mapCategory(article?.category) ||/" src/pages/NewsDeskScreen.tsx

# Fix SportsWireScreen.tsx
sed -i '' "227s/category: this.mapCategory(article.category) ||/category: this.mapCategory(article?.category) ||/" src/pages/SportsWireScreen.tsx
sed -i '' "229s/time: this.formatTime(article.date || article.createdAt) ||/time: this.formatTime(article?.date || article?.createdAt) ||/" src/pages/SportsWireScreen.tsx
sed -i '' "233s/sentiment: this.getSentiment(article.sentiment)/sentiment: this.getSentiment(article?.sentiment)/" src/pages/SportsWireScreen.tsx
sed -i '' "252s/category: this.mapCategory(story.category) ||/category: this.mapCategory(story?.category) ||/" src/pages/SportsWireScreen.tsx
sed -i '' "253s/time: this.formatTime(story.date) ||/time: this.formatTime(story?.date) ||/" src/pages/SportsWireScreen.tsx
sed -i '' "256s/emoji: this.getEmoji(story.category)/emoji: this.getEmoji(story?.category)/" src/pages/SportsWireScreen.tsx
sed -i '' "257s/type: this.getType(story.category)/type: this.getType(story?.category)/" src/pages/SportsWireScreen.tsx
sed -i '' "260s/sentiment: this.getSentiment(story.sentiment)/sentiment: this.getSentiment(story?.sentiment)/" src/pages/SportsWireScreen.tsx

echo "Fixed TypeScript errors!"
