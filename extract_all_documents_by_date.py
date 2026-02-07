#!/usr/bin/env python3
"""
Extract ALL documents from Ainur by date ranges
Bypasses the 10,000 limit by querying different date ranges
"""

import requests
import json
import time
import os
from urllib.parse import quote
from datetime import datetime, timedelta

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

def search_with_date_filter(endpoint, from_date=None, to_date=None, limit=1000):
    """Get data with optional date filters"""
    all_data = []
    offset = 0
    total = None
    
    body = {}
    if from_date:
        body['from_date'] = int(from_date.timestamp())
    if to_date:
        body['to_date'] = int(to_date.timestamp())
    
    while True:
        path = f"/search/{endpoint}/{COMPANY_ID}/{offset}/{limit}"
        encoded = quote(path, safe='')
        url = f"{BASE_URL}?path={encoded}&timezone={TIMEZONE}"
        
        try:
            response = requests.post(url, headers=HEADERS, cookies=COOKIES, json=body, timeout=60)
            
            if response.status_code != 200:
                break
            
            result = response.json()
            
            if not result.get('status'):
                break
            
            batch = result.get('data', [])
            
            if total is None:
                total = result.get('total', 0)
            
            if not batch:
                break
            
            all_data.extend(batch)
            
            if len(all_data) >= total or len(batch) < limit:
                break
            
            offset += limit
            time.sleep(0.2)
            
        except Exception as e:
            print(f"  Error: {e}")
            break
    
    return all_data, total

def main():
    print("=" * 80)
    print("🚀 AINUR - EXTRACT ALL DOCUMENTS BY DATE RANGES")
    print("=" * 80)
    print(f"Started: {datetime.now()}")
    
    # Test connection
    print("\n🔌 Testing connection...")
    path = f"/data/{COMPANY_ID}/stores"
    encoded = quote(path, safe='')
    url = f"{BASE_URL}?path={encoded}&timezone={TIMEZONE}"
    
    try:
        response = requests.get(url, headers=HEADERS, cookies=COOKIES, timeout=30)
        if response.status_code != 200 or not response.json().get('status'):
            print("❌ Connection failed!")
            return
        print("   ✅ Connection successful!")
    except Exception as e:
        print(f"❌ Error: {e}")
        return
    
    # Define date ranges to query
    # Start from 2017 (when Ainur was created based on the data) to now
    date_ranges = []
    
    # Go back year by year
    current_year = datetime.now().year
    for year in range(2017, current_year + 1):
        # For each year, query by month to get more granular data
        for month in range(1, 13):
            start = datetime(year, month, 1)
            if month == 12:
                end = datetime(year + 1, 1, 1) - timedelta(seconds=1)
            else:
                end = datetime(year, month + 1, 1) - timedelta(seconds=1)
            
            # Skip future months
            if start > datetime.now():
                break
                
            date_ranges.append((start, end))
    
    all_documents = []
    all_money = []
    seen_doc_ids = set()
    seen_money_ids = set()
    
    # Extract documents by date range
    print("\n" + "=" * 80)
    print("📄 EXTRACTING DOCUMENTS BY DATE RANGES")
    print("=" * 80)
    
    for start, end in date_ranges:
        period = f"{start.strftime('%Y-%m')}"
        docs, total = search_with_date_filter('docs', start, end)
        
        # Deduplicate
        new_docs = [d for d in docs if d['_id'] not in seen_doc_ids]
        for d in new_docs:
            seen_doc_ids.add(d['_id'])
        
        if new_docs:
            all_documents.extend(new_docs)
            print(f"  {period}: +{len(new_docs):,} docs (API reports {total:,} total, cumulative: {len(all_documents):,})")
        
        time.sleep(0.1)
    
    # Extract money movements by date range
    print("\n" + "=" * 80)
    print("💵 EXTRACTING MONEY MOVEMENTS BY DATE RANGES")
    print("=" * 80)
    
    for start, end in date_ranges:
        period = f"{start.strftime('%Y-%m')}"
        money, total = search_with_date_filter('money', start, end)
        
        # Deduplicate
        new_money = [m for m in money if m['_id'] not in seen_money_ids]
        for m in new_money:
            seen_money_ids.add(m['_id'])
        
        if new_money:
            all_money.extend(new_money)
            print(f"  {period}: +{len(new_money):,} movements (cumulative: {len(all_money):,})")
        
        time.sleep(0.1)
    
    # Save data
    print("\n" + "=" * 80)
    print("💾 SAVING DATA")
    print("=" * 80)
    
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    
    # Save documents
    docs_file = os.path.join(OUTPUT_DIR, 'documents.json')
    with open(docs_file, 'w', encoding='utf-8') as f:
        json.dump(all_documents, f, ensure_ascii=False, indent=2)
    size_mb = os.path.getsize(docs_file) / (1024 * 1024)
    print(f"  Documents: {len(all_documents):,} records ({size_mb:.2f} MB)")
    
    # Save money movements
    money_file = os.path.join(OUTPUT_DIR, 'money_movements.json')
    with open(money_file, 'w', encoding='utf-8') as f:
        json.dump(all_money, f, ensure_ascii=False, indent=2)
    size_mb = os.path.getsize(money_file) / (1024 * 1024)
    print(f"  Money movements: {len(all_money):,} records ({size_mb:.2f} MB)")
    
    # Analysis
    print("\n" + "=" * 80)
    print("📊 ANALYSIS")
    print("=" * 80)
    
    by_year = {}
    for doc in all_documents:
        date = doc.get('date')
        if date:
            try:
                year = datetime.fromtimestamp(int(date)).year
                by_year[year] = by_year.get(year, 0) + 1
            except:
                pass
    
    print("\nDocuments by year:")
    for year in sorted(by_year.keys()):
        print(f"  {year}: {by_year[year]:,}")
    
    by_type = {}
    for doc in all_documents:
        dtype = doc.get('type', 'unknown')
        by_type[dtype] = by_type.get(dtype, 0) + 1
    
    print("\nDocument types:")
    for dtype, count in sorted(by_type.items(), key=lambda x: -x[1]):
        print(f"  {dtype}: {count:,}")
    
    print("\n" + "=" * 80)
    print("✅ COMPLETE!")
    print(f"🕐 Finished: {datetime.now()}")
    print("=" * 80)

if __name__ == "__main__":
    main()
