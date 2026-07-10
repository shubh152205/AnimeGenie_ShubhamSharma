import os
import re
import pandas as pd
import numpy as np
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import linear_kernel

app = FastAPI(title="AppleSalesGennie AI Backend", version="1.0.0")

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Resolve paths
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
CSV_PATH = os.path.join(BASE_DIR, 'archive', 'Cleaned_Chocolate_Sales.csv')

# Global variables for data
sales_df = None

# TF-IDF Recommender variables
tfidf_matrix = None
transaction_id_to_index = {}
index_to_transaction_id = {}

@app.on_event("startup")
def startup_event():
    global sales_df, tfidf_matrix, transaction_id_to_index, index_to_transaction_id
    
    print(f"Loading sales dataset from {CSV_PATH}...")
    
    if not os.path.exists(CSV_PATH):
        # Try raw file if cleaned does not exist
        fallback_path = os.path.join(BASE_DIR, 'archive', 'Chocolate Sales (2).csv')
        if os.path.exists(fallback_path):
            print(f"Cleaned CSV not found. Loading and cleaning raw CSV from {fallback_path}...")
            df = pd.read_csv(fallback_path)
            df['Amount'] = df['Amount'].astype(str).str.replace('$', '', regex=False).str.replace(',', '', regex=False).astype(float)
            df['Date'] = pd.to_datetime(df['Date'], format='%d/%m/%Y').dt.strftime('%Y-%m-%d')
            df['Product'] = df['Product'].str.strip()
            df['Sales Person'] = df['Sales Person'].str.strip()
            df = df.drop_duplicates()
            sales_df = df
        else:
            raise FileNotFoundError(f"Neither cleaned nor raw sales CSV files found at {CSV_PATH}")
    else:
        sales_df = pd.read_csv(CSV_PATH)
        
    # Assign unique Transaction IDs
    sales_df['transaction_id'] = range(1, len(sales_df) + 1)
    
    # Pre-fill clean values
    sales_df['Amount'] = sales_df['Amount'].fillna(0.0)
    sales_df['Boxes Shipped'] = sales_df['Boxes Shipped'].fillna(0).astype(int)
    sales_df['Country'] = sales_df['Country'].fillna("Unknown")
    sales_df['Product'] = sales_df['Product'].fillna("Unknown Product")
    sales_df['Sales Person'] = sales_df['Sales Person'].fillna("Unknown Agent")
    sales_df['Date'] = sales_df['Date'].fillna("2022-01-01")
    
    print("Fitting TF-IDF transaction similarity engine...")
    # Build text descriptions of transactions: Sales Person + Product + Country + Date
    features = []
    for idx, row in sales_df.iterrows():
        t_id = int(row['transaction_id'])
        desc = f"{row['Sales Person']} {row['Product']} {row['Country']} {row['Date']}"
        features.append(desc)
        transaction_id_to_index[t_id] = idx
        index_to_transaction_id[idx] = t_id
        
    tfidf = TfidfVectorizer(stop_words='english', max_features=5000)
    tfidf_matrix = tfidf.fit_transform(features)
    print("TF-IDF Fitting complete! AppleSalesGennie Server is ready.")

@app.get("/")
def read_root():
    return {
        "status": "online",
        "message": "Welcome to the AppleSalesGennie AI Intelligence API Backend!",
        "version": "1.0.0",
        "docs": "/docs"
    }

@app.get("/api/products")
def get_products():
    if sales_df is None:
        return []
    return sorted(sales_df['Product'].dropna().unique().tolist())

@app.get("/api/countries")
def get_countries():
    if sales_df is None:
        return []
    return sorted(sales_df['Country'].dropna().unique().tolist())

@app.get("/api/salespeople")
def get_salespeople():
    if sales_df is None:
        return []
    return sorted(sales_df['Sales Person'].dropna().unique().tolist())

