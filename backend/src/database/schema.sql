-- AinurPOS Clone - Complete PostgreSQL Schema
-- This schema matches the exact data structure from Ainur API

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables if they exist (in reverse dependency order)
DROP TABLE IF EXISTS document_products CASCADE;
DROP TABLE IF EXISTS documents CASCADE;
DROP TABLE IF EXISTS money_movements CASCADE;
DROP TABLE IF EXISTS shifts CASCADE;
DROP TABLE IF EXISTS product_stock CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS customers CASCADE;
DROP TABLE IF EXISTS suppliers CASCADE;
DROP TABLE IF EXISTS registers CASCADE;
DROP TABLE IF EXISTS accounts CASCADE;
DROP TABLE IF EXISTS money_sources CASCADE;
DROP TABLE IF EXISTS stores CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS companies CASCADE;

-- ============================================================================
-- CORE ENTITIES
-- ============================================================================

-- Companies (clients in Ainur)
CREATE TABLE companies (
    _id VARCHAR(24) PRIMARY KEY,
    uuid UUID DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    address TEXT,
    settings JSONB DEFAULT '{}',
    created BIGINT,
    updated BIGINT,
    created_ms DECIMAL(16,3),
    deleted BOOLEAN DEFAULT FALSE
);

-- Users
CREATE TABLE users (
    _id VARCHAR(24) PRIMARY KEY,
    uuid UUID DEFAULT uuid_generate_v4(),
    _client VARCHAR(24),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    pic TEXT,
    role VARCHAR(50) DEFAULT 'user',
    permissions JSONB DEFAULT '[]',
    created BIGINT,
    updated BIGINT,
    created_ms DECIMAL(16,3),
    deleted BOOLEAN DEFAULT FALSE
);

-- Stores/Warehouses
CREATE TABLE stores (
    _id VARCHAR(24) PRIMARY KEY,
    uuid UUID DEFAULT uuid_generate_v4(),
    _user VARCHAR(24),
    _client VARCHAR(24),
    _register VARCHAR(24),
    _app VARCHAR(20),
    name VARCHAR(255) NOT NULL,
    shortname VARCHAR(100),
    address TEXT,
    description TEXT,
    type VARCHAR(50) DEFAULT 'store',
    "default" BOOLEAN DEFAULT FALSE,
    include BOOLEAN DEFAULT TRUE,
    balance JSONB DEFAULT '{"income": 0, "outcome": 0, "balance": 0}',
    bank_details JSONB DEFAULT '[]',
    taxes JSONB DEFAULT '[]',
    info JSONB DEFAULT '{}',
    _stat_docs JSONB DEFAULT '{}',
    created BIGINT,
    updated BIGINT,
    created_ms DECIMAL(16,3),
    deleted BOOLEAN DEFAULT FALSE
);

-- Financial Accounts
CREATE TABLE accounts (
    _id VARCHAR(24) PRIMARY KEY,
    uuid UUID DEFAULT uuid_generate_v4(),
    _user VARCHAR(24),
    _client VARCHAR(24),
    _app VARCHAR(20),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50),
    balance JSONB DEFAULT '{"income": 0, "outcome": 0, "balance": 0}',
    bank_details JSONB DEFAULT '[]',
    include BOOLEAN DEFAULT TRUE,
    use_terminal BOOLEAN DEFAULT FALSE,
    created BIGINT,
    updated BIGINT,
    created_ms DECIMAL(16,3),
    deleted BOOLEAN DEFAULT FALSE
);

-- Money Sources (payment methods)
CREATE TABLE money_sources (
    _id VARCHAR(24) PRIMARY KEY,
    id VARCHAR(50),
    title VARCHAR(255) NOT NULL,
    type VARCHAR(50),
    country VARCHAR(10)
);

