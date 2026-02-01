// src/App.tsx
import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './layouts/Layout'

// Import ONLY the screens you need (from your GroupedTabNavigator)
import HomeScreen from './pages/HomeScreen'
import LiveGamesScreen from './pages/LiveGamesScreen'
import NewsDeskScreen from './pages/NewsDeskScreen'
import FantasyHubScreen from './pages/FantasyHubScreen'
import PlayerStatsScreen from './pages/PlayerStatsScreen'
import SportsWireScreen from './pages/SportsWireScreen'
import NHLTrendsScreen from './pages/NHLTrendsScreen'
import MatchAnalyticsScreen from './pages/MatchAnalyticsScreen'
import DailyPicksScreen from './pages/DailyPicksScreen'
import ParlayArchitectScreen from './pages/ParlayArchitectScreen'
import AdvancedAnalyticsScreen from './pages/AdvancedAnalyticsScreen'
import PredictionsOutcomeScreen from './pages/PredictionsOutcomeScreen'
import KalshiPredictionsScreen from './pages/KalshiPredictionsScreen'
import SecretPhraseScreen from './pages/SecretPhraseScreen';
import SubscriptionScreen from './pages/SubscriptionScreen'
import BackendTestScreen from './pages/BackendTestScreen'
import PrizePicksScreen from './pages/PrizePicksScreen'
import LoginScreenEnhanced from './pages/LoginScreenEnhanced'
import NFLAnalyticsScreen from './pages/NFLAnalyticsScreen'
import DiagnosticScreen from './pages/DiagnosticScreen' // Assuming you want this too

// Import Hub Screens (they organize the other screens)
import AllAccessHubScreen from './pages/AllAccessHubScreen'
import SuperStatsHubScreen from './pages/SuperStatsHubScreen'
import AIGeneratorsHubScreen from './pages/AIGeneratorsHubScreen'
import EliteToolsHubScreen from './pages/EliteToolsHubScreen'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        {/* Home Route */}
        <Route index element={<HomeScreen />} />
        
        {/* All Access Group */}
        <Route path="all-access" element={<AllAccessHubScreen />} />
        <Route path="all-access/live-games" element={<LiveGamesScreen />} />
        <Route path="all-access/nfl-analytics" element={<NFLAnalyticsScreen />} />
        <Route path="all-access/news-desk" element={<NewsDeskScreen />} />
        
        {/* Super Stats Group */}
        <Route path="super-stats" element={<SuperStatsHubScreen />} />
        <Route path="super-stats/fantasy-hub" element={<FantasyHubScreen />} />
        <Route path="super-stats/player-stats" element={<PlayerStatsScreen />} />
        <Route path="super-stats/sports-wire" element={<SportsWireScreen />} />
        <Route path="super-stats/nhl-trends" element={<NHLTrendsScreen />} />
        <Route path="super-stats/match-analytics" element={<MatchAnalyticsScreen />} />
        
        {/* AI Generators Group */}
        <Route path="ai-generators" element={<AIGeneratorsHubScreen />} />
        <Route path="ai-generators/daily-picks" element={<DailyPicksScreen />} />
        <Route path="ai-generators/parlay-architect" element={<ParlayArchitectScreen />} />
        <Route path="ai-generators/advanced-analytics" element={<AdvancedAnalyticsScreen />} />
        <Route path="ai-generators/predictions-outcome" element={<PredictionsOutcomeScreen />} />
        
        {/* Elite Tools Group */}
        <Route path="elite-tools" element={<EliteToolsHubScreen />} />
        <Route path="elite-tools/kalshi-predictions" element={<KalshiPredictionsScreen />} />
        <Route path="elite-tools/secret-phrases" element={<SecretPhraseScreen />} />
        <Route path="elite-tools/prize-picks" element={<PrizePicksScreen />} />
        
        {/* Auth & Subscription */}
        <Route path="subscription" element={<SubscriptionScreen />} />
        <Route path="login" element={<LoginScreenEnhanced />} />
        
        {/* Dev Tools */}
        <Route path="dev-tools" element={<DiagnosticScreen />} />
        <Route path="dev-tools/backend-test" element={<BackendTestScreen />} />
        
        {/* Catch-all redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}

export default App