@app.get("/api/sales")
def get_sales_list(
    page: int = Query(1, ge=1),
    page_size: int = Query(25, ge=1, le=100),
    search: str = Query(None),
    product: str = Query(None),
    country: str = Query(None),
    salesperson: str = Query(None),
    sort_by: str = Query("date"),
    sort_order: str = Query("desc")
):
    global sales_df
    if sales_df is None:
        raise HTTPException(status_code=500, detail="Sales data not loaded")
        
    filtered_df = sales_df.copy()
    
    # 1. Apply search filter (searches Product or Sales Person)
    if search:
        filtered_df = filtered_df[
            filtered_df['Product'].str.contains(search, case=False, na=False) |
            filtered_df['Sales Person'].str.contains(search, case=False, na=False)
        ]
        
    # 2. Apply categorical filters
    if product:
        filtered_df = filtered_df[filtered_df['Product'] == product]
    if country:
        filtered_df = filtered_df[filtered_df['Country'] == country]
    if salesperson:
        filtered_df = filtered_df[filtered_df['Sales Person'] == salesperson]
        
    # 3. Sort
    is_ascending = sort_order == "asc"
    if sort_by == 'amount':
        filtered_df = filtered_df.sort_values(by='Amount', ascending=is_ascending)
    elif sort_by == 'boxes':
        filtered_df = filtered_df.sort_values(by='Boxes Shipped', ascending=is_ascending)
    elif sort_by == 'date':
        filtered_df = filtered_df.sort_values(by='Date', ascending=is_ascending)
    else:
        filtered_df = filtered_df.sort_values(by='transaction_id', ascending=is_ascending)
        
    total_records = len(filtered_df)
    
    # 4. Paginate
    start = (page - 1) * page_size
    end = start + page_size
    paginated_df = filtered_df.iloc[start:end]
    
    results = []
    for _, row in paginated_df.iterrows():
        results.append({
            'transaction_id': int(row['transaction_id']),
            'salesperson': row['Sales Person'],
            'country': row['Country'],
            'product': row['Product'],
            'date': row['Date'],
            'amount': float(row['Amount']),
            'boxes': int(row['Boxes Shipped'])
        })
        
    return {
        'total': total_records,
        'page': page,
        'page_size': page_size,
        'total_pages': int(np.ceil(total_records / page_size)),
        'results': results
    }

@app.get("/api/sales/{transaction_id}")
def get_transaction_detail(transaction_id: int):
    global sales_df
    if sales_df is None:
        raise HTTPException(status_code=500, detail="Sales data not loaded")
        
    rows = sales_df[sales_df['transaction_id'] == transaction_id]
    if rows.empty:
        raise HTTPException(status_code=404, detail="Transaction not found")
        
    row = rows.iloc[0]
    salesperson = row['Sales Person']
    product_name = row['Product']
    
    # Calculate some dynamic statistics
    sp_total_sales = float(sales_df[sales_df['Sales Person'] == salesperson]['Amount'].sum())
    sp_deal_count = int(sales_df[sales_df['Sales Person'] == salesperson]['transaction_id'].count())
    sp_avg_boxes = float(sales_df[sales_df['Sales Person'] == salesperson]['Boxes Shipped'].mean())
    
    # Rank salespeople by total revenue
    sp_rankings = sales_df.groupby('Sales Person')['Amount'].sum().sort_values(ascending=False)
    salesperson_rank = int(sp_rankings.index.get_loc(salesperson) + 1)
    
    # Product stats
    prod_avg_price = float(sales_df[sales_df['Product'] == product_name]['Amount'].sum() / 
                           sales_df[sales_df['Product'] == product_name]['Boxes Shipped'].sum())
    
    return {
        'transaction_id': int(row['transaction_id']),
        'salesperson': salesperson,
        'country': row['Country'],
        'product': product_name,
        'date': row['Date'],
        'amount': float(row['Amount']),
        'boxes': int(row['Boxes Shipped']),
        'salesperson_stats': {
            'rank': salesperson_rank,
            'total_sales': sp_total_sales,
            'deal_count': sp_deal_count,
            'avg_boxes': round(sp_avg_boxes, 1)
        },
        'product_stats': {
            'avg_price_per_box': round(prod_avg_price, 2)
        }
    }

