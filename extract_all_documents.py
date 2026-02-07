#!/usr/bin/env python3
"""
Extract ALL documents and money movements from Ainur
Loops through pagination to get everything
"""

import requests
import json
import time
import os
from urllib.parse import quote
from datetime import datetime

# Configuration
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

def search_paginated(endpoint, limit=1000):
    """Get ALL data from search endpoint using pagination loop"""
    all_data = []
    offset = 0
    total = None
    page = 1
    
    print(f"\n{'='*70}")
    print(f"Extracting ALL {endpoint.upper()}")
    print(f"{'='*70}")
    
    while True:
        path = f"/search/{endpoint}/{COMPANY_ID}/{offset}/{limit}"
        encoded = quote(path, safe='')
        url = f"{BASE_URL}?path={encoded}&timezone={TIMEZONE}"
        
        try:
            response = requests.post(url, headers=HEADERS, cookies=COOKIES, json={}, timeout=60)
            
            if response.status_code != 200:
                print(f"  ⚠️  HTTP {response.status_code} at offset {offset}")
                break
            
            result = response.json()
            
            if not result.get('status'):
                print(f"  ⚠️  API error at offset {offset}")
                break
            
            batch = result.get('data', [])
            
            if total is None:
                total = result.get('total', 0)
                print(f"  Total available: {total:,}")
            
            if not batch:
                print(f"  No more data at offset {offset}")
                break
            
            all_data.extend(batch)
            print(f"  Page {page}: fetched {len(batch):,} items (total so far: {len(all_data):,}/{total:,})")
            
            # Check if we've got everything
            if len(all_data) >= total:
                break
            
            if len(batch) < limit:
                # Last page
                break
            
            offset += limit
            page += 1
            time.sleep(0.3)  # Rate limiting
            
        except Exception as e:
            print(f"  ⚠️  Error at offset {offset}: {e}")
            break
    
    print(f"\n  ✅ Total extracted: {len(all_data):,} {endpoint}")
    return all_data

def main():
    print("=" * 80)
    print("🚀 AINUR - EXTRACT ALL DOCUMENTS & MONEY MOVEMENTS")
    print("=" * 80)
    print(f"Started: {datetime.now()}")
    print(f"Company ID: {COMPANY_ID}")
    print("=" * 80)
    
    # Test connection first
    print("\n🔌 Testing connection...")
    path = f"/data/{COMPANY_ID}/stores"
    encoded = quote(path, safe='')
    url = f"{BASE_URL}?path={encoded}&timezone={TIMEZONE}"
    
    try:
        response = requests.get(url, headers=HEADERS, cookies=COOKIES, timeout=30)
        if response.status_code != 200 or not response.json().get('status'):
            print("❌ Connection failed! Session may have expired.")
            print("   Please get a fresh session cookie from Ainur.")
            return
        print("   ✅ Connection successful!")
    except Exception as e:
        print(f"❌ Connection error: {e}")
        return
    
    # Extract ALL documents
    documents = search_paginated('docs', limit=1000)
    
    # Extract ALL money movements
    money = search_paginated('money', limit=1000)
    
    # Save to files
    print("\n" + "=" * 80)
    print("💾 SAVING DATA")
    print("=" * 80)
    
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    
    # Save documents
    docs_file = os.path.join(OUTPUT_DIR, 'documents.json')
    with open(docs_file, 'w', encoding='utf-8') as f:
        json.dump(documents, f, ensure_ascii=False, indent=2)
    size_mb = os.path.getsize(docs_file) / (1024 * 1024)
    print(f"  Documents: {len(documents):,} records ({size_mb:.2f} MB)")
    
    # Save money movements
    money_file = os.path.join(OUTPUT_DIR, 'money_movements.json')
    with open(money_file, 'w', encoding='utf-8') as f:
        json.dump(money, f, ensure_ascii=False, indent=2)
    size_mb = os.path.getsize(money_file) / (1024 * 1024)
    print(f"  Money movements: {len(money):,} records ({size_mb:.2f} MB)")
    
    # Analyze documents by date
    print("\n" + "=" * 80)
    print("📊 DOCUMENT ANALYSIS")
    print("=" * 80)
    
    # Group by year
    by_year = {}
    for doc in documents:
        date = doc.get('date')
        if date:
            try:
                year = datetime.fromtimestamp(int(date)).year
                by_year[year] = by_year.get(year, 0) + 1
            except:
                pass
    
    print("\nDocuments by year:")
    for year in sorted(by_year.keys()):
        print(f"  {year}: {by_year[year]:,} documents")
    
    # Document types
    by_type = {}
    for doc in documents:
        dtype = doc.get('type', 'unknown')
        by_type[dtype] = by_type.get(dtype, 0) + 1
    
    print("\nDocument types:")
    for dtype, count in sorted(by_type.items(), key=lambda x: -x[1]):
        print(f"  {dtype}: {count:,}")
    
    print("\n" + "=" * 80)
    print("✅ EXTRACTION COMPLETE!")
    print(f"🕐 Finished: {datetime.now()}")
    print("=" * 80)

if __name__ == "__main__":
    main()
