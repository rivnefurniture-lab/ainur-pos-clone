#!/usr/bin/env python3
"""
Complete Ainur Data Extraction Script
Extracts 100% of all data from AinurPOS
"""

import requests
import json
import time
import os
from urllib.parse import quote
from datetime import datetime, timedelta
from typing import Optional, Dict, List, Any

# ============================================================================
# CONFIGURATION
# ============================================================================
BASE_URL = "https://web.ainur.app/proxy"
COMPANY_ID = "58c872aa3ce7d5fc688b49bd"
TIMEZONE = "7200"
SESSION_COOKIE = "s%3AP7kOlTJz7HDSMilUU2ZW4lyGKQc6ZEIm.PiVrOH1qUMyYIqxNPeEQupxlHccJedPkIHoKMwookiQ"
OUTPUT_DIR = "/Users/andriiliudvichuk/Projects/ainur-pos-clone/extracted_data"

HEADERS = {
    'accept': 'application/json',
    'api': 'v3',
    'content-type': 'application/json',
}

COOKIES = {
    'connect.sid': SESSION_COOKIE
}

# ============================================================================
# API FUNCTIONS
# ============================================================================

def make_request(path: str, method: str = 'GET', body: Optional[Dict] = None) -> Optional[Dict]:
    """Make API request through Ainur proxy"""
    encoded_path = quote(path, safe='')
    url = f"{BASE_URL}?path={encoded_path}&timezone={TIMEZONE}"
    
    try:
        if method == 'GET':
            response = requests.get(url, headers=HEADERS, cookies=COOKIES, timeout=60)
        elif method == 'POST':
            response = requests.post(url, headers=HEADERS, cookies=COOKIES, json=body or {}, timeout=60)
        
        if response.status_code == 200:
            return response.json()
        else:
            print(f"  ⚠️  HTTP {response.status_code} for {path}")
            return None
    except requests.exceptions.Timeout:
        print(f"  ⚠️  Timeout for {path}")
        return None
    except Exception as e:
        print(f"  ⚠️  Error for {path}: {e}")
        return None

def get_paginated(resource: str, limit: int = 1000) -> List[Dict]:
    """Get all data from paginated GET endpoint"""
    all_data = []
    offset = 0
    
    while True:
        path = f"/data/{COMPANY_ID}/{resource}?offset={offset}&limit={limit}"
        result = make_request(path)
        
        if result and result.get('status'):
            batch = result.get('data', [])
            if not batch:
                break
            all_data.extend(batch)
            if len(batch) < limit:
                break
            offset += limit
            time.sleep(0.2)
        else:
            break
    
    return all_data

def search_paginated(endpoint: str, body: Optional[Dict] = None, limit: int = 1000) -> List[Dict]:
    """Get all data from paginated POST search endpoint"""
    all_data = []
    offset = 0
    total = None
    
    while True:
        path = f"/search/{endpoint}/{COMPANY_ID}/{offset}/{limit}"
        result = make_request(path, 'POST', body or {})
        
        if result and result.get('status'):
            batch = result.get('data', [])
            if total is None:
                total = result.get('total', 0)
            
            if not batch:
                break
            
            all_data.extend(batch)
            
            if len(batch) < limit or (total and len(all_data) >= total):
                break
            
            offset += limit
            time.sleep(0.2)
        else:
            break
    
    return all_data

def get_simple(resource: str) -> List[Dict]:
    """Get data from non-paginated GET endpoint"""
    path = f"/data/{COMPANY_ID}/{resource}"
    result = make_request(path)
    
    if result and result.get('status'):
        data = result.get('data', [])
        # Handle both array and object responses
        if isinstance(data, list):
            return data
        elif isinstance(data, dict):
            return [data]
    return []

def get_count(resource: str) -> int:
    """Get count from endpoint"""
    path = f"/count/{COMPANY_ID}/{resource}"
    result = make_request(path)
    
    if result and result.get('status'):
        data = result.get('data', {})
        if isinstance(data, dict):
            return data.get('total', 0)
        return data
    return 0

# ============================================================================
# EXTRACTION FUNCTIONS
# ============================================================================

def extract_products():
    """Extract all products/catalog items"""
    print("\n📦 Extracting PRODUCTS...")
    count = get_count('catalog')
    print(f"   Total in system: {count:,}")
    
    data = get_paginated('catalog')
    print(f"   ✅ Extracted: {len(data):,} products")
    return data

