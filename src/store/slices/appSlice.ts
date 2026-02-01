import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '@/services/api'

interface AppState {
  initialized: boolean
  loading: boolean
  error: string | null
  backendStatus: {
    connected: boolean
    responseTime: number | null
    lastChecked: string | null
  }
}

const initialState: AppState = {
  initialized: false,
  loading: false,
  error: null,
  backendStatus: {
    connected: false,
    responseTime: null,
    lastChecked: null,
  },
}

export const initializeApp = createAsyncThunk(
  'app/initialize',
  async (_, { rejectWithValue }) => {
    try {
      // Test backend connection
      const startTime = Date.now()
      const response = await api.get('/health')
      const responseTime = Date.now() - startTime

      return {
        responseTime,
        status: response.data.status,
        timestamp: new Date().toISOString(),
      }
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to initialize app')
    }
  }
)

const appSlice = createSlice({
  name: 'app',
  initialState,
  reducers: {
    setLoading: (state, action) => {
      state.loading = action.payload
    },
    setError: (state, action) => {
      state.error = action.payload
    },
    clearError: (state) => {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(initializeApp.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(initializeApp.fulfilled, (state, action) => {
        state.loading = false
        state.initialized = true
        state.backendStatus = {
          connected: true,
          responseTime: action.payload.responseTime,
          lastChecked: action.payload.timestamp,
        }
      })
      .addCase(initializeApp.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
        state.backendStatus.connected = false
      })
  },
})

export const { setLoading, setError, clearError } = appSlice.actions
export default appSlice.reducer
