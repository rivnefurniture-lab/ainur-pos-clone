import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import type { 
  Product, 
  Customer, 
  Store, 
  Supplier, 
  Account, 
  Register, 
  MoneySource,
  Document
} from '../../types';
import { dataApi, documentApi } from '../../services/api';

interface DataState {
  products: Product[];
  productsTotal: number;
  categories: string[];
  customers: Customer[];
  customersTotal: number;
  stores: Store[];
  suppliers: Supplier[];
  accounts: Account[];
  registers: Register[];
  moneySources: MoneySource[];
  documents: Document[];
  documentsTotal: number;
  isLoading: boolean;
  error: string | null;
  selectedStore: Store | null;
  selectedRegister: Register | null;
}

const initialState: DataState = {
  products: [],
  productsTotal: 0,
  categories: [],
  customers: [],
  customersTotal: 0,
  stores: [],
  suppliers: [],
  accounts: [],
  registers: [],
  moneySources: [],
  documents: [],
  documentsTotal: 0,
  isLoading: false,
  error: null,
  selectedStore: null,
  selectedRegister: null,
};

// Async thunks
export const fetchProducts = createAsyncThunk(
  'data/fetchProducts',
  async ({ companyId, offset, limit }: { companyId: string; offset?: number; limit?: number }) => {
    const response = await dataApi.getProducts(companyId, offset, limit);
    return { data: response.data, total: response.total || 0 };
  }
);

export const fetchCategories = createAsyncThunk(
  'data/fetchCategories',
  async (companyId: string) => {
    const response = await dataApi.getCategories(companyId);
    return response.data;
  }
);

export const fetchCustomers = createAsyncThunk(
  'data/fetchCustomers',
  async ({ companyId, offset, limit }: { companyId: string; offset?: number; limit?: number }) => {
    const response = await dataApi.getCustomers(companyId, offset, limit);
    return { data: response.data, total: response.total || 0 };
  }
);

export const fetchStores = createAsyncThunk(
  'data/fetchStores',
  async (companyId: string) => {
    const response = await dataApi.getStores(companyId);
    return response.data;
  }
);

export const fetchSuppliers = createAsyncThunk(
  'data/fetchSuppliers',
  async (companyId: string) => {
    const response = await dataApi.getSuppliers(companyId);
    return response.data;
  }
);

export const fetchAccounts = createAsyncThunk(
  'data/fetchAccounts',
  async (companyId: string) => {
    const response = await dataApi.getAccounts(companyId);
    return response.data;
  }
);

export const fetchRegisters = createAsyncThunk(
  'data/fetchRegisters',
  async (companyId: string) => {
    const response = await dataApi.getRegisters(companyId);
    return response.data;
  }
);

export const fetchMoneySources = createAsyncThunk(
  'data/fetchMoneySources',
  async (companyId: string) => {
    const response = await dataApi.getSources(companyId);
    return response.data;
  }
);

export const fetchDocuments = createAsyncThunk(
  'data/fetchDocuments',
  async ({ companyId, offset, limit }: { companyId: string; offset?: number; limit?: number }) => {
    const response = await documentApi.getDocuments(companyId, offset, limit);
    return { data: response.data, total: response.total || 0 };
  }
);

export const fetchAllData = createAsyncThunk(
  'data/fetchAll',
  async (companyId: string, { dispatch }) => {
    await Promise.all([
      dispatch(fetchStores(companyId)),
      dispatch(fetchProducts({ companyId })),
      dispatch(fetchCategories(companyId)),
      dispatch(fetchCustomers({ companyId })),
      dispatch(fetchAccounts(companyId)),
      dispatch(fetchRegisters(companyId)),
      dispatch(fetchMoneySources(companyId)),
    ]);
  }
);

const dataSlice = createSlice({
  name: 'data',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setSelectedStore: (state, action: PayloadAction<Store | null>) => {
      state.selectedStore = action.payload;
    },
    setSelectedRegister: (state, action: PayloadAction<Register | null>) => {
      state.selectedRegister = action.payload;
    },
    addProduct: (state, action: PayloadAction<Product>) => {
      state.products.unshift(action.payload);
      state.productsTotal += 1;
    },
    updateProduct: (state, action: PayloadAction<Product>) => {
      const index = state.products.findIndex(p => p._id === action.payload._id);
      if (index !== -1) {
        state.products[index] = action.payload;
      }
    },
    addCustomer: (state, action: PayloadAction<Customer>) => {
      state.customers.unshift(action.payload);
      state.customersTotal += 1;
    },
    updateCustomer: (state, action: PayloadAction<Customer>) => {
      const index = state.customers.findIndex(c => c._id === action.payload._id);
      if (index !== -1) {
        state.customers[index] = action.payload;
      }
    },
    addDocument: (state, action: PayloadAction<Document>) => {
      state.documents.unshift(action.payload);
      state.documentsTotal += 1;
    },
  },
  extraReducers: (builder) => {
    builder
      // Products
      .addCase(fetchProducts.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.isLoading = false;
        state.products = action.payload.data;
        state.productsTotal = action.payload.total;
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch products';
      })
      // Categories
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.categories = action.payload;
      })
      // Customers
      .addCase(fetchCustomers.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchCustomers.fulfilled, (state, action) => {
        state.isLoading = false;
        state.customers = action.payload.data;
        state.customersTotal = action.payload.total;
      })
      .addCase(fetchCustomers.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch customers';
      })
      // Stores
      .addCase(fetchStores.fulfilled, (state, action) => {
        state.stores = action.payload;
        // Set default store
        const defaultStore = action.payload.find(s => s.default) || action.payload[0];
        if (defaultStore && !state.selectedStore) {
          state.selectedStore = defaultStore;
        }
      })
      // Suppliers
      .addCase(fetchSuppliers.fulfilled, (state, action) => {
        state.suppliers = action.payload;
      })
      // Accounts
      .addCase(fetchAccounts.fulfilled, (state, action) => {
        state.accounts = action.payload;
      })
      // Registers
      .addCase(fetchRegisters.fulfilled, (state, action) => {
        state.registers = action.payload;
        // Set first register if not selected
        if (action.payload.length > 0 && !state.selectedRegister) {
          state.selectedRegister = action.payload[0];
        }
      })
      // Money Sources
      .addCase(fetchMoneySources.fulfilled, (state, action) => {
        state.moneySources = action.payload;
      })
      // Documents
      .addCase(fetchDocuments.fulfilled, (state, action) => {
        state.documents = action.payload.data;
        state.documentsTotal = action.payload.total;
      });
  },
});

export const { 
  clearError, 
  setSelectedStore, 
  setSelectedRegister,
  addProduct,
  updateProduct,
  addCustomer,
  updateCustomer,
  addDocument,
} = dataSlice.actions;

export default dataSlice.reducer;
