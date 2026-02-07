import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import type { User, LoginForm } from '../../types';
import { authApi } from '../../services/api';

interface AuthState {
  user: User | null;
  companyId: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

// Auto-login user
const DEFAULT_USER = {
  _id: '58c872aa3ce7d5fc688b49bc',
  name: 'Олег Кицюк',
  email: 'o_kytsuk@mail.ru',
  role: 'admin' as const,
  _client: '58c872aa3ce7d5fc688b49bd',
};

const DEFAULT_COMPANY_ID = '58c872aa3ce7d5fc688b49bd';

const initialState: AuthState = {
  user: DEFAULT_USER,
  companyId: DEFAULT_COMPANY_ID,
  isAuthenticated: true,
  isLoading: false,
  error: null,
};

interface LoginResponse {
  user: User;
  client: { _id: string; name: string };
}

interface AuthCheckResponse {
  isAuthenticated: boolean;
  user: User | null;
  client: { _id: string; name: string } | null;
}

// Async thunks
export const login = createAsyncThunk(
  'auth/login',
  async (credentials: LoginForm, { rejectWithValue }) => {
    try {
      const response = await authApi.login(credentials);
      if (!response.status) {
        return rejectWithValue(response.error || 'Login failed');
      }
      // Response data is {user: {...}, client: {...}}
      return response.data as unknown as LoginResponse;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      return rejectWithValue(err.response?.data?.error || 'Login failed');
    }
  }
);

export const logout = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      await authApi.logout();
      return null;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      return rejectWithValue(err.response?.data?.error || 'Logout failed');
    }
  }
);

export const checkAuth = createAsyncThunk(
  'auth/check',
  async (_, { rejectWithValue }) => {
    try {
      const response = await authApi.check();
      const data = response.data as unknown as AuthCheckResponse;
      if (!response.status || !data?.isAuthenticated) {
        return rejectWithValue('Not authenticated');
      }
      return data;
    } catch {
      return rejectWithValue('Not authenticated');
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
      state.isAuthenticated = true;
    },
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(login.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.companyId = action.payload.client._id;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Logout
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.companyId = null;
        state.isAuthenticated = false;
      })
      // Check auth
      .addCase(checkAuth.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(checkAuth.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.companyId = action.payload.client?._id || null;
        state.isAuthenticated = true;
      })
      .addCase(checkAuth.rejected, (state) => {
        state.isLoading = false;
        state.user = null;
        state.companyId = null;
        state.isAuthenticated = false;
      });
  },
});

export const { clearError, setUser } = authSlice.actions;
export default authSlice.reducer;