def extract_categories():
    """Extract all categories"""
    print("\n📁 Extracting CATEGORIES...")
    path = f"/data/{COMPANY_ID}/catalog/categories"
    result = make_request(path)
    
    data = []
    if result and result.get('status'):
        data = result.get('data', [])
    
    print(f"   ✅ Extracted: {len(data):,} categories")
    return data

def extract_customers():
    """Extract all customers/clients"""
    print("\n👥 Extracting CUSTOMERS...")
    count = get_count('clients')
    print(f"   Total in system: {count:,}")
    
    data = get_paginated('clients')
    print(f"   ✅ Extracted: {len(data):,} customers")
    return data

def extract_suppliers():
    """Extract all suppliers"""
    print("\n🏭 Extracting SUPPLIERS...")
    data = get_simple('suppliers')
    print(f"   ✅ Extracted: {len(data):,} suppliers")
    return data

def extract_stores():
    """Extract all stores/warehouses"""
    print("\n🏪 Extracting STORES...")
    data = get_simple('stores')
    print(f"   ✅ Extracted: {len(data):,} stores")
    return data

def extract_accounts():
    """Extract all financial accounts"""
    print("\n🏦 Extracting ACCOUNTS...")
    data = get_simple('accounts')
    print(f"   ✅ Extracted: {len(data):,} accounts")
    return data

def extract_money_sources():
    """Extract all money sources"""
    print("\n💳 Extracting MONEY SOURCES...")
    data = get_simple('sources')
    print(f"   ✅ Extracted: {len(data):,} money sources")
    return data

def extract_registers():
    """Extract all cash registers"""
    print("\n🖥️ Extracting REGISTERS...")
    data = get_simple('registers')
    print(f"   ✅ Extracted: {len(data):,} registers")
    return data

def extract_units():
    """Extract all measurement units"""
    print("\n📏 Extracting UNITS...")
    data = get_simple('units')
    print(f"   ✅ Extracted: {len(data):,} units")
    return data

def extract_tags():
    """Extract all tags"""
    print("\n🏷️ Extracting TAGS...")
    data = get_simple('tags')
    print(f"   ✅ Extracted: {len(data):,} tags")
    return data

def extract_employees():
    """Extract all employees/users"""
    print("\n👨‍💼 Extracting EMPLOYEES...")
    data = get_simple('employees')
    print(f"   ✅ Extracted: {len(data):,} employees")
    return data

def extract_taxes():
    """Extract all tax rates"""
    print("\n💰 Extracting TAXES...")
    data = get_simple('taxes')
    print(f"   ✅ Extracted: {len(data):,} taxes")
    return data

def extract_documents():
    """Extract all documents (sales, purchases, movements, etc.)"""
    print("\n📄 Extracting DOCUMENTS...")
    
    # Use search endpoint with pagination
    data = search_paginated('docs', {})
    print(f"   ✅ Extracted: {len(data):,} documents")
    
    # Analyze by type
    types = {}
    for doc in data:
        t = doc.get('type', 'unknown')
        types[t] = types.get(t, 0) + 1
    
    print("   Document types:")
    for t, c in sorted(types.items(), key=lambda x: -x[1]):
        print(f"      - {t}: {c:,}")
    
    return data

def extract_money_movements():
    """Extract all money movements/financial transactions"""
    print("\n💵 Extracting MONEY MOVEMENTS...")
    
    data = search_paginated('money', {})
    print(f"   ✅ Extracted: {len(data):,} money movements")
    
    # Analyze by type
    credits = sum(1 for m in data if m.get('type') == 'credit')
    debits = sum(1 for m in data if m.get('type') == 'debit')
    print(f"      - Credits (income): {credits:,}")
    print(f"      - Debits (expense): {debits:,}")
    
    return data

def extract_shifts():
    """Extract shift history"""
    print("\n⏰ Extracting SHIFTS...")
    
    # Try to get shift history
    path = f"/data/{COMPANY_ID}/shifts"
    result = make_request(path)
    
    data = []
    if result and result.get('status'):
        data = result.get('data', [])
    
    print(f"   ✅ Extracted: {len(data):,} shifts")
    return data

def extract_company():
    """Extract company information"""
    print("\n🏢 Extracting COMPANY INFO...")
    
    path = f"/data/{COMPANY_ID}/company"
    result = make_request(path)
    
    data = None
    if result and result.get('status'):
        data = result.get('data', {})
        print(f"   ✅ Company: {data.get('name', 'Unknown')}")
    
    return data