-- Cash Registers
CREATE TABLE registers (
    _id VARCHAR(24) PRIMARY KEY,
    uuid UUID DEFAULT uuid_generate_v4(),
    _user VARCHAR(24),
    _client VARCHAR(24),
    _store VARCHAR(24),
    _app VARCHAR(20),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50),
    settings JSONB DEFAULT '{}',
    created BIGINT,
    updated BIGINT,
    created_ms DECIMAL(16,3),
    deleted BOOLEAN DEFAULT FALSE
);

-- Categories
CREATE TABLE categories (
    _id VARCHAR(24) PRIMARY KEY,
    _client VARCHAR(24),
    name VARCHAR(255) NOT NULL,
    parent_id VARCHAR(24),
    sort_order INTEGER DEFAULT 0,
    created BIGINT,
    updated BIGINT,
    deleted BOOLEAN DEFAULT FALSE
);

-- Products (Catalog)
CREATE TABLE products (
    _id VARCHAR(24) PRIMARY KEY,
    uuid UUID DEFAULT uuid_generate_v4(),
    _user VARCHAR(24),
    _client VARCHAR(24),
    _app VARCHAR(20),
    name VARCHAR(500) NOT NULL,
    sku VARCHAR(100),
    barcode VARCHAR(100),
    code VARCHAR(100),
    type VARCHAR(50) DEFAULT 'inventory',
    price DECIMAL(12,2) DEFAULT 0,
    cost DECIMAL(12,2) DEFAULT 0,
    purchase DECIMAL(12,2) DEFAULT 0,
    discount DECIMAL(5,2) DEFAULT 0,
    total_stock DECIMAL(12,3) DEFAULT 0,
    stock JSONB DEFAULT '{}',
    _stock JSONB DEFAULT '[]',
    store_prices JSONB DEFAULT '{}',
    _store_prices JSONB DEFAULT '[]',
    categories JSONB DEFAULT '[]',
    unit VARCHAR(50),
    country VARCHAR(100),
    supplier VARCHAR(100),
    description TEXT,
    pic TEXT,
    taxes JSONB DEFAULT '[]',
    tax_free BOOLEAN DEFAULT FALSE,
    free_price BOOLEAN DEFAULT FALSE,
    is_weighed BOOLEAN DEFAULT FALSE,
    component JSONB DEFAULT '[]',
    container JSONB DEFAULT '[]',
    imported BIGINT,
    id_group VARCHAR(100),
    created BIGINT,
    updated BIGINT,
    created_ms DECIMAL(16,3),
    deleted BOOLEAN DEFAULT FALSE
);

-- Customers (Clients)
CREATE TABLE customers (
    _id VARCHAR(24) PRIMARY KEY,
    uuid UUID DEFAULT uuid_generate_v4(),
    _user VARCHAR(24),
    _client VARCHAR(24),
    _app VARCHAR(20),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) DEFAULT 'person',
    sex VARCHAR(10),
    description TEXT,
    address JSONB,
    phones JSONB DEFAULT '[]',
    emails JSONB DEFAULT '[]',
    bank_details JSONB DEFAULT '[]',
    details JSONB DEFAULT '[]',
    discount DECIMAL(5,2) DEFAULT 0,
    discount_card VARCHAR(100),
    loyalty_type VARCHAR(50),
    cashback_rate DECIMAL(5,2) DEFAULT 0,
    bonus_balance DECIMAL(12,2) DEFAULT 0,
    bonus_spent DECIMAL(12,2) DEFAULT 0,
    debt DECIMAL(12,2) DEFAULT 0,
    enable_savings BOOLEAN DEFAULT FALSE,
    bday BIGINT,
    "default" BOOLEAN DEFAULT FALSE,
    info JSONB DEFAULT '{}',
    created BIGINT,
    updated BIGINT,
    created_ms DECIMAL(16,3),
    deleted BOOLEAN DEFAULT FALSE
);

