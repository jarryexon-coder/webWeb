// src/App.tsx - COMPLETE PRODUCTION VERSION WITH ERROR BOUNDARY
import React, { useEffect } from 'react'
import { Routes, Route, Navigate, BrowserRouter as Router } from 'react-router-dom'

// Import Global Error Boundary
import GlobalErrorBoundary from './components/GlobalErrorBoundary'

// Import all screens
import Layout from './layouts/Layout'
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

// Firebase initialization (if needed)
import { initializeApp } from 'firebase/app'
import { getAnalytics } from 'firebase/analytics'

function App() {
  // Initialize Firebase on app load
  useEffect(() => {
    try {
      const firebaseConfig = {
        apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
        authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
        projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
        storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
        appId: import.meta.env.VITE_FIREBASE_APP_ID
      }

      // Only initialize if all required config values are present
      if (firebaseConfig.apiKey && firebaseConfig.projectId) {
        const app = initializeApp(firebaseConfig)
        
        // Initialize Analytics only in production
        if (import.meta.env.PROD) {
          getAnalytics(app)
        }
        
        console.log('✅ Firebase initialized successfully')
      } else {
        console.log('⚠️  Firebase config missing, skipping initialization')
      }
    } catch (error) {
      console.error('❌ Firebase initialization error:', error)
    }
  }, [])

  // Debug environment variables (remove in production)
  useEffect(() => {
    console.log('=== App Environment ===')
    console.log('Mode:', import.meta.env.MODE)
    console.log('API Base:', import.meta.env.VITE_API_BASE)
    console.log('App Name:', import.meta.env.VITE_APP_NAME)
    console.log('Firebase Project:', import.meta.env.VITE_FIREBASE_PROJECT_ID)
    console.log('=======================')
  }, [])

  return (
    <GlobalErrorBoundary>
      <Router>
        <Routes>
          <Route path="/" element={<Layout />}>
            {/* Home Route */}
            <Route index element={<HomeScreen />} />
            
            {/* All Application Routes */}
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
      </Router>
    </GlobalErrorBoundary>
  )
}

export default App
