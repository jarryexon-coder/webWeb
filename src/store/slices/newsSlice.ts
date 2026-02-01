import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '@/services/api'

interface NewsArticle {
  id: string
  title: string
  summary: string
  source: string
  publishedAt: string
  url: string
}

interface NewsState {
  articles: NewsArticle[]
  loading: boolean
  error: string | null
}

const initialState: NewsState = {
  articles: [],
  loading: false,
  error: null,
}

export const fetchNews = createAsyncThunk(
  'news/fetch',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/api/news')
      return response.data.news || []
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch news')
    }
  }
)

const newsSlice = createSlice({
  name: 'news',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchNews.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchNews.fulfilled, (state, action) => {
        state.loading = false
        state.articles = action.payload
      })
      .addCase(fetchNews.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
  },
})

export const { clearError } = newsSlice.actions
export default newsSlice.reducer
