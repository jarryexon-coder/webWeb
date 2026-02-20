// services/oddsService.ts
interface OddsData {
  sport: string;
  matchups: Matchup[];
  timestamp: string;
}

interface Matchup {
  homeTeam: string;
  awayTeam: string;
  spread: string;
  overUnder: number;
  moneyline: {
    home: number;
    away: number;
  };
  publicBetting?: {
    home: number;
    away: number;
  };
}

export class OddsService {
  private static instance: OddsService;
  private cache: Map<string, OddsData> = new Map();

  static getInstance(): OddsService {
    if (!OddsService.instance) {
      OddsService.instance = new OddsService();
    }
    return OddsService.instance;
  }

  async getLiveOdds(sport: string = 'nba'): Promise<OddsData | null> {
    try {
      // Try multiple sources
      const sources = [
        this.fetchFromESPN(sport),
        this.fetchFromActionNetwork(sport)
      ];

      const results = await Promise.any(sources);
      return results;
    } catch (error) {
      console.error('All odds sources failed:', error);
      return null;
    }
  }

  private async fetchFromESPN(sport: string): Promise<OddsData> {
    const response = await fetch(
      `https://site.api.espn.com/apis/site/v2/sports/${this.getESPNsport(sport)}/scoreboard`
    );
    return response.json();
  }

  private async fetchFromActionNetwork(sport: string): Promise<OddsData> {
    // Implementation for Action Network
    throw new Error('Not implemented');
  }

  private getESPNsport(sport: string): string {
    const map: Record<string, string> = {
      nba: 'basketball/nba',
      nfl: 'football/nfl',
      mlb: 'baseball/mlb',
      nhl: 'hockey/nhl'
    };
    return map[sport] || 'basketball/nba';
  }
}
