// src/utils/oddsCalculators.ts

/**
 * Odds conversion utilities
 */

/**
 * Converts American odds to decimal format
 * @param american - American odds (e.g., -110, +150)
 * @returns Decimal odds (e.g., 1.91, 2.50)
 */
export const americanToDecimal = (american: number): number => {
  if (american > 0) {
    return (american / 100) + 1;
  }
  return (100 / Math.abs(american)) + 1;
};

/**
 * Converts decimal odds to American format
 * @param decimal - Decimal odds (must be >= 1.01)
 * @returns American odds as string (e.g., "-110", "+150")
 */
export const decimalToAmerican = (decimal: number): string => {
  if (decimal < 1.01) {
    throw new Error('Decimal odds must be at least 1.01');
  }
  
  if (decimal >= 2) {
    return `+${Math.round((decimal - 1) * 100)}`;
  }
  return `${Math.round(-100 / (decimal - 1))}`;
};

/**
 * Calculates combined parlay odds from multiple bets
 * @param legs - Array of leg objects containing odds
 * @returns Combined odds in American format as string
 */
export const calculateParlayOdds = (legs: { odds: number }[]): string => {
  if (!legs || legs.length === 0) {
    return 'N/A';
  }

  // Convert each leg to decimal odds and multiply
  const totalDecimal = legs.reduce((acc, leg) => {
    const decimal = americanToDecimal(leg.odds);
    return acc * decimal;
  }, 1);
  
  // Convert back to American odds
  return decimalToAmerican(totalDecimal);
};

/**
 * Calculates the implied probability from American odds
 * @param americanOdds - American odds value
 * @returns Implied probability as a decimal (0-1)
 */
export const calculateImpliedProbability = (americanOdds: number): number => {
  if (americanOdds > 0) {
    return 100 / (americanOdds + 100);
  }
  return Math.abs(americanOdds) / (Math.abs(americanOdds) + 100);
};

/**
 * Calculates payout amount based on stake and odds
 * @param stake - Wagered amount
 * @param odds - American odds
 * @returns Total payout (stake + profit)
 */
export const calculatePayout = (stake: number, odds: number): number => {
  const decimalOdds = americanToDecimal(odds);
  return stake * decimalOdds;
};

/**
 * Calculates profit amount based on stake and odds
 * @param stake - Wagered amount
 * @param odds - American odds
 * @returns Profit amount (payout - stake)
 */
export const calculateProfit = (stake: number, odds: number): number => {
  const payout = calculatePayout(stake, odds);
  return payout - stake;
};

/**
 * Calculates the expected value of a bet
 * @param impliedProb - Market implied probability (0-1)
 * @param modelProb - Your model's probability (0-1)
 * @param odds - American odds
 * @returns Expected value as decimal (e.g., 0.15 = +15% EV)
 */
export const calculateExpectedValue = (
  impliedProb: number,
  modelProb: number,
  odds: number
): number => {
  const decimalOdds = americanToDecimal(odds);
  return (modelProb * decimalOdds) - 1;
};

/**
 * Validates if two bets are correlated
 * @param leg1 - First parlay leg
 * @param leg2 - Second parlay leg
 * @returns True if bets are correlated
 */
export const validateCorrelation = (
  leg1: { eventId: string; marketId: string },
  leg2: { eventId: string; marketId: string }
): boolean => {
  // Same event correlation
  if (leg1.eventId === leg2.eventId) {
    return true;
  }
  
  // TODO: Add more sophisticated correlation logic
  // - Same game parlays
  // - Related props (QB passing yards + WR receiving yards)
  // - Division rivals with head-to-head implications
  
  return false;
};

/**
 * Calculates correlation factor for a set of legs
 * @param legs - Array of parlay legs
 * @returns Correlation factor (1 = no correlation, >1 = positive correlation)
 */
export const calculateCorrelationFactor = (legs: any[]): number => {
  if (legs.length < 2) return 1;
  
  let correlationCount = 0;
  let totalPairs = 0;
  
  for (let i = 0; i < legs.length; i++) {
    for (let j = i + 1; j < legs.length; j++) {
      totalPairs++;
      if (validateCorrelation(legs[i], legs[j])) {
        correlationCount++;
      }
    }
  }
  
  // Simple correlation factor: more correlated pairs = higher factor
  // This could be refined with actual correlation coefficients
  return 1 + (correlationCount / totalPairs) * 0.5;
};

interface RoundRobinCombo {
  legs: any[];
  combinedOdds: number;
  payout: number;
}

/**
 * Calculates payouts for round robin combinations
 * @param legs - All available legs
 * @param stakePerCombo - Stake amount for each combination
 * @param comboSize - Size of each parlay (2 for 2-leg parlays, 3 for 3-leg, etc.)
 * @returns Array of combination payouts
 */
export const calculateRoundRobinPayouts = (
  legs: any[],
  stakePerCombo: number,
  comboSize: number = 2
): RoundRobinCombo[] => {
  const combinations: RoundRobinCombo[] = [];
  
  // Generate all combinations of specified size
  const generateCombinations = (start: number, current: any[]) => {
    if (current.length === comboSize) {
      // Calculate parlay odds for this combination
      const decimalOdds = current.reduce((acc, leg) => {
        return acc * americanToDecimal(leg.odds);
      }, 1);
      
      combinations.push({
        legs: [...current],
        combinedOdds: decimalOdds,
        payout: stakePerCombo * decimalOdds
      });
      return;
    }
    
    for (let i = start; i < legs.length; i++) {
      current.push(legs[i]);
      generateCombinations(i + 1, current);
      current.pop();
    }
  };
  
  generateCombinations(0, []);
  return combinations;
};

/**
 * Calculates the break-even percentage for a parlay
 * @param legs - Array of parlay legs
 * @returns Break-even win rate as decimal
 */
export const calculateParlayBreakEven = (legs: { odds: number }[]): number => {
  const decimalOdds = legs.reduce((acc, leg) => {
    return acc * americanToDecimal(leg.odds);
  }, 1);
  
  return 1 / decimalOdds;
};

/**
 * Formats odds with proper sign and no decimal places
 * @param odds - American odds value
 * @returns Formatted odds string
 */
export const formatOdds = (odds: number): string => {
  if (odds > 0) {
    return `+${odds}`;
  }
  return odds.toString();
};

/**
 * Parses a formatted odds string to number
 * @param oddsString - Formatted odds (e.g., "+150", "-110")
 * @returns Numeric odds value
 */
export const parseOdds = (oddsString: string): number => {
  return parseInt(oddsString, 10);
};
