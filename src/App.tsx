// src/App.tsx – Complete Integrated Version with All Screens & react-error-boundary
// February 2026

import React, { useState, useEffect, Suspense, lazy, useRef } from 'react';   // <-- added useRef
import { Routes, Route, Navigate, BrowserRouter as Router } from 'react-router-dom';
import { initializeApp } from 'firebase/app';
import { getAnalytics } from 'firebase/analytics';

// React Query
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

// Error Boundary
import { ErrorBoundary } from 'react-error-boundary';

// Context Providers
import { AuthProvider } from './context/AuthContext';
import { PredictionsProvider } from './context/PredictionsContext';
import { ParlayProvider } from './context/ParlayContext';
import { BetSlipProvider } from './context/BetSlipContext';
import { PredictionMarketsProvider } from './context/PredictionMarketsProvider';
import { ParlayTemplatesProvider } from './context/ParlayTemplatesContext';
import { NotificationProvider } from './context/NotificationContext';
import { NHLProvider } from './context/NHLContext';
import { FantasyProvider } from './context/FantasyContext';
import { SportsProvider } from './context/SportsContext';
import { BookmarkProvider } from './context/BookmarkContext';

// Material-UI components for fallback UI
import { Container, Paper, Typography, Button, Box } from '@mui/material';

// Temporary/Mock Providers (replace when ready)
const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [theme] = useState('dark');
  return <div data-theme={theme}>{children}</div>;
};

// ---------- LAYOUT & CORE PAGES ----------
import Layout from './layouts/Layout';
import HomeScreen from './pages/HomeScreen';
import LiveGamesScreen from './pages/LiveGamesScreen';
import NewsDeskScreen from './pages/NewsDeskScreen';
import DailyPicksScreen from './pages/DailyPicksScreen';
import LoginScreenEnhanced from './pages/LoginScreenEnhanced';
import NFLAnalyticsScreen from './pages/NFLAnalyticsScreen';
import DiagnosticScreen from './pages/DiagnosticScreen';
import Health from './pages/Health';

// ---------- 2026 SEASON SCREENS ----------
import WorldCup2026Screen from './pages/WorldCup2026Screen';
import AllStar2026Screen from './pages/AllStar2026Screen';
import Futures2026Screen from './pages/Futures2026Screen';
import AltLinesScreen from './pages/AltLinesScreen';
import SeasonStatsScreen from './pages/SeasonStatsScreen';
import RookieWatchScreen from './pages/RookieWatchScreen';

// ---------- ANALYTICS SCREENS ----------
import TrendAnalysisScreen from './pages/TrendAnalysisScreen';
import SportsSpecificAnalyticsScreen from './pages/SportsSpecificAnalyticsScreen';
import HistoricalAnalyticsScreen from './pages/HistoricalAnalyticsScreen';
import AnalyticsDashboardScreen from './pages/AnalyticsDashboardScreen';

// ---------- PARLAY & BETTING SCREENS ----------
import ParlayBuilderScreen from './pages/ParlayBuilderScreen';
import SameGameParlayScreen from './pages/SameGameParlayScreen';
import TeaserCalculatorScreen from './pages/TeaserCalculatorScreen';
import RoundRobinScreen from './pages/RoundRobinScreen';
import ParlayBoostsScreen from './pages/ParlayBoostsScreen';
import ParlayHistoryScreen from './pages/ParlayHistoryScreen';
import ParlayDetailScreen from './pages/ParlayDetailScreen';

// ---------- AI & CORRELATION SCREENS ----------
import AIParlaySuggestionsScreen from './pages/AIParlaySuggestionsScreen';
import ParlayAnalyticsScreen from './pages/ParlayAnalyticsScreen';
import CorrelationExplorerScreen from './pages/CorrelationExplorerScreen';
import CorrelatedParlayDetailsScreen from './pages/CorrelatedParlayDetailsScreen';

