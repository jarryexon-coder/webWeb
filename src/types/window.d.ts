export {};

declare global {
  interface Window {
    _dailyPicksDebug?: any;
    _fantasyHubDebug?: any;
    _kalshipredictionsscreenDebug?: any;
    _secretPhrasesDebug?: any;
    _advancedanalyticsscreenDebug?: any;
    [key: string]: any;
  }
}