-- Suppliers
CREATE TABLE suppliers (
    _id VARCHAR(24) PRIMARY KEY,
    uuid UUID DEFAULT uuid_generate_v4(),
    _user VARCHAR(24),
    _client VARCHAR(24),
    _app VARCHAR(20),
    name VARCHAR(255) NOT NULL,
    site VARCHAR(255),
    address JSONB,
    description TEXT,
    phones JSONB DEFAULT '[]',
    emails JSONB DEFAULT '[]',
    bank_details JSONB DEFAULT '[]',
    details JSONB DEFAULT '[]',
    debt DECIMAL(12,2) DEFAULT 0,
    rdebt DECIMAL(12,2) DEFAULT 0,
    "default" BOOLEAN DEFAULT FALSE,
    created BIGINT,
    updated BIGINT,
    created_ms DECIMAL(16,3),
    deleted BOOLEAN DEFAULT FALSE
);

-- ============================================================================
-- TRANSACTIONAL ENTITIES
-- ============================================================================

-- Shifts
CREATE TABLE shifts (
    _id VARCHAR(24) PRIMARY KEY,
    uuid UUID DEFAULT uuid_generate_v4(),
    _user VARCHAR(24),
    _client VARCHAR(24),
    _store VARCHAR(24),
    _register VARCHAR(24),
    _app VARCHAR(20),
    number INTEGER,
    status VARCHAR(20) DEFAULT 'open',
    opened_at BIGINT,
    closed_at BIGINT,
    opening_balance DECIMAL(12,2) DEFAULT 0,
    closing_balance DECIMAL(12,2) DEFAULT 0,
    cash_sales DECIMAL(12,2) DEFAULT 0,
    card_sales DECIMAL(12,2) DEFAULT 0,
    total_sales DECIMAL(12,2) DEFAULT 0,
    transactions_count INTEGER DEFAULT 0,
    notes TEXT,
    created BIGINT,
    updated BIGINT,
    created_ms DECIMAL(16,3),
    deleted BOOLEAN DEFAULT FALSE
);

-- Documents (Sales, Purchases, Movements, Returns, etc.)
CREATE TABLE documents (
    _id VARCHAR(24) PRIMARY KEY,
    uuid UUID DEFAULT uuid_generate_v4(),
    _user VARCHAR(24),
    _client VARCHAR(24),
    _shift VARCHAR(24),
    _app VARCHAR(20),
    type VARCHAR(50) NOT NULL,
    number INTEGER,
    status BOOLEAN DEFAULT TRUE,
    date BIGINT,
    store VARCHAR(24),
    "from" JSONB,
    "to" JSONB,
    sum DECIMAL(12,2) DEFAULT 0,
    paid DECIMAL(12,2) DEFAULT 0,
    discount_percent DECIMAL(5,2) DEFAULT 0,
    discount_sum DECIMAL(12,2) DEFAULT 0,
    tax_total DECIMAL(12,2) DEFAULT 0,
    products JSONB DEFAULT '[]',
    payments JSONB DEFAULT '[]',
    notes TEXT,
    comment TEXT,
    info JSONB DEFAULT '{}',
    created BIGINT,
    updated BIGINT,
    created_ms DECIMAL(16,3),
    deleted BOOLEAN DEFAULT FALSE
);

