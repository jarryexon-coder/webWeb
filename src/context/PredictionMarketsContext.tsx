// src/context/PredictionMarketsContext.tsx
// Complete, production-ready Prediction Markets context
// Supports Kalshi, Polymarket, PrizePicks and other prediction markets
// Includes mock data — replace with real API endpoints when available

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

// ---------- Type Definitions ----------
export interface PredictionMarket {
  id: string
  title: string
  description: string
  category: 'sports' | 'politics' | 'economics' | 'entertainment' | 'other'
  endDate: string          // ISO 8601
  outcomes: Array<{
    id: string
    label: string
    probability: number    // 0.0 – 1.0
    price?: number         // decimal odds (optional)
  }>
  volume: number           // total volume traded
  source: 'kalshi' | 'polymarket' | 'prizepicks' | 'other'
  createdAt: string        // ISO 8601
}

export interface UserPosition {
  marketId: string
  outcomeId: string
  shares: number
  avgPrice: number
  currentValue: number
}

export interface ArbitrageOpportunity {
  id: string
  marketIds: string[]
  outcomes: Array<{
    marketId: string
    outcomeId: string
    price: number
  }>
  totalProbability: number
  profitMargin: number     // e.g. 0.03 = 3%
  stake: number            // recommended stake for the example
  profit: number
}

interface PredictionMarketsContextType {
  markets: PredictionMarket[]
  positions: UserPosition[]
  arbitrageOpportunities: ArbitrageOpportunity[]
  loading: boolean
  error: string | null
  fetchMarkets: () => Promise<void>
  fetchPositions: () => Promise<void>
  fetchArbitrageOpportunities: () => Promise<void>
  placeBet: (marketId: string, outcomeId: string, amount: number) => Promise<void>
  refreshAll: () => Promise<void>
}

// ---------- Context Creation ----------
const PredictionMarketsContext = createContext<PredictionMarketsContextType | null>(null)

export const usePredictionMarkets = () => {
  const context = useContext(PredictionMarketsContext)
  if (!context) {
    throw new Error('usePredictionMarkets must be used within a PredictionMarketsProvider')
  }
  return context
}

// ---------- Provider Component ----------
export const PredictionMarketsProvider = ({ children }: { children: ReactNode }) => {
  const [markets, setMarkets] = useState<PredictionMarket[]>([])
  const [positions, setPositions] = useState<UserPosition[]>([])
  const [arbitrageOpportunities, setArbitrageOpportunities] = useState<ArbitrageOpportunity[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  // ---------- API Mock Functions (replace with real endpoints) ----------
  const fetchMarkets = async () => {
    setLoading(true)
    setError(null)
    try {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 500))

      // Mock data – February 2026 active markets
      const mockMarkets: PredictionMarket[] = [
        {
          id: 'nba-sga-pts-260215',
          title: 'Will Shai Gilgeous‑Alexander score over 31.5 points?',
          description: 'Oklahoma City Thunder vs Memphis Grizzlies',
          category: 'sports',
          endDate: '2026-02-15T03:00:00Z',
          outcomes: [
            { id: 'over', label: 'Over 31.5', probability: 0.48, price: 2.08 },
            { id: 'under', label: 'Under 31.5', probability: 0.52, price: 1.92 }
          ],
          volume: 2100000,
          source: 'kalshi',
          createdAt: '2026-02-13T10:00:00Z'
        },
        {
          id: 'nhl-mcdavid-pts-260214',
          title: 'Connor McDavid – total points O/U 1.5',
          description: 'Edmonton Oilers vs Toronto Maple Leafs',
          category: 'sports',
          endDate: '2026-02-14T02:00:00Z',
          outcomes: [
            { id: 'over', label: 'Over 1.5', probability: 0.41, price: 2.44 },
            { id: 'under', label: 'Under 1.5', probability: 0.59, price: 1.69 }
          ],
          volume: 950000,
          source: 'polymarket',
          createdAt: '2026-02-13T14:30:00Z'
        },
        {
          id: 'wc26-qual-usa',
          title: 'USA to win CONCACAF World Cup qualifier?',
          description: 'USA vs Mexico – February 2026',
          category: 'sports',
          endDate: '2026-02-28T23:00:00Z',
          outcomes: [
            { id: 'yes', label: 'Yes', probability: 0.62, price: 1.61 },
            { id: 'no', label: 'No', probability: 0.38, price: 2.63 }
          ],
          volume: 3400000,
          source: 'kalshi',
          createdAt: '2026-02-10T09:15:00Z'
        }
      ]

      setMarkets(mockMarkets)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch prediction markets')
    } finally {
      setLoading(false)
    }
  }

  const fetchPositions = async () => {
    setLoading(true)
    setError(null)
    try {
      await new Promise(resolve => setTimeout(resolve, 300))

      // Mock user positions – will be replaced by real API data
      const mockPositions: UserPosition[] = [
        {
          marketId: 'nba-sga-pts-260215',
          outcomeId: 'over',
          shares: 15,
          avgPrice: 2.05,
          currentValue: 31.2
        }
      ]

      setPositions(mockPositions)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch positions')
    } finally {
      setLoading(false)
    }
  }

  const fetchArbitrageOpportunities = async () => {
    setLoading(true)
    setError(null)
    try {
      await new Promise(resolve => setTimeout(resolve, 400))

      const mockArbitrage: ArbitrageOpportunity[] = [
        {
          id: 'arb-sga-mcdavid',
          marketIds: ['nba-sga-pts-260215', 'nhl-mcdavid-pts-260214'],
          outcomes: [
            { marketId: 'nba-sga-pts-260215', outcomeId: 'over', price: 2.08 },
            { marketId: 'nhl-mcdavid-pts-260214', outcomeId: 'under', price: 1.69 }
          ],
          totalProbability: 0.97,
          profitMargin: 0.031,
          stake: 100,
          profit: 3.10
        }
      ]

      setArbitrageOpportunities(mockArbitrage)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch arbitrage opportunities')
    } finally {
      setLoading(false)
    }
  }

  // ---------- Place Bet (mock) ----------
  const placeBet = async (marketId: string, outcomeId: string, amount: number) => {
    setLoading(true)
    setError(null)
    try {
      await new Promise(resolve => setTimeout(resolve, 600))
      console.log(`🧾 Bet placed: ${marketId} – ${outcomeId} – $${amount}`)
      // In production: call API, then refresh positions
      await fetchPositions()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to place bet')
      throw err
    } finally {
      setLoading(false)
    }
  }

  // ---------- Refresh All Data ----------
  const refreshAll = async () => {
    await Promise.all([
      fetchMarkets(),
      fetchPositions(),
      fetchArbitrageOpportunities()
    ])
  }

  // ---------- Load initial data on mount ----------
  useEffect(() => {
    refreshAll()
  }, [])

  const value: PredictionMarketsContextType = {
    markets,
    positions,
    arbitrageOpportunities,
    loading,
    error,
    fetchMarkets,
    fetchPositions,
    fetchArbitrageOpportunities,
    placeBet,
    refreshAll
  }

  return (
    <PredictionMarketsContext.Provider value={value}>
      {children}
    </PredictionMarketsContext.Provider>
  )
}
