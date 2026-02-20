// config/api.config.ts
export const API_CONFIG = {
  deepseek: {
    baseUrl: 'https://api.deepseek.com/v1',
    models: {
      chat: 'deepseek-chat',
      analysis: 'deepseek-coder'
    },
    maxTokens: 1000,
    temperature: 0.7
  },
  
  scraping: {
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    timeout: 10000,
    retries: 3,
    retryDelay: 1000
  },
  
  cache: {
    defaultTTL: 5, // minutes
    secretPhrasesTTL: 5,
    oddsDataTTL: 2,
    aiAnalysisTTL: 15
  },
  
  endpoints: {
    espn: {
      nba: 'https://www.espn.com/nba/lines',
      nfl: 'https://www.espn.com/nfl/lines',
      mlb: 'https://www.espn.com/mlb/lines',
      api: 'https://site.api.espn.com/apis/site/v2/sports'
    },
    actionNetwork: 'https://www.actionnetwork.com',
    rotowire: 'https://www.rotowire.com/betting'
  }
};