-- Money Movements (Financial Transactions)
CREATE TABLE money_movements (
    _id VARCHAR(24) PRIMARY KEY,
    uuid UUID DEFAULT uuid_generate_v4(),
    _user VARCHAR(24),
    _client VARCHAR(24),
    _document VARCHAR(24),
    _shift VARCHAR(24),
    _app VARCHAR(20),
    type VARCHAR(20) NOT NULL,
    sum DECIMAL(12,2) NOT NULL,
    date BIGINT,
    "from" JSONB,
    "to" JSONB,
    account VARCHAR(24),
    source JSONB,
    reason VARCHAR(100),
    description TEXT,
    comment TEXT,
    info JSONB DEFAULT '{}',
    created BIGINT,
    updated BIGINT,
    created_ms DECIMAL(16,3),
    deleted BOOLEAN DEFAULT FALSE
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Users
CREATE INDEX idx_users_client ON users(_client);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_deleted ON users(deleted);

-- Stores
CREATE INDEX idx_stores_client ON stores(_client);
CREATE INDEX idx_stores_deleted ON stores(deleted);

-- Accounts
CREATE INDEX idx_accounts_client ON accounts(_client);
CREATE INDEX idx_accounts_deleted ON accounts(deleted);

-- Products
CREATE INDEX idx_products_client ON products(_client);
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_barcode ON products(barcode);
CREATE INDEX idx_products_name ON products(name);
CREATE INDEX idx_products_deleted ON products(deleted);
CREATE INDEX idx_products_categories ON products USING GIN(categories);

-- Customers
CREATE INDEX idx_customers_client ON customers(_client);
CREATE INDEX idx_customers_name ON customers(name);
CREATE INDEX idx_customers_deleted ON customers(deleted);

-- Suppliers
CREATE INDEX idx_suppliers_client ON suppliers(_client);
CREATE INDEX idx_suppliers_name ON suppliers(name);
CREATE INDEX idx_suppliers_deleted ON suppliers(deleted);

-- Documents
CREATE INDEX idx_documents_client ON documents(_client);
CREATE INDEX idx_documents_type ON documents(type);
CREATE INDEX idx_documents_date ON documents(date);
CREATE INDEX idx_documents_store ON documents(store);
CREATE INDEX idx_documents_deleted ON documents(deleted);
CREATE INDEX idx_documents_number ON documents(number);

-- Money Movements
CREATE INDEX idx_money_movements_client ON money_movements(_client);
CREATE INDEX idx_money_movements_type ON money_movements(type);
CREATE INDEX idx_money_movements_date ON money_movements(date);
CREATE INDEX idx_money_movements_deleted ON money_movements(deleted);

-- Shifts
CREATE INDEX idx_shifts_client ON shifts(_client);
CREATE INDEX idx_shifts_store ON shifts(_store);
CREATE INDEX idx_shifts_status ON shifts(status);
CREATE INDEX idx_shifts_deleted ON shifts(deleted);

-- ============================================================================
-- INITIAL DATA
-- ============================================================================

-- Insert company record
INSERT INTO companies (_id, name, created, updated) VALUES 
('58c872aa3ce7d5fc688b49bd', 'Loveiska Toys', EXTRACT(EPOCH FROM NOW())::BIGINT, EXTRACT(EPOCH FROM NOW())::BIGINT);

-- Insert admin user
INSERT INTO users (_id, _client, name, email, password_hash, role, created, updated) VALUES 
('58c872aa3ce7d5fc688b49bc', '58c872aa3ce7d5fc688b49bd', 'Олег Кицюк', 'o_kytsuk@mail.ru', 
 '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', 
 EXTRACT(EPOCH FROM NOW())::BIGINT, EXTRACT(EPOCH FROM NOW())::BIGINT);

-- Note: Password hash is for 'admin123' - change in production!

COMMENT ON TABLE companies IS 'Organization/company accounts';
COMMENT ON TABLE users IS 'User accounts with authentication';
COMMENT ON TABLE stores IS 'Physical stores and warehouses';
COMMENT ON TABLE accounts IS 'Financial accounts (cash, bank, terminals)';
COMMENT ON TABLE products IS 'Product catalog with stock levels';
COMMENT ON TABLE customers IS 'Customer/client records';
COMMENT ON TABLE suppliers IS 'Supplier/vendor records';
COMMENT ON TABLE documents IS 'All transactions (sales, purchases, movements, returns)';
COMMENT ON TABLE money_movements IS 'Financial transaction records';
COMMENT ON TABLE shifts IS 'Cashier shift records';
