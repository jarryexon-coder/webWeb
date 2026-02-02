import React, { useState } from 'react'
import {
  SportsFootball as SportsFootballIcon,
  Newspaper as NewspaperIcon,
  EmojiEvents as EmojiEventsIcon,
  Person as PersonIcon,
  Feed as FeedIcon,
  AcUnit as AcUnitIcon,
  Analytics as AnalyticsIcon,
  AutoAwesome as AutoAwesomeIcon,
  AccountTree as AccountTreeIcon,
  Insights as InsightsIcon,
  Timeline as TimelineIcon,
  ShowChart as ShowChartIcon,
  Key as KeyIcon,
  Casino as CasinoIcon,
  SportsFootball as SportsFootballIcon,
  Newspaper as NewspaperIcon,
  EmojiEvents as EmojiEventsIcon,
  Person as PersonIcon,
  Feed as FeedIcon,
  AcUnit as AcUnitIcon,
  Analytics as AnalyticsIcon,
  AutoAwesome as AutoAwesomeIcon,
  AccountTree as AccountTreeIcon,
  Insights as InsightsIcon,
  Timeline as TimelineIcon,
  ShowChart as ShowChartIcon,
  Key as KeyIcon,
  Casino as CasinoIcon, Outlet } from 'react-router-dom'
import {
  AppBar,
  Box,
  CssBaseline,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import {
  SportsFootball as SportsFootballIcon,
  Newspaper as NewspaperIcon,
  EmojiEvents as EmojiEventsIcon,
  Person as PersonIcon,
  Feed as FeedIcon,
  AcUnit as AcUnitIcon,
  Analytics as AnalyticsIcon,
  AutoAwesome as AutoAwesomeIcon,
  AccountTree as AccountTreeIcon,
  Insights as InsightsIcon,
  Timeline as TimelineIcon,
  ShowChart as ShowChartIcon,
  Key as KeyIcon,
  Casino as CasinoIcon,
  SportsFootball as SportsFootballIcon,
  Newspaper as NewspaperIcon,
  EmojiEvents as EmojiEventsIcon,
  Person as PersonIcon,
  Feed as FeedIcon,
  AcUnit as AcUnitIcon,
  Analytics as AnalyticsIcon,
  AutoAwesome as AutoAwesomeIcon,
  AccountTree as AccountTreeIcon,
  Insights as InsightsIcon,
  Timeline as TimelineIcon,
  ShowChart as ShowChartIcon,
  Key as KeyIcon,
  Casino as CasinoIcon,
  Menu as MenuIcon,
  Home as HomeIcon,
  FlashOn as FlashIcon,
  TrendingUp as StatsChartIcon,
  AutoAwesome as SparklesIcon,
  Security as ShieldIcon,
  Star as StarIcon,
  Login as LoginIcon,
  BugReport as BugReportIcon,
} from '@mui/icons-material'

const drawerWidth = 240

const menuItems = [
  { text: 'Home', icon: <HomeIcon />, path: '/' },
  { text: 'Live Games', icon: <FlashIcon />, path: '/live-games' },
  { text: 'NFL Analytics', icon: <SportsFootballIcon />, path: '/nfl-analytics' },
  { text: 'News Desk', icon: <NewspaperIcon />, path: '/news-desk' },
  { text: 'Fantasy Hub', icon: <EmojiEventsIcon />, path: '/fantasy-hub' },
  { text: 'Player Stats', icon: <PersonIcon />, path: '/player-stats' },
  { text: 'Sports Wire', icon: <FeedIcon />, path: '/sports-wire' },
  { text: 'NHL Trends', icon: <AcUnitIcon />, path: '/nhl-trends' },
  { text: 'Match Analytics', icon: <AnalyticsIcon />, path: '/match-analytics' },
  { text: 'Daily Picks', icon: <AutoAwesomeIcon />, path: '/daily-picks' },
  { text: 'Parlay Architect', icon: <AccountTreeIcon />, path: '/parlay-architect' },
  { text: 'Advanced Analytics', icon: <InsightsIcon />, path: '/advanced-analytics' },
  { text: 'Predictions Outcome', icon: <TimelineIcon />, path: '/predictions-outcome' },
  { text: 'Kalshi Predictions', icon: <ShowChartIcon />, path: '/kalshi-predictions' },
  { text: 'Secret Phrases', icon: <KeyIcon />, path: '/secret-phrases' },
  { text: 'Prize Picks', icon: <CasinoIcon />, path: '/prize-picks' },
  { text: 'Subscription', icon: <StarIcon />, path: '/subscription' },
  { text: 'Login', icon: <LoginIcon />, path: '/login' },
  { text: 'Diagnostic', icon: <BugReportIcon />, path: '/diagnostic' },
];

const Layout = () => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen)
  }

  const drawer = (
    <Box>
      <Toolbar sx={{ bgcolor: 'primary.main', color: 'white' }}>
        <Typography variant="h6" noWrap>
          🏀 NBA Fantasy
        </Typography>
      </Toolbar>
      <List>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton href={item.path}>
              <ListItemIcon sx={{ color: 'primary.main' }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  )

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <CssBaseline />
      
      {/* App Bar */}
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
          bgcolor: 'background.paper',
          color: 'text.primary',
          borderBottom: 1,
          borderColor: 'divider',
        }}
      >
        <Toolbar>
          {isMobile && (
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
          )}
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            NBA Fantasy Dashboard
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {'1.0.0'}
          </Typography>
        </Toolbar>
      </AppBar>

      {/* Drawer */}
      <Box
        component="nav"
        sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
      >
        {isMobile ? (
          <Drawer
            variant="temporary"
            open={mobileOpen}
            onClose={handleDrawerToggle}
            ModalProps={{ keepMounted: true }}
            sx={{
              display: { xs: 'block', md: 'none' },
              '& .MuiDrawer-paper': {
                boxSizing: 'border-box',
                width: drawerWidth,
              },
            }}
          >
            {drawer}
          </Drawer>
        ) : (
          <Drawer
            variant="permanent"
            sx={{
              display: { xs: 'none', md: 'block' },
              '& .MuiDrawer-paper': {
                boxSizing: 'border-box',
                width: drawerWidth,
              },
            }}
            open
          >
            {drawer}
          </Drawer>
        )}
      </Box>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { md: `calc(100% - ${drawerWidth}px)` },
          mt: '64px', // AppBar height
          minHeight: 'calc(100vh - 64px)',
          background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%)',
        }}
      >
        <Outlet />
      </Box>
    </Box>
  )
}

export default Layout
