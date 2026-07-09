import os
import re
import pandas as pd
import numpy as np
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import linear_kernel

app = FastAPI(title="AnimeGenie AI Backend", version="1.0.0")

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Resolve paths
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DB_DIR = os.path.join(BASE_DIR, 'db')

# Global variables for data
anime_df = None
entities_df = None
genres_df = None
companies_df = None
characters_df = None
staff_df = None
voice_actors_df = None

# Grouped dictionaries for quick lookup
entities_dict = {}
genres_grouped = {}
companies_grouped = {}
characters_grouped = {}
staff_grouped = {}
voice_actors_grouped = {}

# TF-IDF Recommender variables
tfidf_matrix = None
anime_id_to_index = {}
index_to_anime_id = {}

def clean_genre(g):
    if not isinstance(g, str):
        return g
    if '::' in g:
        g = g.split('::')[-1].strip()
        
    words = g.split()
    if len(words) > 0 and len(words) % 2 == 0:
        half = len(words) // 2
        if words[:half] == words[half:]:
            return " ".join(words[:half])
    return g


@app.on_event("startup")
def startup_event():
    global anime_df, entities_df, genres_df, companies_df, characters_df, staff_df, voice_actors_df
    global entities_dict, genres_grouped, companies_grouped, characters_grouped, staff_grouped, voice_actors_grouped
    global tfidf_matrix, anime_id_to_index, index_to_anime_id
    
    print("Loading datasets from CSV...")
    
    # Load raw data
    anime_df = pd.read_csv(os.path.join(DB_DIR, 'anime.csv'))
    entities_df = pd.read_csv(os.path.join(DB_DIR, 'entities.csv'))
    genres_df = pd.read_csv(os.path.join(DB_DIR, 'anime_genres.csv'))
    companies_df = pd.read_csv(os.path.join(DB_DIR, 'anime_companies.csv'))
    characters_df = pd.read_csv(os.path.join(DB_DIR, 'anime_characters.csv'))
    staff_df = pd.read_csv(os.path.join(DB_DIR, 'anime_staff.csv'))
    voice_actors_df = pd.read_csv(os.path.join(DB_DIR, 'anime_voice_actors.csv'))
    
    # Clean genres
    genres_df['clean_genre'] = genres_df['genre'].apply(clean_genre)
    
    # Clean NaN values
    anime_df['synopsis'] = anime_df['synopsis'].fillna("No synopsis available.")
    anime_df['score'] = anime_df['score'].fillna(0.0)
    anime_df['rank'] = anime_df['rank'].fillna(99999)
    anime_df['popularity'] = anime_df['popularity'].fillna(99999)
    anime_df['episodes'] = anime_df['episodes'].fillna(1).astype(int)
    
    print("Indexing entities and relations...")
    
    # Build entities lookup dictionary
    entities_dict = {
        int(row['entity_id']): {
            'name': str(row['name']),
            'type': str(row['entity_type']),
            'image_url': str(row['image_url']) if pd.notna(row['image_url']) else None
        }
        for _, row in entities_df.iterrows()
    }
    
    # Group genres
    genres_grouped = genres_df.groupby('anime_id')['clean_genre'].apply(list).to_dict()
    
    # Group companies (studios, producers, licensors)
    for _, row in companies_df.iterrows():
        a_id = int(row['anime_id'])
        c_id = int(row['company_id'])
        role = str(row['role'])
        if a_id not in companies_grouped:
            companies_grouped[a_id] = []
        ent = entities_dict.get(c_id, {'name': f"Company #{c_id}", 'type': 'company', 'image_url': None})
        if ent['name'] in ['None found', 'add some']:
            continue
        companies_grouped[a_id].append({
            'company_id': c_id,
            'name': ent['name'],
            'role': role,
            'type': ent['type'],
            'image_url': ent['image_url']
        })
        
    # Group voice actors by character_id
    for _, row in voice_actors_df.iterrows():
        char_id = int(row['character_id'])
        person_id = int(row['person_id'])
        lang = str(row['language'])
        if char_id not in voice_actors_grouped:
            voice_actors_grouped[char_id] = []
        ent = entities_dict.get(person_id, {'name': f"Actor #{person_id}", 'type': 'voice_actor', 'image_url': None})
        voice_actors_grouped[char_id].append({
            'person_id': person_id,
            'name': ent['name'],
            'language': lang,
            'image_url': ent['image_url']
        })
        
    # Group characters
    for _, row in characters_df.iterrows():
        a_id = int(row['anime_id'])
        char_id = int(row['character_id'])
        role = str(row['role'])
        if a_id not in characters_grouped:
            characters_grouped[a_id] = []
        ent = entities_dict.get(char_id, {'name': f"Character #{char_id}", 'type': 'character', 'image_url': None})
        characters_grouped[a_id].append({
            'character_id': char_id,
            'name': ent['name'],
            'role': role,
            'image_url': ent['image_url'],
            'voice_actors': voice_actors_grouped.get(char_id, [])
        })
        
    # Group staff
    for _, row in staff_df.iterrows():
        a_id = int(row['anime_id'])
        p_id = int(row['person_id'])
        role = str(row['role'])
        if a_id not in staff_grouped:
            staff_grouped[a_id] = []
        ent = entities_dict.get(p_id, {'name': f"Staff #{p_id}", 'type': 'staff', 'image_url': None})
        staff_grouped[a_id].append({
            'person_id': p_id,
            'name': ent['name'],
            'role': role,
            'image_url': ent['image_url']
        })
        
    print("Fitting TF-IDF recommendation engine...")
    # Add genre details and title to synopsis to build richer features
    features = []
    for idx, row in anime_df.iterrows():
        a_id = row['anime_id']
        title = str(row['title'])
        synopsis = str(row['synopsis'])
        genres = " ".join(genres_grouped.get(a_id, []))
        
        # Pull studios for this anime
        studios = " ".join([c['name'] for c in companies_grouped.get(a_id, []) if c['role'] == 'Studio'])
        
        combined_text = f"{title} {genres} {studios} {synopsis}"
        features.append(combined_text)
        
        # Keep index mappings
        anime_id_to_index[int(a_id)] = idx
        index_to_anime_id[idx] = int(a_id)
        
    tfidf = TfidfVectorizer(stop_words='english', max_features=15000)
    tfidf_matrix = tfidf.fit_transform(features)
    print("TF-IDF Fitting complete! Server ready.")