@app.get("/api/sales/{transaction_id}/recommendations")
def get_transaction_recommendations(transaction_id: int, limit: int = 6):
    global tfidf_matrix, transaction_id_to_index, index_to_transaction_id, sales_df
    if tfidf_matrix is None:
        raise HTTPException(status_code=500, detail="Similarity engine not ready")
        
    if transaction_id not in transaction_id_to_index:
        raise HTTPException(status_code=404, detail="Transaction not found")
        
    target_idx = transaction_id_to_index[transaction_id]
    
    # Compute Cosine Similarity
    cosine_sim = linear_kernel(tfidf_matrix[target_idx], tfidf_matrix).flatten()
    
    # Sort descending
    sim_indices = np.argsort(cosine_sim)[::-1]
    
    recommendation_indices = []
    for idx in sim_indices:
        t_id = index_to_transaction_id[idx]
        if t_id == transaction_id:
            continue
        recommendation_indices.append(idx)
        if len(recommendation_indices) >= limit:
            break
            
    recommendations = []
    for idx in recommendation_indices:
        rec_row = sales_df.iloc[idx]
        recommendations.append({
            'transaction_id': int(rec_row['transaction_id']),
            'salesperson': rec_row['Sales Person'],
            'country': rec_row['Country'],
            'product': rec_row['Product'],
            'date': rec_row['Date'],
            'amount': float(rec_row['Amount']),
            'boxes': int(rec_row['Boxes Shipped']),
            'similarity': float(cosine_sim[idx])
        })
        
    return recommendations

@app.get("/api/analytics")
def get_analytics():
    global sales_df
    if sales_df is None:
        raise HTTPException(status_code=500, detail="Sales data not loaded")
        
    # 1. Total statistics
    total_rev = float(sales_df['Amount'].sum())
    total_boxes = int(sales_df['Boxes Shipped'].sum())
    total_trans = len(sales_df)
    avg_deal = float(sales_df['Amount'].mean())
    avg_boxes = float(sales_df['Boxes Shipped'].mean())
    
    global_stats = {
        'total_revenue': round(total_rev, 2),
        'total_boxes': total_boxes,
        'total_transactions': total_trans,
        'avg_deal_size': round(avg_deal, 2),
        'avg_boxes_shipped': round(avg_boxes, 2)
    }
    
    # 2. Product Revenue distribution (Top 10)
    prod_rev = sales_df.groupby('Product')['Amount'].sum().sort_values(ascending=False).head(12)
    product_data = [{'product': p, 'revenue': round(float(v), 2)} for p, v in prod_rev.items()]
    
    # 3. Country Revenue distribution
    country_rev = sales_df.groupby('Country')['Amount'].agg(revenue='sum', count='count').reset_index()
    country_data = [
        {
            'country': row['Country'],
            'revenue': round(float(row['revenue']), 2),
            'count': int(row['count'])
        }
        for _, row in country_rev.iterrows()
    ]
    
    # 4. Sales Person Performance (Top 10 by Revenue)
    sp_performance = sales_df.groupby('Sales Person').agg(
        revenue=('Amount', 'sum'),
        boxes=('Boxes Shipped', 'sum'),
        deals=('transaction_id', 'count')
    ).sort_values(by='revenue', ascending=False).head(10).reset_index()
    
    sp_data = [
        {
            'salesperson': row['Sales Person'],
            'revenue': round(float(row['revenue']), 2),
            'boxes': int(row['boxes']),
            'deals': int(row['deals'])
        }
        for _, row in sp_performance.iterrows()
    ]
    
    # 5. Timeline trends (aggregate by year-month)
    # Parse date column, sorting chronologically
    sales_df_temp = sales_df.copy()
    sales_df_temp['Date_parsed'] = pd.to_datetime(sales_df_temp['Date'])
    monthly_rev = sales_df_temp.groupby(sales_df_temp['Date_parsed'].dt.to_period('M'))['Amount'].sum().sort_index()
    
    timeline_data = [
        {
            'month': str(period),
            'revenue': round(float(val), 2)
        }
        for period, val in monthly_rev.items()
    ]
    
    # 6. Correlation Scatter data (Sample 150 points for scatter plot)
    scatter_sample = sales_df.sample(150, random_state=42)
    scatter_data = [
        {
            'salesperson': row['Sales Person'],
            'product': row['Product'],
            'amount': float(row['Amount']),
            'boxes': int(row['Boxes Shipped']),
            'country': row['Country']
        }
        for _, row in scatter_sample.iterrows()
    ]
    
    return {
        'stats': global_stats,
        'product_distribution': product_data,
        'country_distribution': country_data,
        'salesperson_performance': sp_data,
        'timeline_distribution': timeline_data,
        'scatter_data': scatter_data
    }

