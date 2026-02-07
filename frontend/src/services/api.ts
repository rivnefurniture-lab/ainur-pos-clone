import axios from 'axios';
import type { 
  ApiResponse, 
  PaginatedResponse, 
  User, 
  Store, 
  Product, 
  Customer, 
  Supplier, 
  Account,
  Register,
  MoneySource,
  Shift,
  Document,
  MoneyMovement,
  LoginForm
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Create axios instance with credentials
const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'api': 'v3', // Match Ainur's header
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Don't redirect on 401 - we handle auth internally
    // This prevents redirect loops when using auto-login
    return Promise.reject(error);
  }
);

// ============================================
// Auth API
// ============================================

export const authApi = {
  login: async (data: LoginForm): Promise<ApiResponse<User>> => {
    const response = await api.post('/auth/login', data);
    return response.data;
  },

  logout: async (): Promise<ApiResponse<null>> => {
    const response = await api.post('/auth/logout');
    return response.data;
  },

  check: async (): Promise<ApiResponse<User>> => {
    const response = await api.get('/auth/status');
    return response.data;
  },
};

// ============================================
// Data API (using Ainur-style proxy pattern)
// ============================================

export const dataApi = {
  // Stores
  getStores: async (companyId: string): Promise<PaginatedResponse<Store>> => {
    const response = await api.get(`/data/${companyId}/stores`);
    return response.data;
  },

  createStore: async (companyId: string, data: Partial<Store>): Promise<ApiResponse<Store>> => {
    const response = await api.post(`/data/${companyId}/stores`, data);
    return response.data;
  },

  updateStore: async (companyId: string, storeId: string, data: Partial<Store>): Promise<ApiResponse<Store>> => {
    const response = await api.put(`/data/${companyId}/stores/${storeId}`, data);
    return response.data;
  },

  // Products
  getProducts: async (companyId: string, offset = 0, limit = 1000): Promise<PaginatedResponse<Product>> => {
    const response = await api.get(`/data/${companyId}/catalog`, {
      params: { offset, limit },
    });
    return response.data;
  },

  getCategories: async (companyId: string): Promise<ApiResponse<string[]>> => {
    const response = await api.get(`/data/${companyId}/catalog/categories`);
    return response.data;
  },

  createProduct: async (companyId: string, data: Partial<Product>): Promise<ApiResponse<Product>> => {
    const response = await api.post(`/data/${companyId}/catalog`, data);
    return response.data;
  },

  updateProduct: async (companyId: string, productId: string, data: Partial<Product>): Promise<ApiResponse<Product>> => {
    const response = await api.put(`/data/${companyId}/catalog/${productId}`, data);
    return response.data;
  },

  // Stock Stats
  getStockStats: async (companyId: string): Promise<ApiResponse<{
    totalQuantity: number;
    retailValue: number;
    costValue: number;
    zeroCostCount: number;
    negativeStockCount: number;
    expiredCount: number;
    productsCount: number;
  }>> => {
    const response = await api.get(`/data/${companyId}/stock-stats`);
    return response.data;
  },

  // Filtered Products (zero cost, negative stock, expired)
  getFilteredProducts: async (
    companyId: string, 
    filter: 'zero_cost' | 'negative_stock' | 'expired',
    offset = 0,
    limit = 1000
  ): Promise<PaginatedResponse<Product>> => {
    const response = await api.get(`/data/${companyId}/catalog/filtered`, {
      params: { filter, offset, limit },
    });
    // Parse numeric values from strings
    if (response.data.data) {
      response.data.data = response.data.data.map((p: any) => ({
        ...p,
        price: parseFloat(p.price) || 0,
        cost: parseFloat(p.cost) || 0,
        total_stock: parseFloat(p.total_stock) || parseFloat(p.total_qty) || 0,
        categories: Array.isArray(p.categories) ? p.categories : [],
      }));
    }
    return response.data;
  },

  // Customers
  getCustomers: async (companyId: string, offset = 0, limit = 1000): Promise<PaginatedResponse<Customer>> => {
    const response = await api.get(`/data/${companyId}/clients`, {
      params: { offset, limit },
    });
    return response.data;
  },

  createCustomer: async (companyId: string, data: Partial<Customer>): Promise<ApiResponse<Customer>> => {
    const response = await api.post(`/data/${companyId}/clients`, data);
    return response.data;
  },

  updateCustomer: async (companyId: string, customerId: string, data: Partial<Customer>): Promise<ApiResponse<Customer>> => {
    const response = await api.put(`/data/${companyId}/clients/${customerId}`, data);
    return response.data;
  },

  // Suppliers
  getSuppliers: async (companyId: string): Promise<PaginatedResponse<Supplier>> => {
    const response = await api.get(`/data/${companyId}/suppliers`);
    return response.data;
  },

  // Accounts
  getAccounts: async (companyId: string): Promise<PaginatedResponse<Account>> => {
    const response = await api.get(`/data/${companyId}/accounts`);
    return response.data;
  },

  // Registers
  getRegisters: async (companyId: string): Promise<PaginatedResponse<Register>> => {
    const response = await api.get(`/data/${companyId}/registers`);
    return response.data;
  },

  // Money Sources
  getSources: async (companyId: string): Promise<PaginatedResponse<MoneySource>> => {
    const response = await api.get(`/data/${companyId}/sources`);
    return response.data;
  },
};

