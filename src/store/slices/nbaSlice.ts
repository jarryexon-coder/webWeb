import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '@/services/api'

interface NBAPlayer {
  id: string
  name: string
  team: string
  position: string
  points: number
}

interface NBATeam {
  id: string
  name: string
  wins: number
  losses: number
}

interface NBAState {
  players: NBAPlayer[]
  teams: NBATeam[]
  games: any[]
  loading: boolean
  error: string | null
}

const initialState: NBAState = {
  players: [],
  teams: [],
  games: [],
  loading: false,
  error: null,
}

export const fetchNBAData = createAsyncThunk(
  'nba/fetchData',
  async (_, { rejectWithValue }) => {
    try {
      const [playersResponse, teamsResponse, gamesResponse] = await Promise.all([
        api.get('/api/players'),
        api.get('/api/teams'),
        api.get('/api/nba/games'),
      ])

      return {
        players: playersResponse.data.players || [],
        teams: teamsResponse.data.teams || [],
        games: gamesResponse.data.games || [],
      }
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch NBA data')
    }
  }
)

const nbaSlice = createSlice({
  name: 'nba',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchNBAData.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchNBAData.fulfilled, (state, action) => {
        state.loading = false
        state.players = action.payload.players
        state.teams = action.payload.teams
        state.games = action.payload.games
      })
      .addCase(fetchNBAData.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
  },
})

export const { clearError } = nbaSlice.actions
export default nbaSlice.reducer