@app.post("/api/generate-pitch")
def generate_pitch(payload: dict):
    salesperson = payload.get("salesperson", "Sales Rep")
    product = payload.get("product", "Chocolate Product")
    country = payload.get("country", "Client Country")
    amount = payload.get("amount", 0.0)
    boxes = payload.get("boxes", 0)
    client_name = payload.get("client_name", "Valued Client")
    channel = payload.get("channel", "Email")
    tone = payload.get("tone", "Professional")
    
    templates = {
        "Professional": f"Dear {client_name},\n\nI am writing to thank you for your recent partnership with AppleSalesGennie. We have successfully processed your order of {boxes} boxes of our premium {product}, totaling ${amount:,.2f}.\n\nWe look forward to continuing to supply you with the finest craft chocolates in {country}. Please let me know if we can assist you with your future inventory planning.\n\nBest regards,\n{salesperson}\nAppleSalesGennie Sales Team",
        
        "Persuasive": f"Hello {client_name},\n\nLooking at the incredible market response in {country}, your choice of {boxes} boxes of {product} is a highly strategic addition to your offerings! This transaction value of ${amount:,.2f} represents a high-yield asset for your store.\n\nGiven current supply constraints, I suggest lock-in pricing for your next batch of {product} early next month. Let's schedule a 5-minute call to secure your discount.\n\nCheers,\n{salesperson}\nAppleSalesGennie AI Intelligence",
        
        "Friendly": f"Hi {client_name}!\n\nJust wanted to reach out and say a huge thanks for ordering {boxes} boxes of {product}! We are so excited to get this shipment over to you in {country}.\n\nYour support means the world to us. Let me know how the team likes this batch, and we'll be ready for your next order whenever you are!\n\nWarmly,\n{salesperson}",
        
        "Urgent": f"URGENT INVENTORY NOTICE: {client_name},\n\nWe have logged your order of {boxes} boxes of {product} (Value: ${amount:,.2f}) for delivery to {country}.\n\nDue to an unprecedented surge in raw ingredient demand, replenishment times for {product} are projected to double next week. To avoid stockouts, let's confirm your pre-orders today to guarantee delivery dates.\n\nRegards,\n{salesperson}\nAppleSalesGennie"
    }
    
    pitch = templates.get(tone, templates["Professional"])
    
    # Adapt to channel layout
    if channel == "WhatsApp":
        message = f"📱 *WhatsApp Outreach from {salesperson}* 📱\n\n{pitch}\n\n🤖 _Sent via AppleSalesGennie AI_"
    elif channel == "LinkedIn":
        message = f"💼 *LinkedIn Sales Message* 💼\n\nHi {client_name},\n\n{pitch.replace('Dear ' + client_name + ',', '')}\n\nLet's connect!\n- {salesperson}"
    elif channel == "Slack":
        message = f"💬 *Internal Team Notice* 💬\n\n`{salesperson}` closed a deal of *{boxes} boxes* of `{product}` to `{country}` for *${amount:,.2f}*!\n\n_Outreach message sent:_\n> \"{pitch[:150]}...\""
    else: # Email
        message = f"✉️ **Client Outreach Email** ✉️\n\n**Subject:** Important Shipment Update: Your order of {product}\n\n{pitch}"
        
    return {"message": message}

