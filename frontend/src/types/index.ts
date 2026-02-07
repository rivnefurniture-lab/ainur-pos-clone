// ============================================
// Core Types - Matching Ainur's data structure
// ============================================

export interface User {
  _id: string;
  _client: string;
  name: string;
  email: string;
  role: 'owner' | 'admin' | 'manager' | 'cashier' | 'viewer';
}

export interface Store {
  _id: string;
  uuid?: string;
  name: string;
  shortname?: string;
  address?: string;
  description?: string;
  type: 'store' | 'warehouse' | 'office' | 'production';
  default?: boolean;
  deleted?: boolean;
  include?: boolean;
  balance: {
    income: number;
    outcome: number;
    balance: number;
  };
  created: number;
  updated?: number;
  _client: string;
}

export interface Product {
  _id: string;
  uuid?: string;
  name: string;
  sku?: string;
  code?: string;
  barcode?: string;
  type: 'inventory' | 'service' | 'kit' | 'ingredient';
  price: number;
  cost: number;
  purchase?: number;
  total_stock: number;
  categories: string[];
  stock: Record<string, number>;
  deleted?: boolean;
  created: number;
  updated?: number;
  _client: string;
}

export interface Category {
  _id: string;
  name: string;
  parent_id?: string;
  description?: string;
  sort_order?: number;
  _client: string;
}

export interface Customer {
  _id: string;
  uuid?: string;
  name: string;
  description?: string;
  type: 'person' | 'company';
  sex?: 'male' | 'female' | 'other';
  phones: string[];
  emails: string[];
  discount: number;
  discount_card?: string;
  bonus_balance: number;
  bonus_spent: number;
  cashback_rate: number;
  loyalty_type: 'none' | 'discount' | 'bonus' | 'cashback';
  debt: number;
  bday?: string;
  address: {
    actual?: string;
    legal?: string;
  };
  default?: boolean;
  deleted?: boolean;
  created: number;
  updated?: number;
  _client: string;
}

export interface Supplier {
  _id: string;
  uuid?: string;
  name: string;
  description?: string;
  phones: string[];
  emails: string[];
  site?: string;
  address: {
    actual?: string;
    legal?: string;
  };
  bank_details?: Record<string, unknown>;
  details?: string;
  discount: number;
  debt: number;
  rdebt: number;
  default?: boolean;
  deleted?: boolean;
  created: number;
  updated?: number;
  _client: string;
}

export interface Account {
  _id: string;
  uuid?: string;
  name: string;
  type: 'cash' | 'bank_account' | 'card' | 'online' | 'terminal' | 'other';
  balance: {
    income: number;
    outcome: number;
    balance: number;
  };
  bank_details?: Record<string, unknown>;
  include?: boolean;
  use_terminal?: boolean;
  deleted?: boolean;
  _register?: string;
  created: number;
  updated?: number;
  _client: string;
}

export interface Register {
  _id: string;
  uuid?: string;
  name: string;
  _store: string;
  store_name?: string;
  _account?: string;
  account_name?: string;
  _user?: string;
  active?: boolean;
  shift_open?: boolean;
  shift_opened_at?: string;
  last_active?: string;
  settings?: Record<string, unknown>;
  created: number;
  updated?: number;
  _client: string;
}

export interface MoneySource {
  _id: string;
  uuid?: string;
  name: string;
  type: 'income' | 'outcome' | 'transfer';
  direction: 'in' | 'out' | 'transfer';
  system?: boolean;
  default?: boolean;
  deleted?: boolean;
  created: number;
  updated?: number;
  _client: string;
}

export interface Shift {
  _id: string;
  uuid?: string;
  number: number;
  _register: string;
  register_name?: string;
  _store: string;
  store_name?: string;
  _user: string;
  _account?: string;
  status: 'open' | 'closed' | 'reconciled';
  cash_start: number;
  cash_end?: number;
  cash_expected?: number;
  difference?: number;
  sales_count: number;
  sales_total: number;
  returns_count?: number;
  returns_total?: number;
  transactions?: unknown[];
  opened: number;
  closed?: number;
  created: number;
  _client: string;
}

export interface DocumentItem {
  _id?: string;
  product_id?: string;
  product_name?: string;
  name?: string;
  barcode?: string;
  sku?: string;
  qty?: number;
  quantity?: number;
  price: number;
  cost?: number;
  discount?: number;
  discount_sum?: number;
  discount_percent?: number;
  sub?: number;
  sum?: number;
  total?: number;
  stock_before?: number;
  stock_after?: number;
  product?: {
    name?: string;
    sku?: string;
    barcode?: string;
    type?: string;
    categories?: string[];
  };
}

export interface Document {
  _id: string;
  uuid?: string;
  type: string;
  number: number;
  status: string;
  _store?: string;
  store_id?: string;
  store_name?: string;
  _target?: string;
  target_store_name?: string;
  _customer?: string;
  customer_id?: string;
  customer_name?: string;
  _supplier?: string;
  supplier_name?: string;
  _account?: string;
  _register?: string;
  _shift?: string;
  shift_id?: string;
  _user?: string;
  author_name?: string;
  items?: DocumentItem[];
  total: number;
  subtotal?: number;
  discount?: number;
  discount_percent?: number;
  tax_total?: number;
  paid?: number;
  debt?: number;
  cost_total?: number;
  profit?: number;
  payment_method?: 'cash' | 'card' | 'transfer' | 'online' | 'split' | 'credit';
  notes?: string;
  metadata?: Record<string, unknown>;
  deleted?: boolean;
  date: number;
  created?: number;
  updated?: number;
  _client?: string;
}

export interface MoneyMovement {
  _id: string;
  uuid?: string;
  type: 'income' | 'outcome' | 'transfer';
  amount: number;
  _from?: string;
  from_account_name?: string;
  _to?: string;
  to_account_name?: string;
  _source?: string;
  source_name?: string;
  _doc?: string;
  _shift?: string;
  _user: string;
  notes?: string;
  balance_before?: number;
  balance_after?: number;
  deleted?: boolean;
  date: number;
  created: number;
  _client: string;
}

// ============================================
// API Response Types
// ============================================

export interface ApiResponse<T> {
  status: boolean;
  error: string | null;
  objects?: number;
  total?: number;
  data: T;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  objects: number;
  total: number;
}

// ============================================
// Cart Types (for POS)
// ============================================

export interface CartItem {
  product: Product;
  quantity: number;
  price: number;
  discount: number;
  total: number;
}

export interface Cart {
  items: CartItem[];
  customer?: Customer;
  subtotal: number;
  discount: number;
  discountPercent: number;
  total: number;
  notes?: string;
}

// ============================================
// Form Types
// ============================================

export interface LoginForm {
  login: string;
  password: string;
}

export interface CustomerForm {
  name: string;
  description?: string;
  type: 'person' | 'company';
  sex?: 'male' | 'female' | 'other';
  phones: string[];
  emails: string[];
  discount: number;
  discount_card?: string;
  birthday?: string;
  address?: {
    actual?: string;
    legal?: string;
  };
  loyalty_type?: 'none' | 'discount' | 'bonus' | 'cashback';
}

export interface ProductForm {
  name: string;
  sku?: string;
  code?: string;
  barcode?: string;
  type: 'inventory' | 'service' | 'kit' | 'ingredient';
  price: number;
  cost: number;
  categories: string[];
}