@app.get("/api/genres")
def get_genres():
    # Return sorted unique clean genres
    unique_genres = sorted(genres_df['clean_genre'].dropna().unique().tolist())
    return unique_genres

@app.get("/api/anime")
def get_anime_list(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: str = Query(None),
    genre: str = Query(None),
    type: str = Query(None),
    sort_by: str = Query("rank"),
    sort_order: str = Query("asc")
):
    global anime_df
    if anime_df is None:
        raise HTTPException(status_code=500, detail="Data not loaded yet")
        
    filtered_df = anime_df.copy()
    
    # 1. Apply search filter
    if search:
        filtered_df = filtered_df[filtered_df['title'].str.contains(search, case=False, na=False)]
        
    # 2. Apply genre filter
    if genre:
        # Get anime_ids matching the genre
        matching_ids = genres_df[genres_df['clean_genre'] == genre]['anime_id'].unique()
        filtered_df = filtered_df[filtered_df['anime_id'].isin(matching_ids)]
        
    # 3. Apply media type filter
    if type and type != "All":
        filtered_df = filtered_df[filtered_df['type'] == type]
        
    # 4. Sort
    is_ascending = sort_order == "asc"
    if sort_by in ['score', 'members', 'episodes']:
        # For scores, members, etc. desc is usually the default, but we follow sort_order parameter
        filtered_df = filtered_df.sort_values(by=sort_by, ascending=is_ascending)
    elif sort_by == 'popularity' or sort_by == 'rank':
        # Low values are better, but we follow parameter
        filtered_df = filtered_df.sort_values(by=sort_by, ascending=is_ascending)
    else:
        # Default title sorting
        filtered_df = filtered_df.sort_values(by='title', ascending=is_ascending)
        
    total_records = len(filtered_df)
    
    # 5. Paginate
    start = (page - 1) * page_size
    end = start + page_size
    paginated_df = filtered_df.iloc[start:end]
    
    results = []
    for _, row in paginated_df.iterrows():
        a_id = int(row['anime_id'])
        results.append({
            'anime_id': a_id,
            'title': row['title'],
            'score': row['score'],
            'rank': int(row['rank']) if row['rank'] < 99999 else None,
            'popularity': int(row['popularity']) if row['popularity'] < 99999 else None,
            'members': int(row['members']),
            'synopsis': row['synopsis'],
            'start_date': row['start_date'] if pd.notna(row['start_date']) else None,
            'end_date': row['end_date'] if pd.notna(row['end_date']) else None,
            'type': row['type'],
            'episodes': int(row['episodes']),
            'image_url': row['image_url'],
            'genres': genres_grouped.get(a_id, [])
        })
        
    return {
        'total': total_records,
        'page': page,
        'page_size': page_size,
        'total_pages': int(np.ceil(total_records / page_size)),
        'results': results
    }

