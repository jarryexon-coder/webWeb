import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '@/services/api'

interface Game {
  id: string
  homeTeam: string
  awayTeam: string
  homeScore: number
  awayScore: number
  status: 'scheduled' | 'live' | 'finished'
  startTime: string
}

interface GamesState {
  games: Game[]
  loading: boolean
  error: string | null
}

const initialState: GamesState = {
  games: [],
  loading: false,
  error: null,
}

export const fetchGames = createAsyncThunk(
  'games/fetch',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/api/nba/games')
      return response.data.games || []
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch games')
    }
  }
)

const gamesSlice = createSlice({
  name: 'games',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchGames.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchGames.fulfilled, (state, action) => {
        state.loading = false
        state.games = action.payload
      })
      .addCase(fetchGames.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
  },
})

export const { clearError } = gamesSlice.actions
export default gamesSlice.reducer