# Compatibility endpoints with the React App's old names
@app.get("/api/genres")
def get_genres_compat():
    # Return unique products mapped as genres
    return get_products()

@app.get("/api/anime")
def get_anime_compat(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: str = Query(None),
    genre: str = Query(None),
    type: str = Query(None),
    sort_by: str = Query("rank"),
    sort_order: str = Query("asc")
):
    # Map filters and sorts:
    # genre maps to product, type maps to country
    # sort_by: rank maps to date, score maps to amount
    mapped_sort = "date" if sort_by == "rank" else ("amount" if sort_by == "score" else "date")
    
    res = get_sales_list(
        page=page,
        page_size=page_size,
        search=search,
        product=genre,
        country=type,
        salesperson=None,
        sort_by=mapped_sort,
        sort_order=sort_order
    )
    
    # Re-structure response fields so frontend components do not crash
    results_compat = []
    for item in res['results']:
        results_compat.append({
            'anime_id': item['transaction_id'], # mapped to transaction_id
            'title': f"{item['product']} ({item['salesperson']})",
            'score': min(10.0, item['amount'] / 2000.0), # mapped score (0-10) for circular/stars
            'rank': item['transaction_id'],
            'popularity': item['transaction_id'],
            'members': item['boxes'], # boxes shipped mapped to members
            'synopsis': f"Transaction recorded on {item['date']}. Total revenue generated is ${item['amount']:,.2f} for shipment of {item['boxes']} boxes of premium craft chocolate to clients in {item['country']}.",
            'start_date': item['date'],
            'end_date': item['date'],
            'type': item['country'], # mapped to country
            'episodes': item['boxes'], # mapped to boxes
            'image_url': f"https://images.unsplash.com/photo-1548907040-4d42b52145ca?w=200", # generic chocolate image
            'genres': [item['product']] # mapped product to genres
        })
        
    return {
        'total': res['total'],
        'page': res['page'],
        'page_size': res['page_size'],
        'total_pages': res['total_pages'],
        'results': results_compat
    }

@app.get("/api/anime/{anime_id}")
def get_anime_detail_compat(anime_id: int):
    # Fetch details
    details = get_transaction_detail(anime_id)
    
    # Map to old structure
    return {
        'anime_id': details['transaction_id'],
        'title': f"{details['product']} by {details['salesperson']}",
        'score': min(10.0, details['amount'] / 2000.0),
        'rank': details['transaction_id'],
        'popularity': details['transaction_id'],
        'members': details['boxes'],
        'synopsis': f"A major transaction successfully processed on {details['date']}. In this sale, representative {details['salesperson']} shipped {details['boxes']} boxes of {details['product']} to retail and wholesale distributors based in {details['country']}. The deal has generated a total gross value of ${details['amount']:,.2f} for AppleSalesGennie.",
        'start_date': details['date'],
        'end_date': details['date'],
        'type': details['country'],
        'episodes': details['boxes'],
        'image_url': f"https://images.unsplash.com/photo-1548907040-4d42b52145ca?w=300",
        'genres': [details['product']],
        'studios': [{'company_id': 1, 'name': details['salesperson'], 'role': 'Sales Representative'}],
        'producers': [{'company_id': 2, 'name': details['country'], 'role': 'Destination Market'}],
        'licensors': [{'company_id': 3, 'name': f"Avg price: ${details['product_stats']['avg_price_per_box']}/box", 'role': 'Pricing Metrics'}],
        'characters': [
            {
                'character_id': 1,
                'name': details['salesperson'],
                'role': f"Rank #{details['salesperson_stats']['rank']} Representative",
                'image_url': None,
                'voice_actors': [{'person_id': 1, 'name': f"Deals: {details['salesperson_stats']['deal_count']}", 'language': f"Avg boxes: {details['salesperson_stats']['avg_boxes']}", 'image_url': None}]
            }
        ],
        'staff': [
            {'person_id': 1, 'name': f"${details['salesperson_stats']['total_sales']:,.2f}", 'role': 'Rep Lifetime Sales', 'image_url': None}
        ]
    }

