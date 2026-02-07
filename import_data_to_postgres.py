#!/usr/bin/env python3
"""
Import Ainur extracted data into PostgreSQL
"""

import json
import os
import psycopg2
from psycopg2.extras import execute_values, Json
from datetime import datetime

# Configuration
DB_CONFIG = {
    'dbname': 'ainur_pos',
    'user': os.environ.get('DB_USER', os.environ.get('USER', 'postgres')),
    'password': os.environ.get('DB_PASSWORD', ''),
    'host': os.environ.get('DB_HOST', 'localhost'),
    'port': os.environ.get('DB_PORT', '5432')
}

DATA_DIR = '/Users/andriiliudvichuk/Projects/ainur-pos-clone/extracted_data'
COMPANY_ID = '58c872aa3ce7d5fc688b49bd'
USER_ID = '58c872aa3ce7d5fc688b49bc'


def load_json(filename):
    """Load JSON file from extracted data directory"""
    filepath = os.path.join(DATA_DIR, filename)
    if not os.path.exists(filepath):
        print(f"  ⚠️  File not found: {filename}")
        return []
    
    with open(filepath, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    if isinstance(data, list):
        return data
    elif isinstance(data, dict):
        return [data]
    return []


def safe_get(obj, key, default=None):
    """Safely get value from dict"""
    if obj is None:
        return default
    return obj.get(key, default)


def import_stores(cursor):
    """Import stores"""
    print("\n🏪 Importing STORES...")
    data = load_json('stores.json')
    
    for item in data:
        cursor.execute("""
            INSERT INTO stores (_id, uuid, _user, _client, _register, _app, name, shortname, 
                              address, description, type, "default", include, balance, 
                              bank_details, taxes, info, _stat_docs, created, updated, 
                              created_ms, deleted)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, 
                   %s, %s, %s, %s)
            ON CONFLICT (_id) DO UPDATE SET
                name = EXCLUDED.name,
                address = EXCLUDED.address,
                balance = EXCLUDED.balance,
                updated = EXCLUDED.updated
        """, (
            item.get('_id'),
            item.get('uuid'),
            item.get('_user'),
            item.get('_client', COMPANY_ID),
            item.get('_register'),
            item.get('_app'),
            item.get('name'),
            item.get('shortname'),
            item.get('address'),
            item.get('description'),
            item.get('type', 'store'),
            item.get('default', False),
            item.get('include', True),
            Json(item.get('balance', {})),
            Json(item.get('bank_details', [])),
            Json(item.get('taxes', [])),
            Json(item.get('info', {})),
            Json(item.get('_stat_docs', {})),
            item.get('created'),
            item.get('updated'),
            item.get('created_ms'),
            item.get('deleted', False)
        ))
    
    print(f"   ✅ Imported {len(data)} stores")
    return len(data)


def import_accounts(cursor):
    """Import financial accounts"""
    print("\n🏦 Importing ACCOUNTS...")
    data = load_json('accounts.json')
    
    for item in data:
        cursor.execute("""
            INSERT INTO accounts (_id, uuid, _user, _client, _app, name, type, balance,
                                bank_details, include, use_terminal, created, updated, 
                                created_ms, deleted)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT (_id) DO UPDATE SET
                name = EXCLUDED.name,
                balance = EXCLUDED.balance,
                updated = EXCLUDED.updated
        """, (
            item.get('_id'),
            item.get('uuid'),
            item.get('_user'),
            item.get('_client', COMPANY_ID),
            item.get('_app'),
            item.get('name'),
            item.get('type'),
            Json(item.get('balance', {})),
            Json(item.get('bank_details', [])),
            item.get('include', True),
            item.get('use_terminal', False),
            item.get('created'),
            item.get('updated'),
            item.get('created_ms'),
            item.get('deleted', False)
        ))
    
    print(f"   ✅ Imported {len(data)} accounts")
    return len(data)


def import_money_sources(cursor):
    """Import money sources (payment methods)"""
    print("\n💳 Importing MONEY SOURCES...")
    data = load_json('money_sources.json')
    
    for item in data:
        cursor.execute("""
            INSERT INTO money_sources (_id, id, title, type, country)
            VALUES (%s, %s, %s, %s, %s)
            ON CONFLICT (_id) DO UPDATE SET
                title = EXCLUDED.title,
                type = EXCLUDED.type
        """, (
            item.get('_id'),
            item.get('id'),
            item.get('title'),
            item.get('type'),
            item.get('country')
        ))
    
    print(f"   ✅ Imported {len(data)} money sources")
    return len(data)


def import_categories(cursor):
    """Import product categories"""
    print("\n📁 Importing CATEGORIES...")
    data = load_json('categories.json')
    
    # Categories from Ainur are just strings, we need to create records
    for i, category_name in enumerate(data):
        if isinstance(category_name, str):
            # Generate an ID based on the category name
            cat_id = f"cat_{i:05d}"
            cursor.execute("""
                INSERT INTO categories (_id, _client, name, sort_order, deleted)
                VALUES (%s, %s, %s, %s, %s)
                ON CONFLICT (_id) DO UPDATE SET
                    name = EXCLUDED.name
            """, (
                cat_id,
                COMPANY_ID,
                category_name,
                i,
                False
            ))
    
    print(f"   ✅ Imported {len(data)} categories")
    return len(data)


def import_products(cursor):
    """Import products"""
    print("\n📦 Importing PRODUCTS...")
    data = load_json('products.json')
    
    batch = []
    for item in data:
        batch.append((
            item.get('_id'),
            item.get('uuid'),
            item.get('_user'),
            item.get('_client', COMPANY_ID),
            item.get('_app'),
            item.get('name', '')[:500],  # Truncate to fit
            item.get('sku'),
            item.get('barcode'),
            item.get('code'),
            item.get('type', 'inventory'),
            item.get('price', 0),
            item.get('cost', 0),
            item.get('purchase', 0),
            item.get('discount', 0),
            item.get('total_stock', 0),
            Json(item.get('stock', {})),
            Json(item.get('_stock', [])),
            Json(item.get('store_prices', {})),
            Json(item.get('_store_prices', [])),
            Json(item.get('categories', [])),
            item.get('unit'),
            item.get('country'),
            item.get('supplier'),
            item.get('description'),
            item.get('pic'),
            Json(item.get('taxes', [])),
            item.get('tax_free', False),
            item.get('free_price', False),
            item.get('is_weighed', False),
            Json(item.get('component', [])),
            Json(item.get('container', [])),
            item.get('imported') if isinstance(item.get('imported'), int) else None,
            item.get('id_group'),
            item.get('created'),
            item.get('updated'),
            item.get('created_ms'),
            item.get('deleted', False)
        ))
    
    # Bulk insert using execute_values for better performance
    execute_values(cursor, """
        INSERT INTO products (_id, uuid, _user, _client, _app, name, sku, barcode, code,
                            type, price, cost, purchase, discount, total_stock, stock,
                            _stock, store_prices, _store_prices, categories, unit, country,
                            supplier, description, pic, taxes, tax_free, free_price,
                            is_weighed, component, container, imported, id_group,
                            created, updated, created_ms, deleted)
        VALUES %s
        ON CONFLICT (_id) DO UPDATE SET
            name = EXCLUDED.name,
            price = EXCLUDED.price,
            cost = EXCLUDED.cost,
            total_stock = EXCLUDED.total_stock,
            stock = EXCLUDED.stock,
            updated = EXCLUDED.updated
    """, batch, page_size=500)
    
    print(f"   ✅ Imported {len(data)} products")
    return len(data)


def import_customers(cursor):
    """Import customers"""
    print("\n👥 Importing CUSTOMERS...")
    data = load_json('customers.json')
    
    for item in data:
        cursor.execute("""
            INSERT INTO customers (_id, uuid, _user, _client, _app, name, type, sex,
                                 description, address, phones, emails, bank_details,
                                 details, discount, discount_card, loyalty_type,
                                 cashback_rate, bonus_balance, bonus_spent, debt,
                                 enable_savings, bday, "default", info, created, updated,
                                 created_ms, deleted)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s,
                   %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT (_id) DO UPDATE SET
                name = EXCLUDED.name,
                phones = EXCLUDED.phones,
                emails = EXCLUDED.emails,
                debt = EXCLUDED.debt,
                updated = EXCLUDED.updated
        """, (
            item.get('_id'),
            item.get('uuid'),
            item.get('_user'),
            item.get('_client', COMPANY_ID),
            item.get('_app'),
            item.get('name', 'Unknown'),
            item.get('type', 'person'),
            item.get('sex'),
            item.get('description'),
            Json(item.get('address')) if isinstance(item.get('address'), dict) else item.get('address'),
            Json(item.get('phones', [])),
            Json(item.get('emails', [])),
            Json(item.get('bank_details', [])),
            Json(item.get('details') if item.get('details') else []),
            item.get('discount', 0),
            item.get('discount_card'),
            item.get('loyalty_type'),
            item.get('cashback_rate', 0),
            item.get('bonus_balance', 0),
            item.get('bonus_spent', 0),
            item.get('debt', 0),
            item.get('enable_savings', False),
            item.get('bday'),
            item.get('default', False),
            Json(item.get('info', {})),
            item.get('created'),
            item.get('updated'),
            item.get('created_ms'),
            item.get('deleted', False)
        ))
    
    print(f"   ✅ Imported {len(data)} customers")
    return len(data)


def import_suppliers(cursor):
    """Import suppliers"""
    print("\n🏭 Importing SUPPLIERS...")
    data = load_json('suppliers.json')
    
    for item in data:
        cursor.execute("""
            INSERT INTO suppliers (_id, uuid, _user, _client, _app, name, site, address,
                                 description, phones, emails, bank_details, details,
                                 debt, rdebt, "default", created, updated, created_ms, deleted)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s,
                   %s, %s, %s)
            ON CONFLICT (_id) DO UPDATE SET
                name = EXCLUDED.name,
                phones = EXCLUDED.phones,
                emails = EXCLUDED.emails,
                debt = EXCLUDED.debt,
                updated = EXCLUDED.updated
        """, (
            item.get('_id'),
            item.get('uuid'),
            item.get('_user'),
            item.get('_client', COMPANY_ID),
            item.get('_app'),
            item.get('name', 'Unknown'),
            item.get('site'),
            Json(item.get('address')) if isinstance(item.get('address'), dict) else item.get('address'),
            item.get('description'),
            Json(item.get('phones', [])),
            Json(item.get('emails', [])),
            Json(item.get('bank_details', [])),
            Json(item.get('details') if item.get('details') else {}),
            item.get('debt', 0),
            item.get('rdebt', 0),
            item.get('default', False),
            item.get('created'),
            item.get('updated'),
            item.get('created_ms'),
            item.get('deleted', False)
        ))
    
    print(f"   ✅ Imported {len(data)} suppliers")
    return len(data)


def import_documents(cursor):
    """Import documents (sales, purchases, movements, etc.)"""
    print("\n📄 Importing DOCUMENTS...")
    data = load_json('documents.json')
    
    batch = []
    for item in data:
        batch.append((
            item.get('_id'),
            item.get('uuid'),
            item.get('_user'),
            item.get('_client', COMPANY_ID),
            item.get('_shift'),
            item.get('_app'),
            item.get('type', 'sale'),
            item.get('number'),
            item.get('status', True),
            item.get('date'),
            item.get('store'),
            Json(item.get('from', {})),
            Json(item.get('to', {})),
            item.get('sum', 0),
            item.get('paid', 0),
            item.get('discount_percent', 0),
            item.get('discount_sum', 0),
            item.get('tax_total', 0),
            Json(item.get('products', [])),
            Json(item.get('payments', [])),
            item.get('notes'),
            item.get('comment'),
            Json(item.get('info', {})),
            item.get('created'),
            item.get('updated'),
            item.get('created_ms'),
            item.get('deleted', False)
        ))
    
    # Bulk insert
    execute_values(cursor, """
        INSERT INTO documents (_id, uuid, _user, _client, _shift, _app, type, number,
                             status, date, store, "from", "to", sum, paid, discount_percent,
                             discount_sum, tax_total, products, payments, notes, comment,
                             info, created, updated, created_ms, deleted)
        VALUES %s
        ON CONFLICT (_id) DO UPDATE SET
            status = EXCLUDED.status,
            sum = EXCLUDED.sum,
            paid = EXCLUDED.paid,
            updated = EXCLUDED.updated
    """, batch, page_size=500)
    
    print(f"   ✅ Imported {len(data)} documents")
    return len(data)


def import_money_movements(cursor):
    """Import money movements (financial transactions)"""
    print("\n💵 Importing MONEY MOVEMENTS...")
    data = load_json('money_movements.json')
    
    batch = []
    for item in data:
        batch.append((
            item.get('_id'),
            item.get('uuid'),
            item.get('_user'),
            item.get('_client', COMPANY_ID),
            item.get('_document'),
            item.get('_shift'),
            item.get('_app'),
            item.get('type', 'debit'),
            item.get('sum', 0),
            item.get('date'),
            Json(item.get('from', {})),
            Json(item.get('to', {})),
            item.get('account'),
            Json(item.get('source', {})),
            item.get('reason'),
            item.get('description'),
            item.get('comment'),
            Json(item.get('info', {})),
            item.get('created'),
            item.get('updated'),
            item.get('created_ms'),
            item.get('deleted', False)
        ))
    
    # Bulk insert
    execute_values(cursor, """
        INSERT INTO money_movements (_id, uuid, _user, _client, _document, _shift, _app,
                                   type, sum, date, "from", "to", account, source,
                                   reason, description, comment, info, created, updated,
                                   created_ms, deleted)
        VALUES %s
        ON CONFLICT (_id) DO UPDATE SET
            sum = EXCLUDED.sum,
            updated = EXCLUDED.updated
    """, batch, page_size=500)
    
    print(f"   ✅ Imported {len(data)} money movements")
    return len(data)


def main():
    """Main import process"""
    print("=" * 80)
    print("🚀 AINUR DATA IMPORT TO POSTGRESQL")
    print("=" * 80)
    print(f"Started: {datetime.now()}")
    print(f"Data source: {DATA_DIR}")
    print(f"Database: {DB_CONFIG['dbname']} @ {DB_CONFIG['host']}")
    print("=" * 80)
    
    # Connect to database
    print("\n🔌 Connecting to database...")
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        conn.autocommit = False
        cursor = conn.cursor()
        print("   ✅ Connected!")
    except Exception as e:
        print(f"   ❌ Connection failed: {e}")
        return
    
    try:
        # Run schema first
        print("\n📐 Running database schema...")
        schema_path = os.path.join(os.path.dirname(__file__), 
                                   'backend/src/database/schema.sql')
        with open(schema_path, 'r') as f:
            schema_sql = f.read()
        cursor.execute(schema_sql)
        conn.commit()
        print("   ✅ Schema created!")
        
        # Import data
        results = {}
        results['stores'] = import_stores(cursor)
        results['accounts'] = import_accounts(cursor)
        results['money_sources'] = import_money_sources(cursor)
        results['categories'] = import_categories(cursor)
        results['products'] = import_products(cursor)
        results['customers'] = import_customers(cursor)
        results['suppliers'] = import_suppliers(cursor)
        results['documents'] = import_documents(cursor)
        results['money_movements'] = import_money_movements(cursor)
        
        # Commit all changes
        conn.commit()
        
        # Print summary
        print("\n" + "=" * 80)
        print("📊 IMPORT SUMMARY")
        print("=" * 80)
        
        total = 0
        for name, count in results.items():
            total += count
            print(f"   {name:20s}: {count:>10,}")
        
        print("-" * 80)
        print(f"   {'TOTAL':20s}: {total:>10,}")
        print("=" * 80)
        
        # Verify data
        print("\n🔍 Verifying imported data...")
        for table in ['stores', 'accounts', 'products', 'customers', 'suppliers', 
                      'documents', 'money_movements']:
            cursor.execute(f"SELECT COUNT(*) FROM {table}")
            count = cursor.fetchone()[0]
            print(f"   {table:20s}: {count:>10,} rows in DB")
        
        print("\n" + "=" * 80)
        print("✅ IMPORT COMPLETE!")
        print(f"🕐 Finished: {datetime.now()}")
        print("=" * 80)
        
    except Exception as e:
        conn.rollback()
        print(f"\n❌ Error during import: {e}")
        raise
    finally:
        cursor.close()
        conn.close()


if __name__ == "__main__":
    main()