@app.get("/api/anime/{anime_id}")
def get_anime_detail(anime_id: int):
    global anime_df
    if anime_df is None:
        raise HTTPException(status_code=500, detail="Data not loaded yet")
        
    # Get anime details
    rows = anime_df[anime_df['anime_id'] == anime_id]
    if rows.empty:
        raise HTTPException(status_code=404, detail="Anime not found")
        
    row = rows.iloc[0]
    
    # Compile companies
    companies = companies_grouped.get(anime_id, [])
    studios = [c for c in companies if c['role'] == 'Studio']
    producers = [c for c in companies if c['role'] == 'Producer']
    licensors = [c for c in companies if c['role'] == 'Licensor']
    
    detail = {
        'anime_id': anime_id,
        'title': row['title'],
        'score': row['score'],
        'rank': int(row['rank']) if row['rank'] < 99999 else None,
        'popularity': int(row['popularity']) if row['popularity'] < 99999 else None,
        'members': int(row['members']),
        'synopsis': row['synopsis'],
        'start_date': row['start_date'] if pd.notna(row['start_date']) else None,
        'end_date': row['end_date'] if pd.notna(row['end_date']) else None,
        'type': row['type'],
        'episodes': int(row['episodes']),
        'image_url': row['image_url'],
        'genres': genres_grouped.get(anime_id, []),
        'studios': studios,
        'producers': producers,
        'licensors': licensors,
        'characters': characters_grouped.get(anime_id, [])[:15],  # Limit to top 15 characters
        'staff': staff_grouped.get(anime_id, [])[:10]             # Limit to top 10 staff members
    }
    
    return detail

@app.get("/api/anime/{anime_id}/recommendations")
def get_anime_recommendations(anime_id: int, limit: int = 6):
    global tfidf_matrix, anime_id_to_index, index_to_anime_id, anime_df
    if tfidf_matrix is None:
        raise HTTPException(status_code=500, detail="ML model not ready yet")
        
    if anime_id not in anime_id_to_index:
        raise HTTPException(status_code=404, detail="Anime not found in dataset")
        
    target_idx = anime_id_to_index[anime_id]
    
    # Calculate cosine similarity of target anime with all other anime
    # linear_kernel is equivalent to cosine_similarity when TF-IDF vectors are L2-normalized (default in TfidfVectorizer)
    cosine_sim = linear_kernel(tfidf_matrix[target_idx], tfidf_matrix).flatten()
    
    # Get top index indices sorted by similarity (descending)
    sim_indices = np.argsort(cosine_sim)[::-1]
    
    # Filter out target anime itself and get top limit
    recommendation_indices = []
    for idx in sim_indices:
        a_id = index_to_anime_id[idx]
        if a_id == anime_id:
            continue
        recommendation_indices.append(idx)
        if len(recommendation_indices) >= limit:
            break
            
    # Fetch anime objects
    recommendations = []
    for idx in recommendation_indices:
        rec_row = anime_df.iloc[idx]
        rec_id = int(rec_row['anime_id'])
        recommendations.append({
            'anime_id': rec_id,
            'title': rec_row['title'],
            'score': rec_row['score'],
            'type': rec_row['type'],
            'image_url': rec_row['image_url'],
            'genres': genres_grouped.get(rec_id, []),
            'similarity': float(cosine_sim[idx])
        })
        
    return recommendations

