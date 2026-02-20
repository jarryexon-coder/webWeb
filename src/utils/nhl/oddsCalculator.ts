// Odds conversion utilities
export const oddsCalculator = {
  // American to Decimal
  americanToDecimal: (american: number): number => {
    if (american > 0) {
      return 1 + (american / 100);
    }
    return 1 + (100 / Math.abs(american));
  },

  // Decimal to American
  decimalToAmerican: (decimal: number): number => {
    if (decimal >= 2) {
      return Math.round((decimal - 1) * 100);
    }
    return Math.round(-100 / (decimal - 1));
  },

  // Calculate implied probability
  impliedProbability: (american: number): number => {
    if (american > 0) {
      return 100 / (american + 100);
    }
    return Math.abs(american) / (Math.abs(american) + 100);
  },

  // Calculate parlay odds
  calculateParlayOdds: (legs: number[]): number => {
    const decimalOdds = legs.map(americanToDecimal);
    const parlayDecimal = decimalOdds.reduce((acc, odds) => acc * odds, 1);
    return decimalToAmerican(parlayDecimal);
  },

  // Calculate juice/vig
  calculateJuice: (odds1: number, odds2: number): number => {
    const imp1 = impliedProbability(odds1);
    const imp2 = impliedProbability(odds2);
    return (imp1 + imp2 - 1) * 100;
  }
};