@app.get("/api/anime/{anime_id}/recommendations")
def get_anime_recommendations_compat(anime_id: int, limit: int = 6):
    recs = get_transaction_recommendations(anime_id, limit)
    
    results_compat = []
    for item in recs:
        results_compat.append({
            'anime_id': item['transaction_id'],
            'title': f"{item['product']} ({item['salesperson']})",
            'score': min(10.0, item['amount'] / 2000.0),
            'type': item['country'],
            'image_url': f"https://images.unsplash.com/photo-1548907040-4d42b52145ca?w=200",
            'genres': [item['product']],
            'similarity': item['similarity']
        })
    return results_compat

@app.get("/api/analytics-compat")
def get_analytics_compat():
    # Helper to return formatted stats for frontend
    analytics = get_analytics()
    
    # Convert formats
    genre_data = [{'genre': item['product'], 'count': int(item['revenue'] / 1000)} for item in analytics['product_distribution']]
    
    type_data = [
        {
            'type': item['country'],
            'avg_score': round(item['revenue'] / 50000, 2),
            'count': item['count']
        }
        for item in analytics['country_distribution']
    ]
    
    studio_data = [
        {
            'studio': item['salesperson'],
            'count': item['deals'],
            'avg_score': round(item['revenue'] / 20000, 2)
        }
        for item in analytics['salesperson_performance']
    ]
    
    year_data = [
        {
            'year': int(item['month'].split('-')[1]), # get month number as year indicator
            'count': int(item['revenue'] / 1000)
        }
        for item in analytics['timeline_distribution']
    ]
    
    scatter_data = [
        {
            'title': f"{item['product']} ({item['salesperson']})",
            'score': min(10.0, item['amount'] / 2000.0),
            'popularity': 2000 - item['boxes'] * 4,
            'members': item['boxes'],
            'type': item['country']
        }
        for item in analytics['scatter_data']
    ]
    
    global_stats = {
        'total_anime': analytics['stats']['total_transactions'],
        'avg_score': round(analytics['stats']['avg_deal_size'] / 2000.0, 2),
        'total_genres': len(analytics['product_distribution']),
        'total_characters': len(analytics['salesperson_performance']),
        'total_studios': len(analytics['country_distribution']),
    }
    
    return {
        'stats': global_stats,
        'genre_distribution': genre_data,
        'type_distribution': type_data,
        'studio_performance': studio_data,
        'year_distribution': year_data,
        'scatter_data': scatter_data
    }

@app.post("/api/generate-recommendation")
def generate_recommendation_compat(payload: dict):
    # Maps old pitch format
    salesperson = payload.get("target_friend", "Client")
    product = payload.get("anime_title", "Product")
    amount = payload.get("anime_score", 0.0) * 2000.0
    synopsis = payload.get("synopsis", "")
    tone = payload.get("tone", "Excited")
    channel = payload.get("channel", "WhatsApp")
    
    # Call generate_pitch
    mapped_tone = "Professional"
    if tone == "Excited":
        mapped_tone = "Persuasive"
    elif tone == "Casual":
        mapped_tone = "Friendly"
    elif tone == "Poetic":
        mapped_tone = "Friendly"
    elif tone == "Analytical":
        mapped_tone = "Professional"
        
    res = generate_pitch({
        'salesperson': "Sales Specialist",
        'product': product,
        'country': "Client Country",
        'amount': amount,
        'boxes': 150,
        'client_name': salesperson,
        'channel': channel,
        'tone': mapped_tone
    })
    return {"message": res["message"]}

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
