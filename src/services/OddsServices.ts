// Fetches live odds from multiple platforms
export interface OddsRequest {
  sport: string;
  markets: string[];
  platforms?: string[];
}

class OddsService {
  private readonly API_KEY = process.env.ODDS_API_KEY;
  private readonly THE_ODDS_API_KEY = process.env.THE_ODDS_API_KEY;

  async getLiveOdds(sport: string, region: 'us' | 'uk' | 'au' = 'us') {
    // Using The Odds API
    const response = await fetch(
      `https://api.the-odds-api.com/v4/sports/${sport}/odds/?apiKey=${this.THE_ODDS_API_KEY}&regions=${region}&markets=h2h,spreads,totals`
    );
    return response.json();
  }

  async getPlayerProps(sport: string, playerId?: string) {
    // Using RapidAPI Player Props
    const response = await fetch(
      `https://player-props-api.p.rapidapi.com/${sport}/props${playerId ? `?player=${playerId}` : ''}`,
      {
        headers: {
          'X-RapidAPI-Key': process.env.RAPIDAPI_KEY_PLAYER_PROPS,
          'X-RapidAPI-Host': 'player-props-api.p.rapidapi.com'
        }
      }
    );
    return response.json();
  }
}

export default new OddsService();