@app.get("/api/analytics")
def get_analytics():
    global anime_df, genres_df, companies_df
    if anime_df is None:
        raise HTTPException(status_code=500, detail="Data not loaded yet")
        
    # 1. Top genres count
    genre_counts = genres_df['clean_genre'].value_counts().head(12).to_dict()
    genre_data = [{'genre': g, 'count': c} for g, c in genre_counts.items()]
    
    # 2. Avg score by media type
    type_stats = anime_df.groupby('type').agg(
        avg_score=('score', 'mean'),
        count=('score', 'count')
    ).reset_index()
    type_data = [
        {
            'type': row['type'],
            'avg_score': round(float(row['avg_score']), 2),
            'count': int(row['count'])
        }
        for _, row in type_stats.iterrows()
    ]
    
    # 3. Top studios by count and score
    # Filter company role == 'Studio'
    studios_mapped = []
    for a_id, comps in companies_grouped.items():
        for c in comps:
            if c['role'] == 'Studio':
                studios_mapped.append({
                    'anime_id': a_id,
                    'studio_name': c['name']
                })
    
    studios_df = pd.DataFrame(studios_mapped)
    studio_data = []
    if not studios_df.empty:
        merged_studios = studios_df.merge(anime_df[['anime_id', 'score']], on='anime_id')
        studio_stats = merged_studios.groupby('studio_name').agg(
            count=('score', 'count'),
            avg_score=('score', 'mean')
        ).reset_index()
        top_studios = studio_stats.sort_values(by='count', ascending=False).head(10)
        studio_data = [
            {
                'studio': row['studio_name'],
                'count': int(row['count']),
                'avg_score': round(float(row['avg_score']), 2)
            }
            for _, row in top_studios.iterrows()
        ]
        
    # 4. Release year trends (start_date parsing)
    years = []
    for start_date in anime_df['start_date'].dropna():
        match = re.search(r'\d{4}', str(start_date))
        if match:
            years.append(int(match.group()))
    
    year_counts = pd.Series(years).value_counts().sort_index()
    # Filter years e.g., between 1990 and 2026 for readability
    year_counts = year_counts[(year_counts.index >= 1990) & (year_counts.index <= 2026)]
    year_data = [{'year': int(y), 'count': int(c)} for y, c in year_counts.items()]
    
    # 5. Score vs Popularity Scatter data (Take 150 sampled items to avoid lag in frontend)
    # Sample from top 1000 popular ones to make the scatter plot look good and meaningful
    scatter_df = anime_df[anime_df['popularity'] < 2000].sample(150, random_state=42)
    scatter_data = [
        {
            'title': row['title'],
            'score': float(row['score']),
            'popularity': int(row['popularity']),
            'members': int(row['members']),
            'type': row['type']
        }
        for _, row in scatter_df.iterrows()
    ]
    
    # 6. Global Stats
    global_stats = {
        'total_anime': len(anime_df),
        'avg_score': round(float(anime_df[anime_df['score'] > 0]['score'].mean()), 2),
        'total_genres': int(genres_df['clean_genre'].nunique()),
        'total_characters': len(entities_df[entities_df['entity_type'] == 'character']),
        'total_studios': len(entities_df[entities_df['entity_type'] == 'studio']),
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
def generate_recommendation(payload: dict):
    anime_title = payload.get("anime_title", "")
    anime_score = payload.get("anime_score", 0.0)
    genres = payload.get("genres", [])
    synopsis = payload.get("synopsis", "")
    target_friend = payload.get("target_friend", "Anime Fan")
    channel = payload.get("channel", "WhatsApp")
    tone = payload.get("tone", "Excited")
    
    # Template-based AI recommendation generator
    genre_str = ", ".join(genres)
    
    tone_phrases = {
        "Excited": f"OH MY GOD! You HAVE to watch {anime_title}! 🎬✨ It has a score of {anime_score}/10 and is a mind-blowing {genre_str} anime!",
        "Analytical": f"Based on content similarity and structural tropes, I highly recommend analyzing {anime_title}. It scores {anime_score}/10, showcasing high production value in the {genre_str} categories.",
        "Casual": f"Hey, if you're looking for something new, check out {anime_title}. It's a solid {genre_str} show rated {anime_score}/10.",
        "Poetic": f"Immerse your soul in {anime_title}. An artistic journey of score {anime_score}/10, blending the essence of {genre_str} with visual poetry."
    }
    
    msg_template = tone_phrases.get(tone, tone_phrases["Excited"])
    
    synopsis_snippet = synopsis[:120] + "..." if len(synopsis) > 120 else synopsis
    
    if channel == "WhatsApp":
        message = f"📱 *WhatsApp Recommendation for {target_friend}* 📱\n\n\"{msg_template}\"\n\n*Quick Synopsis:* {synopsis_snippet}\n\n🤖 _Sent via AnimeGenie AI Recommendations_"
    elif channel == "Discord":
        message = f"💬 **Discord Share Recommendation to {target_friend}** 💬\n\n\"{msg_template}\"\n\n> **Synopsis:** {synopsis_snippet}\n\n*Generated by AnimeGenie AI*"
    else:  # Social / General
        message = f"📣 **AnimeGenie Recommendation Share** 📣\n\nHey {target_friend}, check out this recommendations:\n\"{msg_template}\"\n\nTags: #AnimeGenie #AnimeRecommendation #{genres[0] if genres else 'Anime'}"
        
    return {"message": message}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