def extract_settings():
    """Extract settings"""
    print("\n⚙️ Extracting SETTINGS...")
    
    settings = {}
    
    # Try various settings endpoints
    settings_endpoints = ['settings', 'company/settings', 'config']
    for endpoint in settings_endpoints:
        path = f"/data/{COMPANY_ID}/{endpoint}"
        result = make_request(path)
        if result and result.get('status'):
            settings[endpoint] = result.get('data', {})
    
    print(f"   ✅ Extracted settings from {len(settings)} endpoints")
    return settings

def extract_product_stock():
    """Extract stock levels per store"""
    print("\n📊 Extracting PRODUCT STOCK...")
    
    # Get all products with stock info
    products = get_paginated('catalog')
    
    stock_data = []
    for product in products:
        pid = product.get('_id')
        stocks = product.get('stocks', {})
        
        for store_id, qty in stocks.items():
            stock_data.append({
                'product_id': pid,
                'store_id': store_id,
                'quantity': qty
            })
    
    print(f"   ✅ Extracted: {len(stock_data):,} stock entries")
    return stock_data

# ============================================================================
# MAIN EXTRACTION
# ============================================================================

def main():
    """Main extraction process"""
    print("=" * 80)
    print("🚀 AINUR COMPLETE DATA EXTRACTION")
    print("=" * 80)
    print(f"Started: {datetime.now()}")
    print(f"Company ID: {COMPANY_ID}")
    print(f"Output: {OUTPUT_DIR}")
    print("=" * 80)
    
    # Create output directory
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    
    # Test connection first
    print("\n🔌 Testing connection...")
    test_result = make_request(f"/data/{COMPANY_ID}/stores")
    if not test_result or not test_result.get('status'):
        print("❌ Connection failed! Check session cookie.")
        print("   Please login to Ainur and get a fresh session cookie.")
        return
    print("   ✅ Connection successful!")
    
    # Extract all data
    all_data = {}
    
    # Core entities
    all_data['company'] = extract_company()
    all_data['stores'] = extract_stores()
    all_data['categories'] = extract_categories()
    all_data['products'] = extract_products()
    all_data['product_stock'] = extract_product_stock()
    all_data['customers'] = extract_customers()
    all_data['suppliers'] = extract_suppliers()
    all_data['accounts'] = extract_accounts()
    all_data['money_sources'] = extract_money_sources()
    all_data['registers'] = extract_registers()
    all_data['employees'] = extract_employees()
    all_data['units'] = extract_units()
    all_data['tags'] = extract_tags()
    all_data['taxes'] = extract_taxes()
    
    # Transactional data
    all_data['documents'] = extract_documents()
    all_data['money_movements'] = extract_money_movements()
    all_data['shifts'] = extract_shifts()
    
    # Settings
    all_data['settings'] = extract_settings()
    
    # Save all data to JSON files
    print("\n" + "=" * 80)
    print("💾 SAVING DATA TO FILES")
    print("=" * 80)
    
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    
    for name, data in all_data.items():
        if data is None:
            continue
        
        filename = f"{name}.json"
        filepath = os.path.join(OUTPUT_DIR, filename)
        
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        
        if isinstance(data, list):
            count = len(data)
        elif isinstance(data, dict):
            count = 1
        else:
            count = 0
        
        size_kb = os.path.getsize(filepath) / 1024
        print(f"   {name:20s}: {count:>8,} records ({size_kb:>8.1f} KB)")
    
    # Create summary file
    summary = {
        'extraction_timestamp': timestamp,
        'company_id': COMPANY_ID,
        'counts': {}
    }
    
    for name, data in all_data.items():
        if data is None:
            summary['counts'][name] = 0
        elif isinstance(data, list):
            summary['counts'][name] = len(data)
        elif isinstance(data, dict):
            summary['counts'][name] = 1
    
    with open(os.path.join(OUTPUT_DIR, '_extraction_summary.json'), 'w') as f:
        json.dump(summary, f, indent=2)
    
    # Print final summary
    print("\n" + "=" * 80)
    print("📊 EXTRACTION SUMMARY")
    print("=" * 80)
    
    total_records = 0
    for name, count in summary['counts'].items():
        total_records += count
        print(f"   {name:20s}: {count:>10,}")
    
    print("-" * 80)
    print(f"   {'TOTAL':20s}: {total_records:>10,}")
    print("=" * 80)
    print(f"\n✅ EXTRACTION COMPLETE!")
    print(f"📁 Data saved to: {OUTPUT_DIR}")
    print(f"🕐 Completed: {datetime.now()}")

if __name__ == "__main__":
    main()
