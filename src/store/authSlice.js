import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

const BASE_URL = 'https://kenqo-api-409744260053.asia-south1.run.app';

// Async thunks
export const loginUser = createAsyncThunk(
  'auth/login',
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const response = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (!response.ok) {
        return rejectWithValue(data?.detail || data?.message || 'Invalid credentials');
      }
      // Persist token
      if (data.access_token) {
        localStorage.setItem('kenqo_token', data.access_token);
        localStorage.setItem('kenqo_user', JSON.stringify(data.user || data));
      }
      return data;
    } catch {
      return rejectWithValue('Network error. Please try again.');
    }
  }
);

export const registerUser = createAsyncThunk(
  'auth/register',
  async ({ full_name, email, password }, { rejectWithValue }) => {
    try {
      const response = await fetch(`${BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ full_name, email, password, role: 'admin' }),
      });
      const data = await response.json();
      if (!response.ok) {
        return rejectWithValue(data?.detail || data?.message || 'Registration failed');
      }
      return data;
    } catch {
      return rejectWithValue('Network error. Please try again.');
    }
  }
);

// Try to rehydrate from localStorage
const savedUser = (() => {
  try {
    const u = localStorage.getItem('kenqo_user');
    return u ? JSON.parse(u) : null;
  } catch {
    return null;
  }
})();
const savedToken = localStorage.getItem('kenqo_token');

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: savedUser,
    token: savedToken || null,
    isAuthenticated: !!(savedToken && savedUser),
    isLoading: false,
    error: null,
  },
  reducers: {
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.error = null;
      localStorage.removeItem('kenqo_token');
      localStorage.removeItem('kenqo_user');
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Login
    builder
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.token = action.payload.access_token || null;
        // API may return user nested or flat
        const user = action.payload.user || action.payload;
        state.user = {
          ...user,
          role: user.role || 'admin',
          name: user.full_name || user.name || user.email,
        };
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    // Register
    builder
      .addCase(registerUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state) => {
        state.isLoading = false;
        state.error = null;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export const { logout, clearError } = authSlice.actions;
export default authSlice.reducer;
