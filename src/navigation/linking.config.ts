export const linking = {
  prefixes: ['yourapp://', 'https://yourapp.com'],
  config: {
    screens: {
      MainTabs: {
        screens: {
          Home: 'home',
          Parlay: 'parlay',
          Analytics: {
            screens: {
              AnalyticsDashboard: 'analytics',
              AdvancedAnalytics: {
                path: 'analytics/advanced/:sport?',
                parse: {
                  sport: (sport: string) => sport || 'all',
                },
              },
              PropDetails: {
                path: 'analytics/props/:player/:prop',
                parse: {
                  player: (player: string) => decodeURIComponent(player),
                  prop: (prop: string) => decodeURIComponent(prop),
                },
              },
              CorrelatedParlayDetails: {
                path: 'analytics/correlated/:parlayId',
              },
              SportSpecificAnalytics: {
                path: 'analytics/sport/:sport',
              },
            },
          },
          Profile: 'profile',
        },
      },
      Auth: 'auth',
      Onboarding: 'onboarding',
      ParlayBuilder: 'builder',
    },
  },
};
