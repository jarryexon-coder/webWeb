// src/App.tsx – Complete Integrated Version with Authentication Flow
// April 2026 – Added GA4 automatic page view tracking for React Router
// SportsWireScreen now lazy-loaded and requires analytics plan

import React, { useState, useEffect, Suspense, lazy } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { initializeApp, getApps } from 'firebase/app';

// React Query
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

// Error Boundary
import { ErrorBoundary } from 'react-error-boundary';

// Context Providers
import { AuthProvider } from './contexts/AuthContext';
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
import { Container, Paper, Typography, Button, Box, CircularProgress } from '@mui/material';

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
import TutorialsScreen from './pages/TutorialsScreen';

// ---------- SUBSCRIPTION SUCCESS/CANCEL PAGES ----------
import SubscriptionSuccess from './pages/SubscriptionSuccess';
import SubscriptionCancel from './pages/SubscriptionCancel';

// ---------- CHECKOUT SUCCESS PAGE (for influencers & one-time purchases) ----------
import CheckoutSuccess from './pages/CheckoutSuccess';

// ---------- NEW DASHBOARD & SUBSCRIPTION PAGES ----------
import SportsAnalyticsDashboard from './pages/SportsAnalyticsDashboard';
import SubscriptionScreen from './pages/SubscriptionScreen';

// ---------- NEW INFO PAGES (FAQ, INFO, ABOUT, SETTINGS) ----------
import FAQPage from './pages/FAQPage';
import InfoPage from './pages/InfoPage';
import AboutPage from './pages/AboutPage';
import SettingsPage from './pages/SettingsPage';

// ---------- NHL SCREENS ----------
import NHLTrendsScreen from './pages/NHLTrendsScreen';

// ---------- NCAAB SCREENS ----------
import NCAABGamesPage from './pages/ncaab/NCAABGamesPage';
import NCAABGameDetailPage from './pages/ncaab/NCAABGameDetailPage';
import NCAABStandingsPage from './pages/ncaab/NCAABStandingsPage';
import NCAABPlayersPage from './pages/ncaab/NCAABPlayersPage';
import NCAABPlayerDetailPage from './pages/ncaab/NCAABPlayerDetailPage';
import NCAABTeamsPage from './pages/ncaab/NCAABTeamsPage';
import NCAABTeamDetailPage from './pages/ncaab/NCAABTeamDetailPage';
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

// ---------- PLAYER DETAIL SCREEN ----------
import PlayerDetailPage from './pages/PlayerDetailPage';

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
const SportsWireScreen = lazy(() => import('./pages/SportsWireScreen')); // Now lazy-loaded
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

// ---------- Route Guard Components ----------
import PrivateRoute from './components/PrivateRoute';      // Authentication only
import ProtectedRoute from './components/ProtectedRoute'; // Plan-based access control

// ---------- GA4 Page View Tracking Hook ----------
declare global {
  interface Window {
    gtag: (...args: any[]) => void;
  }
}

function usePageViews() {
  const location = useLocation();
  useEffect(() => {
    if (typeof window.gtag === 'function') {
      window.gtag('config', 'G-QTSWN0T7JV', {
        'page_path': location.pathname + location.search,
      });
      console.log(`📊 GA4 page_view sent for: ${location.pathname}`);
    } else {
      console.warn('gtag not available for page view');
    }
  }, [location]);
}

