// src/App.tsx
import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './layouts/Layout'

// Import screens
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
import SecretPhraseScreen from './pages/SecretPhraseScreen'
import SubscriptionScreen from './pages/SubscriptionScreen'
import BackendTestScreen from './pages/BackendTestScreen'
import PrizePicksScreen from './pages/PrizePicksScreen'
import LoginScreenEnhanced from './pages/LoginScreenEnhanced'
import NFLAnalyticsScreen from './pages/NFLAnalyticsScreen'
import DiagnosticScreen from './pages/DiagnosticScreen'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        {/* Home Route */}
        <Route index element={<HomeScreen />} />
        
        {/* Direct Routes - No Hub Screens */}
        <Route path="live-games" element={<LiveGamesScreen />} />
        <Route path="nfl-analytics" element={<NFLAnalyticsScreen />} />
        <Route path="news-desk" element={<NewsDeskScreen />} />
        <Route path="fantasy-hub" element={<FantasyHubScreen />} />
        <Route path="player-stats" element={<PlayerStatsScreen />} />
        <Route path="sports-wire" element={<SportsWireScreen />} />
        <Route path="nhl-trends" element={<NHLTrendsScreen />} />
        <Route path="match-analytics" element={<MatchAnalyticsScreen />} />
        <Route path="daily-picks" element={<DailyPicksScreen />} />
        <Route path="parlay-architect" element={<ParlayArchitectScreen />} />
        <Route path="advanced-analytics" element={<AdvancedAnalyticsScreen />} />
        <Route path="predictions-outcome" element={<PredictionsOutcomeScreen />} />
        <Route path="kalshi-predictions" element={<KalshiPredictionsScreen />} />
        <Route path="secret-phrases" element={<SecretPhraseScreen />} />
        <Route path="prize-picks" element={<PrizePicksScreen />} />
        <Route path="subscription" element={<SubscriptionScreen />} />
        <Route path="login" element={<LoginScreenEnhanced />} />
        <Route path="diagnostic" element={<DiagnosticScreen />} />
        <Route path="backend-test" element={<BackendTestScreen />} />
        
        {/* Catch-all redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}

export default App
