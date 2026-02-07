import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import type { Shift } from '../../types';
import { shiftApi } from '../../services/api';

interface ShiftState {
  currentShift: Shift | null;
  shiftHistory: Shift[];
  isLoading: boolean;
  error: string | null;
}

const initialState: ShiftState = {
  currentShift: null,
  shiftHistory: [],
  isLoading: false,
  error: null,
};

// Async thunks
export const fetchCurrentShift = createAsyncThunk(
  'shift/fetchCurrent',
  async (companyId: string) => {
    const response = await shiftApi.getCurrentShift(companyId);
    return response.data;
  }
);

export const openShift = createAsyncThunk(
  'shift/open',
  async (
    { 
      companyId, 
      registerId, 
      storeId, 
      accountId,
      cashStart 
    }: { 
      companyId: string; 
      registerId: string; 
      storeId: string; 
      accountId?: string;
      cashStart: number;
    },
    { rejectWithValue }
  ) => {
    try {
      const response = await shiftApi.openShift(companyId, {
        register_id: registerId,
        store_id: storeId,
        account_id: accountId,
        cash_start: cashStart,
      });
      if (!response.status) {
        return rejectWithValue(response.error || 'Failed to open shift');
      }
      return response.data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      return rejectWithValue(err.response?.data?.error || 'Failed to open shift');
    }
  }
);

export const closeShift = createAsyncThunk(
  'shift/close',
  async (
    { 
      companyId, 
      shiftId, 
      cashEnd, 
      notes 
    }: { 
      companyId: string; 
      shiftId: string; 
      cashEnd: number; 
      notes?: string;
    },
    { rejectWithValue }
  ) => {
    try {
      const response = await shiftApi.closeShift(companyId, {
        shift_id: shiftId,
        cash_end: cashEnd,
        notes,
      });
      if (!response.status) {
        return rejectWithValue(response.error || 'Failed to close shift');
      }
      return response.data;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      return rejectWithValue(err.response?.data?.error || 'Failed to close shift');
    }
  }
);

export const fetchShiftHistory = createAsyncThunk(
  'shift/fetchHistory',
  async ({ companyId, offset, limit }: { companyId: string; offset?: number; limit?: number }) => {
    const response = await shiftApi.getShiftHistory(companyId, offset, limit);
    return response.data;
  }
);

const shiftSlice = createSlice({
  name: 'shift',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    updateShiftStats: (state, action: PayloadAction<{ salesCount: number; salesTotal: number }>) => {
      if (state.currentShift) {
        state.currentShift.sales_count += action.payload.salesCount;
        state.currentShift.sales_total += action.payload.salesTotal;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch current shift
      .addCase(fetchCurrentShift.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchCurrentShift.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentShift = action.payload;
      })
      .addCase(fetchCurrentShift.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch shift';
      })
      // Open shift
      .addCase(openShift.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(openShift.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentShift = action.payload;
      })
      .addCase(openShift.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Close shift
      .addCase(closeShift.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(closeShift.fulfilled, (state, action) => {
        state.isLoading = false;
        state.shiftHistory.unshift(action.payload);
        state.currentShift = null;
      })
      .addCase(closeShift.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Fetch history
      .addCase(fetchShiftHistory.fulfilled, (state, action) => {
        state.shiftHistory = action.payload;
      });
  },
});

export const { clearError, updateShiftStats } = shiftSlice.actions;
export default shiftSlice.reducer;
