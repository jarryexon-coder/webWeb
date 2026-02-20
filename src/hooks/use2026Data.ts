import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface TwentyTwentySixMarket {
  id: string;
  type: 'worldcup' | 'allstar' | 'futures' | 'altline' | 'playoff';
  sport: string;
  question: string;
  yesPrice: number;
  noPrice: number;
  volume: string;
  analysis: string;
  expires: string;
  confidence: number;
  edge: string;
  platform: string;
  marketType: string;
  season: '2025-26';
}

export interface TwentyTwentySixOutcome {
  id: string;
  player?: string;
  team?: string;
  prediction: string;
  actual_result: string;
  accuracy: number;
  outcome: 'correct' | 'incorrect' | 'partially-correct';
  date: string;
  edge?: number;
  confidence_pre_game?: number;
}

export const use2026Data = () => {
  const [worldCupMarkets, setWorldCupMarkets] = useState<TwentyTwentySixMarket[]>([]);
  const [allStarMarkets, setAllStarMarkets] = useState<TwentyTwentySixMarket[]>([]);
  const [futuresMarkets, setFuturesMarkets] = useState<TwentyTwentySixMarket[]>([]);
  const [altLineMarkets, setAltLineMarkets] = useState<TwentyTwentySixMarket[]>([]);
  const [recentOutcomes, setRecentOutcomes] = useState<TwentyTwentySixOutcome[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>('');

  const fetch2026Markets = useCallback(async (sport?: string) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        season: '2025-26',
        as_of: '2026-02-11'
      });
      if (sport) params.append('sport', sport);

      const response = await fetch(`/api/predictions?${params}`);
      const data = await response.json();

      if (data.success) {
        // Filter markets by type
        const markets = data.predictions || [];
        
        setWorldCupMarkets(markets.filter((m: any) => 
          m.question?.includes('World Cup') || m.tournament === 'World Cup 2026'
        ));
        
        setAllStarMarkets(markets.filter((m: any) => 
          m.question?.includes('All-Star') || m.category === 'NBA All-Star'
        ));
        
        setFuturesMarkets(markets.filter((m: any) => 
          m.marketType === 'futures' || 
          m.question?.includes('ROTY') || 
          m.question?.includes('MVP') || 
          m.question?.includes('Cy Young')
        ));
        
        setAltLineMarkets(markets.filter((m: any) => 
          m.marketType === 'alt_line' || 
          m.question?.includes('Points +') ||
          m.stat_type?.includes('+')
        ));
        
        setLastUpdated(new Date().toISOString());
        
        // Cache to AsyncStorage
        await AsyncStorage.setItem('2026_markets', JSON.stringify({
          worldCup: worldCupMarkets,
          allStar: allStarMarkets,
          futures: futuresMarkets,
          altLines: altLineMarkets,
          timestamp: new Date().toISOString()
        }));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch 2026 markets');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchRecentOutcomes = useCallback(async (sport: string = 'nba') => {
    try {
      const response = await fetch(`/api/predictions/outcome?sport=${sport}&season=2025-26&days=7`);
      const data = await response.json();
      
      if (data.success) {
        setRecentOutcomes(data.outcomes.slice(0, 10)); // Last 10 outcomes
      }
    } catch (err) {
      console.error('Error fetching recent outcomes:', err);
    }
  }, []);

  const getMarketById = useCallback((id: string) => {
    const allMarkets = [...worldCupMarkets, ...allStarMarkets, ...futuresMarkets, ...altLineMarkets];
    return allMarkets.find(market => market.id === id);
  }, [worldCupMarkets, allStarMarkets, futuresMarkets, altLineMarkets]);

  const getStats = useCallback(() => {
    const totalMarkets = worldCupMarkets.length + allStarMarkets.length + 
                        futuresMarkets.length + altLineMarkets.length;
    
    const avgConfidence = [...worldCupMarkets, ...allStarMarkets, ...futuresMarkets, ...altLineMarkets]
      .reduce((acc, m) => acc + (m.confidence || 0), 0) / totalMarkets || 0;

    return {
      totalMarkets,
      avgConfidence: Math.round(avgConfidence),
      worldCupCount: worldCupMarkets.length,
      allStarCount: allStarMarkets.length,
      futuresCount: futuresMarkets.length,
      altLineCount: altLineMarkets.length,
      lastUpdated
    };
  }, [worldCupMarkets, allStarMarkets, futuresMarkets, altLineMarkets, lastUpdated]);

  useEffect(() => {
    // Load cached data on mount
    const loadCachedData = async () => {
      try {
        const cached = await AsyncStorage.getItem('2026_markets');
        if (cached) {
          const parsed = JSON.parse(cached);
          setWorldCupMarkets(parsed.worldCup || []);
          setAllStarMarkets(parsed.allStar || []);
          setFuturesMarkets(parsed.futures || []);
          setAltLineMarkets(parsed.altLines || []);
          setLastUpdated(parsed.timestamp);
        }
      } catch (err) {
        console.error('Error loading cached 2026 data:', err);
      }
    };

    loadCachedData();
    fetch2026Markets();
    fetchRecentOutcomes();
  }, []);

  return {
    worldCupMarkets,
    allStarMarkets,
    futuresMarkets,
    altLineMarkets,
    recentOutcomes,
    isLoading,
    error,
    lastUpdated,
    fetch2026Markets,
    fetchRecentOutcomes,
    getMarketById,
    getStats
  };
};