// ============================================
// Document API
// ============================================

export const documentApi = {
  getDocuments: async (
    companyId: string,
    offset = 0,
    limit = 1000
  ): Promise<PaginatedResponse<Document>> => {
    const response = await api.get(`/docs/${companyId}/${offset}/${limit}`);
    return response.data;
  },

  getDocument: async (companyId: string, docId: string): Promise<ApiResponse<Document>> => {
    const response = await api.get(`/docs/${companyId}/doc/${docId}`);
    return response.data;
  },

  createDocument: async (companyId: string, data: Partial<Document>): Promise<ApiResponse<Document>> => {
    const response = await api.post(`/docs/${companyId}`, data);
    return response.data;
  },

  searchDocuments: async (
    companyId: string,
    filters: {
      types?: string[];
      stores?: string[];
      from?: number;
      to?: number;
      customer?: string;
      number?: number;
    },
    offset = 0,
    limit = 1000
  ): Promise<PaginatedResponse<Document>> => {
    const response = await api.post(`/search/docs/${companyId}/${offset}/${limit}`, filters);
    return response.data;
  },
};

// ============================================
// Shift API
// ============================================

export const shiftApi = {
  getCurrentShift: async (companyId: string): Promise<ApiResponse<Shift | null>> => {
    const response = await api.get(`/shift/${companyId}/current`);
    return response.data;
  },

  openShift: async (
    companyId: string,
    data: {
      register_id: string;
      store_id: string;
      account_id?: string;
      cash_start: number;
    }
  ): Promise<ApiResponse<Shift>> => {
    const response = await api.post(`/shift/${companyId}/open`, data);
    return response.data;
  },

  closeShift: async (
    companyId: string,
    data: {
      shift_id: string;
      cash_end: number;
      notes?: string;
    }
  ): Promise<ApiResponse<Shift>> => {
    const response = await api.post(`/shift/${companyId}/close`, data);
    return response.data;
  },

  getShiftHistory: async (
    companyId: string,
    offset = 0,
    limit = 100
  ): Promise<PaginatedResponse<Shift>> => {
    const response = await api.get(`/shift/${companyId}/history/${offset}/${limit}`);
    return response.data;
  },
};

// ============================================
// Search API
// ============================================

export const searchApi = {
  searchProducts: async (
    companyId: string,
    query: string,
    offset = 0,
    limit = 100
  ): Promise<PaginatedResponse<Product>> => {
    const response = await api.post(`/search/catalog/${companyId}/${offset}/${limit}`, { query });
    return response.data;
  },

  searchByBarcode: async (companyId: string, barcode: string): Promise<PaginatedResponse<Product>> => {
    const response = await api.post(`/search/catalog/${companyId}/0/1`, { barcode });
    return response.data;
  },

  searchCustomers: async (
    companyId: string,
    query: string,
    offset = 0,
    limit = 100
  ): Promise<PaginatedResponse<Customer>> => {
    const response = await api.post(`/search/clients/${companyId}/${offset}/${limit}`, { query });
    return response.data;
  },

  searchByDiscountCard: async (companyId: string, card: string): Promise<PaginatedResponse<Customer>> => {
    const response = await api.post(`/search/clients/${companyId}/0/1`, { discount_card: card });
    return response.data;
  },

  searchMoneyMovements: async (
    companyId: string,
    filters: {
      accounts?: string[];
      sources?: string[];
      from?: number;
      to?: number;
      type?: string;
    },
    offset = 0,
    limit = 1000
  ): Promise<PaginatedResponse<MoneyMovement>> => {
    const response = await api.post(`/search/money/${companyId}/${offset}/${limit}`, filters);
    return response.data;
  },
};

export default api;
