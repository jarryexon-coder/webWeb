// src/App.tsx – Complete Integrated Version with Authentication Flow
// February 2026

import React, { useState, useEffect, Suspense, lazy } from 'react';
import { Routes, Route, Navigate, BrowserRouter as Router } from 'react-router-dom';
import { getAnalytics } from 'firebase/analytics';
import { initializeApp, getApps, getApp } from 'firebase/app';

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

// Temporary/Mock Providers
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
import IntroPage from './pages/IntroPage';
import TeamRostersPage from './pages/TeamRostersPage';

// ---------- NHL SCREENS ----------
import NHLTrendsScreen from './pages/NHLTrendsScreen';

// ---------- NCAAB SCREENS (FIXED with correct filenames) ----------
import NCAABGamesPage from './pages/ncaab/NCAABGamesPage';
import NCAABGameDetailPage from './pages/ncaab/NCAABGameDetailPage';
import NCAABStandingsPage from './pages/ncaab/NCAABStandingsPage';
import NCAABPlayersPage from './pages/ncaab/NCAABPlayersPage';
import NCAABPlayerDetailPage from './pages/ncaab/NCAABPlayerDetailPage';
import NCAABTeamsPage from './pages/ncaab/NCAABTeamsPage';
import NCAABRankingsPage from './pages/ncaab/NCAABRankingsPage';
import NCAABBracketPage from './pages/ncaab/NCAABBracketPage';

// ---------- 2026 SEASON SCREENS ----------
import WorldCup2026Screen from './pages/WorldCup2026Screen';

// ---------- ANALYTICS SCREENS ----------
import AnalyticsDashboardScreen from './pages/AnalyticsDashboardScreen';

// ---------- PARLAY & BETTING SCREENS ----------
import SameGameParlayScreen from './pages/SameGameParlayScreen';

// ---------- AI & CORRELATION SCREENS ----------
import AIParlaySuggestionsScreen from './pages/AIParlaySuggestionsScreen';
import ParlayAnalyticsScreen from './pages/ParlayAnalyticsScreen';

// ---------- PROPS SCREENS ----------
import PlayerPropsScreen from './pages/PlayerPropsScreen';

// ---------- SPORTS DASHBOARDS ----------
import NBADashboard from './pages/NBADashboard';
import NHLDashboard from './pages/NHLDashboard';
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
const SeasonStatsScreen = lazy(() => import('./pages/SeasonStatsScreen'));

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
    const renderCount = React.useRef(0);
    React.useEffect(() => {
      renderCount.current += 1;
      if (renderCount.current > 50) {
        console.error('Potential infinite loop detected!');
      }
    });
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

// ---------- Private Route Component ----------
import PrivateRoute from './components/PrivateRoute';

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
      if (!getApps().length) {
        const app = initializeApp(firebaseConfig);
        if (import.meta.env.PROD) getAnalytics(app);
      } else {
        const app = getApp();
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
                                  <InfiniteLoopDetector />
                                  <Routes>
                                    {/* Public routes */}
                                    <Route path="/" element={<IntroPage />} />
                                    <Route path="/login" element={<LoginScreenEnhanced />} />

                                    {/* Private routes (require authentication) */}
                                    <Route element={<PrivateRoute />}>
                                      <Route element={<Layout />}>
                                        {/* ALL-ACCESS Section */}
                                        <Route path="/home" element={<HomeScreen />} />
                                        <Route path="live-games" element={<LiveGamesScreen />} />
                                        <Route path="newsdesk" element={<NewsDeskScreen />} />
                                        <Route path="team-rosters" element={<TeamRostersPage />} />

                                        {/* STATS Section */}
                                        <Route path="player-props" element={<PlayerPropsScreen />} />
                                        <Route path="player-stats" element={<Suspense fallback={<div>Loading...</div>}><PlayerStatsScreen /></Suspense>} />
                                        <Route path="match-analytics" element={<Suspense fallback={<div>Loading...</div>}><MatchAnalyticsScreen /></Suspense>} />
                                        <Route path="season-stats" element={<Suspense fallback={<div>Loading...</div>}><SeasonStatsScreen /></Suspense>} />
                                        <Route path="nhl-trends" element={<NHLTrendsScreen />} />

                                        {/* GENERATOR$ Section */}
                                        <Route path="daily-picks" element={<DailyPicksScreen />} />
                                        <Route path="secret-phrases" element={<Suspense fallback={<div>Loading...</div>}><SecretPhraseScreen /></Suspense>} />
                                        <Route path="sports-wire" element={<Suspense fallback={<div>Loading...</div>}><SportsWireScreen /></Suspense>} />
                                        <Route path="prize-picks" element={<Suspense fallback={<div>Loading...</div>}><PrizePicksScreen /></Suspense>} />
                                        <Route path="fantasy-hub" element={<Suspense fallback={<div>Loading...</div>}><FantasyHubScreen /></Suspense>} />
                                        <Route path="advanced-analytics" element={<Suspense fallback={<div>Loading...</div>}><AdvancedAnalyticsScreen /></Suspense>} />
                                        <Route path="kalshi-predictions" element={<Suspense fallback={<div>Loading...</div>}><KalshiPredictionsScreen /></Suspense>} />
                                        <Route path="predictions-outcome" element={<Suspense fallback={<div>Loading...</div>}><PredictionsOutcomeScreen /></Suspense>} />

                                        {/* PARLAYPLUSPACKAGE-PPP Section */}
                                        <Route path="parlay-architect" element={<Suspense fallback={<div>Loading...</div>}><ParlayArchitectScreen /></Suspense>} />
                                        <Route path="same-game-parlay" element={<SameGameParlayScreen />} />
                                        <Route path="parlay-analytics" element={<ParlayAnalyticsScreen />} />
                                        <Route path="ai-suggestions" element={<AIParlaySuggestionsScreen />} />

                                        {/* DASHBOARDS Section */}
                                        <Route path="analytics-dashboard" element={<AnalyticsDashboardScreen />} />
                                        <Route path="nba-dashboard" element={<NBADashboard />} />
                                        <Route path="nhl-dashboard" element={<NHLDashboard />} />
                                        <Route path="mlb-spring-training" element={<MLBSpringTraining />} />

                                        {/* NCAAB Section - with correct paths */}
                                        <Route path="ncaab/games" element={<NCAABGamesPage />} />
                                        <Route path="ncaab/games/:id" element={<NCAABGameDetailPage />} />
                                        <Route path="ncaab/standings" element={<NCAABStandingsPage />} />
                                        <Route path="ncaab/players" element={<NCAABPlayersPage />} />
                                        <Route path="ncaab/players/:id" element={<NCAABPlayerDetailPage />} />
                                        <Route path="ncaab/teams" element={<NCAABTeamsPage />} />
                                        <Route path="ncaab/rankings" element={<NCAABRankingsPage />} />
                                        <Route path="ncaab/bracket" element={<NCAABBracketPage />} />

                                        {/* Misc. Sports Section */}
                                        <Route path="world-cup-2026" element={<WorldCup2026Screen />} />
                                        <Route path="tennis/players" element={<TennisPlayers />} />
                                        <Route path="tennis/tournaments" element={<TennisTournaments />} />
                                        <Route path="tennis/matches" element={<TennisMatches />} />
                                        <Route path="golf/players" element={<GolfPlayers />} />
                                        <Route path="golf/tournaments" element={<GolfTournaments />} />
                                        <Route path="golf/leaderboard" element={<GolfLeaderboard />} />
                                      </Route>
                                    </Route>

                                    {/* Catch-all */}
                                    <Route path="*" element={<Navigate to="/" replace />} />
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
