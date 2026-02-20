export const parlayCalculators = {
  calculateImpliedProbability(americanOdds: number): number {
    if (americanOdds > 0) {
      return 100 / (americanOdds + 100);
    } else {
      return Math.abs(americanOdds) / (Math.abs(americanOdds) + 100);
    }
  },

  calculateParlayOdds(odds: number[]): number {
    let decimalOdds = odds.map(odd => {
      if (odd > 0) {
        return odd / 100 + 1;
      } else {
        return 100 / Math.abs(odd) + 1;
      }
    });
    
    const parlayDecimal = decimalOdds.reduce((acc, curr) => acc * curr, 1);
    
    // Convert back to American odds
    if (parlayDecimal >= 2) {
      return Math.round((parlayDecimal - 1) * 100);
    } else {
      return Math.round(-100 / (parlayDecimal - 1));
    }
  },

  calculateCorrelationFactor(legs: string[], historicalData: any): number {
    // Calculate statistical correlation between parlay legs
    // Returns value between -1 and 1
    return 0.68; // Placeholder implementation
  },

  calculateOptimalLegCount(parlayType: string, sport: string): number {
    const baseCounts = {
      standard: 3,
      same_game: 4,
      teaser: 6,
      pleaser: 2
    };
    
    const sportAdjustments = {
      nba: { standard: 0.5, same_game: 0.2 },
      nfl: { standard: -0.2, same_game: -0.5 },
      nhl: { standard: 0.2, same_game: -0.2 },
      mlb: { standard: -0.5, same_game: -1.0 }
    };
    
    const base = baseCounts[parlayType] || 3;
    const adjustment = sportAdjustments[sport]?.[parlayType] || 0;
    
    return Math.max(1, Math.min(10, Math.round(base + adjustment)));
  },

  calculateValueThreshold(league: string, parlayType: string): string {
    const thresholds = {
      nba: { standard: '+150', same_game: '+225', teaser: '-110', pleaser: '+300' },
      nfl: { standard: '+140', same_game: '+200', teaser: '-115', pleaser: '+280' },
      nhl: { standard: '+145', same_game: '+210', teaser: '-120', pleaser: '+290' },
      mlb: { standard: '+135', same_game: '+190', teaser: '-125', pleaser: '+275' }
    };
    
    return thresholds[league]?.[parlayType] || '+150';
  }
};