// ---------- PROPS SCREENS ----------
import PlayerPropsScreen from './pages/PlayerPropsScreen';
import PropsDetailsScreen from './pages/PropsDetailsScreen';

// ---------- PREDICTION SCREENS ----------
import PredictionMarketsScreen from './pages/PredictionMarketsScreen';
import PredictionDetailScreen from './pages/PredictionDetailScreen';

// ---------- SPORTS DASHBOARDS ----------
import NBADashboard from './pages/NBADashboard';
import NHLDashboard from './pages/NHLDashboard';
import NFLDashboard from './pages/NFLDashboard';
import MLBSpringTraining from './pages/MLBSpringTraining';

// ---------- TENNIS & GOLF ----------
import TennisPlayers from './pages/TennisPlayers';
import TennisTournaments from './pages/TennisTournaments';
import TennisMatches from './pages/TennisMatches';
import GolfPlayers from './pages/GolfPlayers';
import GolfTournaments from './pages/GolfTournaments';
import GolfLeaderboard from './pages/GolfLeaderboard';

// ---------- LAZY LOADED (performance) ----------
const PrizePicksScreen = lazy(() => import('./pages/PrizePicksScreen'));
const FantasyHubScreen = lazy(() => import('./pages/FantasyHubScreen'));
const AdvancedAnalyticsScreen = lazy(() => import('./pages/AdvancedAnalyticsScreen'));
const PlayerStatsScreen = lazy(() => import('./pages/PlayerStatsScreen'));
const KalshiPredictionsScreen = lazy(() => import('./pages/KalshiPredictionsScreen'));
const PredictionsOutcomeScreen = lazy(() => import('./pages/PredictionsOutcomeScreen'));
const MatchAnalyticsScreen = lazy(() => import('./pages/MatchAnalyticsScreen'));
const ParlayArchitectScreen = lazy(() => import('./pages/ParlayArchitectScreen'));
const SportsWireScreen = lazy(() => import('./pages/SportsWireScreen'));
const SecretPhraseScreen = lazy(() => import('./pages/SecretPhraseScreen'));
const SubscriptionScreen = lazy(() => import('./pages/SubscriptionScreen'));
const BackendTestScreen = lazy(() => import('./pages/BackendTestScreen'));

// ---------- PLACEHOLDERS (now actual screens) ----------
import AllStarWeekendScreen from './pages/AllStarWeekendScreen';
import SeasonStatusScreen from './pages/SeasonStatusScreen';
import TradeDeadlineScreen from './pages/TradeDeadlineScreen';

// ---------- 2026 Season Hub Page ----------
const TwentyTwentySixHomePage = () => {
  return (
    <div>
      <h1>2026 Season Hub</h1>
      <p>Welcome to the 2026 season hub – central access to all 2026‑related screens.</p>
    </div>
  );
};

// ---------- React Query Setup ----------
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

// ---------- Fixed Infinite Loop Detector ----------
const InfiniteLoopDetector = () => {
  if (import.meta.env.DEV) {
    const renderCount = useRef(0);
    useEffect(() => {
      renderCount.current += 1;
      if (renderCount.current > 50) {
        console.error('Potential infinite loop detected!');
      }
    }); // no deps – runs after every render but does NOT cause re‑renders
  }
  return null;
};

// ---------- Error Fallback Component ----------
const ErrorFallback = ({ error, resetErrorBoundary }: { error: Error; resetErrorBoundary: () => void }) => (
  <Container maxWidth="md" sx={{ py: 8 }}>
    <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
      <Typography variant="h3" color="error" gutterBottom>
        ⚠️ Something went wrong
      </Typography>
      <Typography variant="body1" paragraph>
        {error.message || 'An unexpected error occurred.'}
      </Typography>
      <Box sx={{ bgcolor: 'grey.100', p: 2, borderRadius: 1, mb: 2, textAlign: 'left' }}>
        <pre style={{ margin: 0, overflow: 'auto' }}>{error.stack}</pre>
      </Box>
      <Button variant="contained" color="primary" onClick={resetErrorBoundary}>
        Reload Page
      </Button>
    </Paper>
  </Container>
);