// ---------- Main App Component ----------
function App() {
  // Firebase init (only auth, no analytics)
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
        initializeApp(firebaseConfig);
      }
    } catch (error) {
      console.error('Firebase error:', error);
    }
  }, []);

  // Enable automatic GA4 page view tracking
  usePageViews();

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <ErrorBoundary
          FallbackComponent={ErrorFallback}
          onReset={() => window.location.reload()}
        >
          <InfiniteLoopDetector />
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
                                <Routes>
                                  {/* Public routes */}
                                  <Route path="/" element={<IntroPage />} />
                                  <Route path="/login" element={<LoginScreenEnhanced />} />
                                  
                                  {/* Subscription Success/Cancel Pages */}
                                  <Route path="/subscription/success" element={<SubscriptionSuccess />} />
                                  <Route path="/subscription/cancel" element={<SubscriptionCancel />} />
                                  
                                  {/* Checkout Success Page (for influencers & one-time purchases) */}
                                  <Route path="/checkout-success" element={<CheckoutSuccess />} />

                                  {/* Private routes (require authentication) */}
                                  <Route element={<PrivateRoute />}>
                                    <Route element={<Layout />}>
                                      {/* ALL-ACCESS Section */}
                                      <Route path="/home" element={<HomeScreen />} />
                                      <Route path="live-games" element={<LiveGamesScreen />} />
                                      <Route path="newsdesk" element={<NewsDeskScreen />} />
                                      <Route path="team-rosters" element={<TeamRostersPage />} />
                                      <Route path="tutorials" element={<TutorialsScreen />} />

                                      {/* STATS Section */}
                                      <Route path="player-props" element={<PlayerPropsScreen />} />
                                      <Route path="player-stats" element={<Suspense fallback={<CircularProgress />}><PlayerStatsScreen /></Suspense>} />
                                      <Route path="player/:id" element={<PlayerDetailPage />} />
                                      <Route path="props-details/:id" element={<PlayerDetailPage />} />
                                      <Route path="match-analytics" element={<Suspense fallback={<CircularProgress />}><MatchAnalyticsScreen /></Suspense>} />
                                      <Route path="season-stats" element={<Suspense fallback={<CircularProgress />}><SeasonStatsScreen /></Suspense>} />
                                      <Route path="nhl-trends" element={<NHLTrendsScreen />} />

                                      {/* GENERATOR$ Section */}
                                      <Route path="daily-picks" element={<DailyPicksScreen />} />
                                      <Route path="secret-phrases" element={<Suspense fallback={<CircularProgress />}><SecretPhraseScreen /></Suspense>} />
                                      
                                      {/* SportsWireScreen – lazy-loaded and requires analytics plan */}
                                      <Route 
                                        path="sports-wire" 
                                        element={
                                          <ProtectedRoute 
                                            screenName="SportsWireScreen" 
                                            requiredFeature="analytics"
                                          >
                                            <Suspense fallback={<CircularProgress />}>
                                              <SportsWireScreen />
                                            </Suspense>
                                          </ProtectedRoute>
                                        } 
                                      />
                                      
                                      <Route path="prize-picks" element={<Suspense fallback={<CircularProgress />}><PrizePicksScreen /></Suspense>} />
                                      <Route path="fantasy-hub" element={<Suspense fallback={<CircularProgress />}><FantasyHubScreen /></Suspense>} />
                                      <Route path="advanced-analytics" element={<Suspense fallback={<CircularProgress />}><AdvancedAnalyticsScreen /></Suspense>} />
                                      <Route path="kalshi-predictions" element={<Suspense fallback={<CircularProgress />}><KalshiPredictionsScreen /></Suspense>} />
                                      <Route path="predictions-outcome" element={<Suspense fallback={<CircularProgress />}><PredictionsOutcomeScreen /></Suspense>} />

                                      {/* PARLAYPLUSPACKAGE-PPP Section */}
                                      <Route path="parlay-architect" element={<Suspense fallback={<CircularProgress />}><ParlayArchitectScreen /></Suspense>} />
                                      <Route path="same-game-parlay" element={<SameGameParlayScreen />} />
                                      <Route path="parlay-analytics" element={<ParlayAnalyticsScreen />} />
                                      <Route path="ai-suggestions" element={<AIParlaySuggestionsScreen />} />

                                      {/* DASHBOARDS Section */}
                                      <Route path="analytics-dashboard" element={<AnalyticsDashboardScreen />} />
                                      <Route path="nba-dashboard" element={<NBADashboard />} />
                                      <Route path="nhl-dashboard" element={<NHLDashboard />} />
                                      <Route path="mlb-spring-training" element={<MLBSpringTraining />} />

                                      {/* 👇 USER ACCOUNT Section 👇 */}
                                      <Route path="dashboard" element={<SportsAnalyticsDashboard />} />
                                      <Route path="pricing" element={<SubscriptionScreen />} />
                                      <Route path="subscription" element={<SubscriptionScreen />} />
                                      <Route path="billing" element={<SportsAnalyticsDashboard />} />

                                      {/* 👇 INFO & SUPPORT Pages 👇 */}
                                      <Route path="faq" element={<FAQPage />} />
                                      <Route path="info" element={<InfoPage />} />
                                      <Route path="about" element={<AboutPage />} />
                                      <Route path="settings" element={<SettingsPage />} />

                                      {/* NCAAB Section */}
                                      <Route path="ncaab/games" element={<NCAABGamesPage />} />
                                      <Route path="ncaab/games/:id" element={<NCAABGameDetailPage />} />
                                      <Route path="ncaab/standings" element={<NCAABStandingsPage />} />
                                      <Route path="ncaab/players" element={<NCAABPlayersPage />} />
                                      <Route path="ncaab/players/:id" element={<NCAABPlayerDetailPage />} />
                                      <Route path="ncaab/teams" element={<NCAABTeamsPage />} />
                                      <Route path="ncaab/teams/:id" element={<NCAABTeamDetailPage />} />
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
        </ErrorBoundary>
      </ThemeProvider>
      {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} position="bottom-right" />}
    </QueryClientProvider>
  );
}

export default App;