// ---------- Main App Component ----------
function App() {
  // Firebase init
  useEffect(() => {
    try {
      const firebaseConfig = {
        apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
        authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
        projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
        storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
        appId: import.meta.env.VITE_FIREBASE_APP_ID,
        measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
      };
      if (firebaseConfig.apiKey) {
        const app = initializeApp(firebaseConfig);
        if (import.meta.env.PROD) getAnalytics(app);
      }
    } catch (error) {
      console.error('Firebase error:', error);
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <PredictionsProvider>
            <ParlayProvider>
              <BetSlipProvider>
                <PredictionMarketsProvider>
                  <ParlayTemplatesProvider>
                    <NHLProvider>
                      <FantasyProvider>
                        <NotificationProvider>
                          <BookmarkProvider>
                            <SportsProvider initialRealtime={false}>
                              <ErrorBoundary
                                FallbackComponent={ErrorFallback}
                                onReset={() => window.location.reload()}
                              >
                                <Router>
                                  <InfiniteLoopDetector />   {/* Now safe */}
                                  <Routes>
                                    <Route path="/" element={<Layout />}>
                                      {/* Core */}
                                      <Route index element={<HomeScreen />} />
                                      <Route path="live-games" element={<LiveGamesScreen />} />
                                      <Route path="nfl-analytics" element={<NFLAnalyticsScreen />} />
                                      <Route path="news-desk" element={<NewsDeskScreen />} />
                                      <Route path="daily-picks" element={<DailyPicksScreen />} />
                                      <Route path="login" element={<LoginScreenEnhanced />} />
                                      <Route path="diagnostic" element={<DiagnosticScreen />} />
                                      <Route path="health" element={<Health />} />

                                      {/* 2026 Hub */}
                                      <Route path="2026" element={<TwentyTwentySixHomePage />} />

                                      {/* 2026 Season Screens */}
                                      <Route path="world-cup-2026" element={<WorldCup2026Screen />} />
                                      <Route path="all-star-2026" element={<AllStar2026Screen />} />
                                      <Route path="futures-2026" element={<Futures2026Screen />} />
                                      <Route path="alt-lines" element={<AltLinesScreen />} />
                                      <Route path="season-stats" element={<SeasonStatsScreen />} />
                                      <Route path="rookie-watch" element={<RookieWatchScreen />} />

                                      {/* Analytics */}
                                      <Route path="trend-analysis" element={<TrendAnalysisScreen />} />
                                      <Route path="sports-analytics/:sport" element={<SportsSpecificAnalyticsScreen />} />
                                      <Route path="historical-analytics" element={<HistoricalAnalyticsScreen />} />
                                      <Route path="analytics-dashboard" element={<AnalyticsDashboardScreen />} />

                                      {/* Parlay & Betting */}
                                      <Route path="parlay-builder" element={<ParlayBuilderScreen />} />
                                      <Route path="same-game-parlay" element={<SameGameParlayScreen />} />
                                      <Route path="teaser-calculator" element={<TeaserCalculatorScreen />} />
                                      <Route path="round-robin" element={<RoundRobinScreen />} />
                                      <Route path="parlay-boosts" element={<ParlayBoostsScreen />} />
                                      <Route path="parlay-history" element={<ParlayHistoryScreen />} />
                                      <Route path="parlay-details/:id" element={<ParlayDetailScreen />} />

                                      {/* AI & Correlation */}
                                      <Route path="ai-suggestions" element={<AIParlaySuggestionsScreen />} />
                                      <Route path="parlay-analytics" element={<ParlayAnalyticsScreen />} />
                                      <Route path="correlation-explorer" element={<CorrelationExplorerScreen />} />
                                      <Route path="correlated-parlay/:id" element={<CorrelatedParlayDetailsScreen />} />

                                      {/* Props */}
                                      <Route path="player-props" element={<PlayerPropsScreen />} />
                                      <Route path="props-details/:propId" element={<PropsDetailsScreen />} />

                                      {/* Prediction Markets */}
                                      <Route path="prediction-markets" element={<PredictionMarketsScreen />} />
                                      <Route path="prediction/:id" element={<PredictionDetailScreen />} />

                                      {/* Sports Dashboards */}
                                      <Route path="nba-dashboard" element={<NBADashboard />} />
                                      <Route path="nhl-dashboard" element={<NHLDashboard />} />
                                      <Route path="nfl-dashboard" element={<NFLDashboard />} />
                                      <Route path="mlb-spring-training" element={<MLBSpringTraining />} />

                                      {/* Tennis */}
                                      <Route path="tennis/players" element={<TennisPlayers />} />
                                      <Route path="tennis/tournaments" element={<TennisTournaments />} />
                                      <Route path="tennis/matches" element={<TennisMatches />} />

                                      {/* Golf */}
                                      <Route path="golf/players" element={<GolfPlayers />} />
                                      <Route path="golf/tournaments" element={<GolfTournaments />} />
                                      <Route path="golf/leaderboard" element={<GolfLeaderboard />} />

                                      {/* New Placeholder Screens */}
                                      <Route path="all-star-weekend" element={<AllStarWeekendScreen />} />
                                      <Route path="season-status" element={<SeasonStatusScreen />} />
                                      <Route path="trade-deadline" element={<TradeDeadlineScreen />} />

                                      {/* Lazy loaded */}
                                      <Route path="parlay-architect" element={<Suspense fallback={<div>Loading...</div>}><ParlayArchitectScreen /></Suspense>} />
                                      <Route path="fantasy-hub" element={<Suspense fallback={<div>Loading...</div>}><FantasyHubScreen /></Suspense>} />
                                      <Route path="player-stats" element={<Suspense fallback={<div>Loading...</div>}><PlayerStatsScreen /></Suspense>} />
                                      <Route path="sports-wire" element={<Suspense fallback={<div>Loading...</div>}><SportsWireScreen /></Suspense>} />
                                      <Route path="match-analytics" element={<Suspense fallback={<div>Loading...</div>}><MatchAnalyticsScreen /></Suspense>} />
                                      <Route path="advanced-analytics" element={<Suspense fallback={<div>Loading...</div>}><AdvancedAnalyticsScreen /></Suspense>} />
                                      <Route path="predictions-outcome" element={<Suspense fallback={<div>Loading...</div>}><PredictionsOutcomeScreen /></Suspense>} />
                                      <Route path="kalshi-predictions" element={<Suspense fallback={<div>Loading...</div>}><KalshiPredictionsScreen /></Suspense>} />
                                      <Route path="prize-picks" element={<Suspense fallback={<div>Loading...</div>}><PrizePicksScreen /></Suspense>} />
                                      <Route path="secret-phrases" element={<Suspense fallback={<div>Loading...</div>}><SecretPhraseScreen /></Suspense>} />
                                      <Route path="subscription" element={<Suspense fallback={<div>Loading...</div>}><SubscriptionScreen /></Suspense>} />
                                      <Route path="backend-test" element={<Suspense fallback={<div>Loading...</div>}><BackendTestScreen /></Suspense>} />

                                      {/* Catch-all */}
                                      <Route path="*" element={<Navigate to="/" replace />} />
                                    </Route>
                                  </Routes>
                                </Router>
                              </ErrorBoundary>
                            </SportsProvider>
                          </BookmarkProvider>
                        </NotificationProvider>
                      </FantasyProvider>
                    </NHLProvider>
                  </ParlayTemplatesProvider>
                </PredictionMarketsProvider>
              </BetSlipProvider>
            </ParlayProvider>
          </PredictionsProvider>
        </AuthProvider>
      </ThemeProvider>
      {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} position="bottom-right" />}
    </QueryClientProvider>
  );
}

export default App;
