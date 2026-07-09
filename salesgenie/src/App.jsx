import React, { useState, useEffect, useMemo } from 'react';
import {
  Sparkles,
  Search,
  LayoutDashboard,
  Clock,
  Settings,
  Star,
  Film,
  Tv,
  Users,
  Award,
  Layers,
  Send,
  Plus,
  X,
  Check,
  CheckCircle,
  Copy,
  ArrowRight,
  TrendingUp,
  Cpu,
  Bookmark,
  Share2,
  RefreshCw,
  HelpCircle,
  AlertCircle
} from 'lucide-react';

const API_BASE = "http://127.0.0.1:8000/api";

const WATCH_STAGES = [
  { id: "plan", label: "Plan to Watch", color: "bg-slate-100 border-slate-200 text-slate-700", dot: "bg-slate-400" },
  { id: "watching", label: "Watching", color: "bg-indigo-50 border-indigo-200 text-indigo-700", dot: "bg-indigo-500" },
  { id: "hold", label: "On Hold", color: "bg-amber-50 border-amber-200 text-amber-700", dot: "bg-amber-500" },
  { id: "completed", label: "Completed", color: "bg-emerald-50 border-emerald-200 text-emerald-700", dot: "bg-emerald-500" },
  { id: "dropped", label: "Dropped", color: "bg-rose-50 border-rose-200 text-rose-700", dot: "bg-rose-500" }
];

function App() {
  const [activeTab, setActiveTab] = useState("Catalog"); // Catalog, Watch Queue, AI Share, EDA Dashboard
  const [toast, setToast] = useState(null);
  
  // Catalog State
  const [animeList, setAnimeList] = useState([]);
  const [genres, setGenres] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGenre, setSelectedGenre] = useState("");
  const [selectedType, setSelectedType] = useState("All");
  const [sortBy, setSortBy] = useState("rank");
  const [sortOrder, setSortOrder] = useState("asc");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [loadingList, setLoadingList] = useState(false);

  // Detail State
  const [selectedAnimeId, setSelectedAnimeId] = useState(28977); // Gintama° as default
  const [animeDetail, setAnimeDetail] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Watch Queue State (analogous to Sales pipeline)
  const [watchQueue, setWatchQueue] = useState(() => {
    const saved = localStorage.getItem("animegenie_queue");
    return saved ? JSON.parse(saved) : [
      { anime_id: 28977, title: "Gintama°", type: "TV", image_url: "https://cdn.myanimelist.net/images/anime/3/72078.jpg", stage: "watching", dateAdded: "2h ago" },
      { anime_id: 11061, title: "Hunter x Hunter (2011)", type: "TV", image_url: "https://cdn.myanimelist.net/images/anime/11/33657.jpg", stage: "plan", dateAdded: "1d ago" },
      { anime_id: 38524, title: "Shingeki no Kyojin Season 3 Part 2", type: "TV", image_url: "https://cdn.myanimelist.net/images/anime/1517/100632.jpg", stage: "completed", dateAdded: "3d ago" }
    ];
  });

  // User Preferences (for Genie Match Score calculation)
  const [userFavGenres, setUserFavGenres] = useState(["Action", "Comedy", "Fantasy", "Drama"]);
  
  // AI Share Workspace State
  const [shareAnime, setShareAnime] = useState(null);
  const [shareFriend, setShareFriend] = useState("");
  const [shareChannel, setShareChannel] = useState("WhatsApp"); // WhatsApp, Discord, Social
  const [shareTone, setShareTone] = useState("Excited"); // Excited, Analytical, Casual, Poetic
  const [generatedPost, setGeneratedPost] = useState("");
  const [generatingPost, setGeneratingPost] = useState(false);

  // EDA Dashboard State
  const [analytics, setAnalytics] = useState(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Sync Watch Queue with LocalStorage
  useEffect(() => {
    localStorage.setItem("animegenie_queue", JSON.stringify(watchQueue));
  }, [watchQueue]);

  // Fetch Genres list on startup
  useEffect(() => {
    fetch(`${API_BASE}/genres`)
      .then(res => res.json())
      .then(data => setGenres(data))
      .catch(err => console.error("Error fetching genres:", err));
  }, []);

  // Fetch Anime List when filters change
  useEffect(() => {
    setLoadingList(true);
    let url = `${API_BASE}/anime?page=${page}&sort_by=${sortBy}&sort_order=${sortOrder}`;
    if (searchQuery) url += `&search=${encodeURIComponent(searchQuery)}`;
    if (selectedGenre) url += `&genre=${encodeURIComponent(selectedGenre)}`;
    if (selectedType && selectedType !== "All") url += `&type=${encodeURIComponent(selectedType)}`;

    fetch(url)
      .then(res => res.json())
      .then(data => {
        setAnimeList(data.results);
        setTotalPages(data.total_pages);
        setTotalRecords(data.total);
        setLoadingList(false);
      })
      .catch(err => {
        console.error("Error fetching anime:", err);
        setLoadingList(false);
      });
  }, [page, searchQuery, selectedGenre, selectedType, sortBy, sortOrder]);

  // Fetch Anime Detail & Recommendations when selected ID changes
  useEffect(() => {
    if (!selectedAnimeId) return;
    setLoadingDetail(true);
    
    // Fetch detail
    fetch(`${API_BASE}/anime/${selectedAnimeId}`)
      .then(res => {
        if (!res.ok) throw new Error("Anime not found");
        return res.json();
      })
      .then(data => {
        setAnimeDetail(data);
        setShareAnime(data);
        setLoadingDetail(false);
      })
      .catch(err => {
        console.error("Error fetching detail:", err);
        setLoadingDetail(false);
      });

    // Fetch ML Recommendations
    fetch(`${API_BASE}/anime/${selectedAnimeId}/recommendations?limit=6`)
      .then(res => res.json())
      .then(data => setRecommendations(data))
      .catch(err => console.error("Error fetching recommendations:", err));
  }, [selectedAnimeId]);

  // Fetch Analytics data for Dashboard
  useEffect(() => {
    if (activeTab === "EDA Dashboard") {
      setLoadingAnalytics(true);
      fetch(`${API_BASE}/analytics`)
        .then(res => res.json())
        .then(data => {
          setAnalytics(data);
          setLoadingAnalytics(false);
        })
        .catch(err => {
          console.error("Error fetching analytics:", err);
          setLoadingAnalytics(false);
        });
    }
  }, [activeTab]);

  // Calculate Match Score dynamically based on User preferred genres
  const genieMatchScore = useMemo(() => {
    if (!animeDetail) return 0;
    // Base score from original MAL rating weight (e.g. 50%) + Genre alignment weight (e.g. 50%)
    const scoreWeight = animeDetail.score * 5; // Convert 0-10 score to 0-50 weight
    
    const matchingGenres = animeDetail.genres.filter(g => userFavGenres.includes(g));
    const genreWeight = Math.min(50, matchingGenres.length * 15); // 15 points per match up to 50
    
    return Math.round(scoreWeight + genreWeight);
  }, [animeDetail, userFavGenres]);

  const getScoreCategory = (score) => {
    if (score >= 85) return { label: "High Affinity", color: "bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100", dot: "bg-purple-500" };
    if (score >= 65) return { label: "Good Match", color: "bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100", dot: "bg-indigo-500" };
    if (score >= 45) return { label: "Potential Interest", color: "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100", dot: "bg-blue-500" };
    return { label: "Low Match", color: "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100", dot: "bg-slate-400" };
  };

  // Manage watch queue stages
  const handleAddToQueue = (anime, stageId) => {
    setWatchQueue(prev => {
      // check if already exists
      const filtered = prev.filter(item => item.anime_id !== anime.anime_id);
      const newEntry = {
        anime_id: anime.anime_id,
        title: anime.title,
        type: anime.type,
        image_url: anime.image_url,
        stage: stageId,
        dateAdded: "Just now"
      };
      return [newEntry, ...filtered];
    });
    showToast(`"${anime.title}" added to ${WATCH_STAGES.find(s => s.id === stageId).label}!`);
  };

  const handleRemoveFromQueue = (animeId) => {
    setWatchQueue(prev => prev.filter(item => item.anime_id !== animeId));
    showToast("Removed from tracker.");
  };

  // Generate AI Share Post via backend API
  const handleGenerateShare = () => {
    if (!shareAnime) return;
    setGeneratingPost(true);

    fetch(`${API_BASE}/generate-recommendation`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        anime_title: shareAnime.title,
        anime_score: shareAnime.score,
        genres: shareAnime.genres,
        synopsis: shareAnime.synopsis,
        target_friend: shareFriend || "Anime Friend",
        channel: shareChannel,
        tone: shareTone
      })
    })
      .then(res => res.json())
      .then(data => {
        setGeneratedPost(data.message);
        setGeneratingPost(false);
        showToast("AI post generated!");
      })
      .catch(err => {
        console.error("Error generating post:", err);
        setGeneratingPost(false);
      });
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    showToast("Copied to clipboard!");
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#f3f4f6] text-slate-800 antialiased selection:bg-purple-100 selection:text-purple-900">
      
      {/* Toast Alert */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-white shadow-2xl animate-in fade-in slide-in-from-bottom-5">
          <CheckCircle className="h-5 w-5 text-purple-400" />
          <span className="text-sm font-medium">{toast.message}</span>
        </div>
      )}

      {/* COLUMN 1: LEFT NAVIGATION SIDEBAR */}
      <aside className="flex w-64 flex-col justify-between border-r border-slate-800 bg-[#0f172a] text-slate-300">
        <div>
          {/* Logo Brand area */}
          <div className="flex h-16 items-center gap-2.5 px-6 border-b border-slate-800/80">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-purple-500 via-indigo-600 to-violet-500 text-white shadow-lg shadow-purple-500/20">
              <Sparkles className="h-4.5 w-4.5" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-white leading-none">AnimeGenie</h1>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-purple-400">ML Discovery Engine</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="mt-6 space-y-1.5 px-3">
            {[
              { name: "Catalog", icon: Film },
              { name: "Watch Queue", icon: Layers },
              { name: "AI Share Workspace", icon: Send },
              { name: "EDA Dashboard", icon: LayoutDashboard }
            ].map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.name;
              return (
                <button
                  key={item.name}
                  onClick={() => setActiveTab(item.name)}
                  className={`flex w-full items-center gap-3.5 rounded-lg px-4 py-3 text-sm font-medium transition-all duration-200 group relative ${
                    isActive
                      ? "bg-purple-600 text-white shadow-md shadow-purple-600/10"
                      : "hover:bg-slate-800/60 hover:text-white"
                  }`}
                >
                  <Icon className={`h-5 w-5 transition-transform duration-200 group-hover:scale-105 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`} />
                  <span>{item.name}</span>
                  {isActive && (
                    <span className="absolute right-3 top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-white shadow" />
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer Settings Area */}
        <div className="border-t border-slate-800 p-4">
          <div className="flex flex-col gap-2 rounded-lg bg-slate-800/40 p-3">
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wide">My Match Preferences</span>
            <div className="flex flex-wrap gap-1 mt-1">
              {userFavGenres.map(g => (
                <span key={g} className="text-[9px] bg-purple-950/60 text-purple-300 px-1.5 py-0.5 rounded border border-purple-800/40">{g}</span>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-lg p-2 mt-3 hover:bg-slate-800/40">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-500/10 text-purple-400 font-semibold text-sm">
              AG
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate">Anime Enthusiast</p>
              <p className="text-[10px] text-slate-500 truncate">ML Model v1.0 • Active</p>
            </div>
            <Settings className="h-4.5 w-4.5 text-slate-500 hover:text-slate-300 cursor-pointer" />
          </div>
        </div>
      </aside>

      {/* MAIN LAYOUT: CHOSEN TAB VIEW */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* TAB 1: CATALOG TAB */}
        {activeTab === "Catalog" && (
          <div className="flex flex-1 overflow-hidden">
            
            {/* COLUMN 2: ANIME LIST (MIDDLE PANEL) */}
            <section className="flex w-96 flex-col border-r border-slate-200 bg-white">
              {/* Header Area */}
              <div className="p-4 border-b border-slate-100 flex flex-col gap-3 shrink-0">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 leading-tight">Anime Catalog</h2>
                    <p className="text-xs text-slate-500 font-medium">Browse, search, and ML recommend</p>
                  </div>
                  <span className="text-xs font-bold bg-purple-50 text-purple-600 px-2 py-0.5 rounded border border-purple-100">
                    {totalRecords.toLocaleString()} Shows
                  </span>
                </div>

                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
                    placeholder="Search titles..."
                    className="w-full rounded-lg border border-slate-200 bg-slate-50/50 py-2 pl-9 pr-4 text-xs font-medium text-slate-700 placeholder-slate-400 outline-none transition-all focus:border-purple-500 focus:bg-white focus:ring-1 focus:ring-purple-500"
                  />
                </div>

                {/* Genre & Type Selectors */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Genre</label>
                    <select
                      value={selectedGenre}
                      onChange={(e) => { setSelectedGenre(e.target.value); setPage(1); }}
                      className="w-full rounded-lg border border-slate-200 bg-slate-50/80 p-1.5 text-xs font-medium text-slate-700 focus:outline-none"
                    >
                      <option value="">All Genres</option>
                      {genres.map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Format</label>
                    <select
                      value={selectedType}
                      onChange={(e) => { setSelectedType(e.target.value); setPage(1); }}
                      className="w-full rounded-lg border border-slate-200 bg-slate-50/80 p-1.5 text-xs font-medium text-slate-700 focus:outline-none"
                    >
                      <option value="All">All formats</option>
                      <option value="TV">TV Show</option>
                      <option value="Movie">Movie</option>
                      <option value="OVA">OVA</option>
                      <option value="ONA">ONA</option>
                      <option value="Special">Special</option>
                    </select>
                  </div>
                </div>

                {/* Sorting Controls */}
                <div className="flex gap-2 items-center justify-between border-t border-slate-50 pt-2 text-[10px] font-semibold text-slate-500">
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setSortBy(sortBy === "rank" ? "score" : "rank")}
                      className={`px-2 py-0.5 rounded ${sortBy === "rank" || sortBy === "score" ? "bg-slate-100 text-slate-900 font-bold" : ""}`}
                    >
                      Sort: {sortBy === "rank" ? "Rank" : sortBy === "score" ? "Rating" : "Title"}
                    </button>
                    <button 
                      onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                      className="px-2 py-0.5 bg-slate-50 rounded border border-slate-200"
                    >
                      {sortOrder.toUpperCase()}
                    </button>
                  </div>
                  
                  {/* Pagination Stats */}
                  <span>Pg {page} of {totalPages}</span>
                </div>
              </div>

              {/* List Content */}
              <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-2 space-y-1.5 bg-slate-50/40">
                {loadingList ? (
                  <div className="flex flex-col items-center justify-center p-12 text-center">
                    <RefreshCw className="h-8 w-8 text-purple-600 animate-spin" />
                    <p className="text-xs text-slate-400 mt-2 font-medium">Re-indexing database...</p>
                  </div>
                ) : animeList.length > 0 ? (
                  animeList.map((a) => {
                    const isActive = a.anime_id === selectedAnimeId;
                    
                    return (
                      <div
                        key={a.anime_id}
                        onClick={() => setSelectedAnimeId(a.anime_id)}
                        className={`flex gap-3 rounded-xl border p-3 transition-all duration-200 cursor-pointer group ${
                          isActive
                            ? "bg-purple-50/40 border-purple-200 shadow-xs"
                            : "bg-white border-slate-100 hover:border-slate-200"
                        }`}
                      >
                        {/* Image */}
                        <div className="h-14 w-10 shrink-0 overflow-hidden rounded bg-slate-100 relative shadow-inner">
                          <img 
                            src={a.image_url || "/placeholder.jpg"} 
                            alt={a.title} 
                            className="h-full w-full object-cover"
                            onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=120"; }}
                          />
                        </div>

                        {/* Info */}
                        <div className="min-w-0 flex-1 flex flex-col justify-between">
                          <div>
                            <h4 className="font-bold text-[11px] leading-tight text-slate-900 group-hover:text-purple-600 transition-colors truncate">
                              {a.title}
                            </h4>
                            <p className="text-[10px] text-slate-500 truncate mt-0.5">
                              {a.type} • {a.episodes} eps • <span className="font-bold text-slate-700">★ {a.score.toFixed(2)}</span>
                            </p>
                          </div>

                          <div className="flex flex-wrap gap-1 overflow-hidden max-h-4">
                            {a.genres.slice(0, 3).map((g) => (
                              <span key={g} className="text-[8px] bg-slate-100 text-slate-500 px-1 py-0.2 rounded font-medium">
                                {g}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Rank indicator badge */}
                        <div className="flex flex-col items-end justify-center shrink-0">
                          {a.rank ? (
                            <span className="text-[9px] font-bold text-purple-600 bg-purple-50 border border-purple-100/50 px-1.5 py-0.5 rounded">
                              #{a.rank}
                            </span>
                          ) : (
                            <span className="text-[9px] font-bold text-slate-400">-</span>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="flex flex-col items-center justify-center p-8 text-center bg-white border border-slate-100 rounded-xl m-2">
                    <AlertCircle className="h-8 w-8 text-slate-300" />
                    <p className="text-sm font-semibold text-slate-700 mt-2">No anime found</p>
                    <p className="text-xs text-slate-400 mt-1">Try adjusting search filters</p>
                  </div>
                )}
              </div>

              {/* Pagination Footer */}
              <div className="p-3 border-t border-slate-100 flex items-center justify-between shrink-0 bg-white">
                <button
                  disabled={page === 1}
                  onClick={() => setPage(prev => Math.max(1, prev - 1))}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                >
                  Prev
                </button>
                <span className="text-xs font-bold text-slate-700">Page {page} of {totalPages}</span>
                <button
                  disabled={page === totalPages}
                  onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </section>

            {/* COLUMN 3: DETAILED ANIME VIEW (RIGHT MAIN PANEL) */}
            <main className="flex-1 bg-[#f8fafc] overflow-y-auto flex flex-col">
              {loadingDetail ? (
                <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
                  <RefreshCw className="h-10 w-10 text-purple-600 animate-spin" />
                  <p className="text-sm text-slate-400 mt-3 font-semibold">Running ML content analysis...</p>
                </div>
              ) : animeDetail ? (
                <>
                  {/* Sticky Detail Header */}
                  <div className="sticky top-0 z-10 flex items-center justify-between bg-white/80 border-b border-slate-200/60 p-5 backdrop-blur-md">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-9 shrink-0 overflow-hidden rounded bg-slate-100 shadow-sm border border-slate-100">
                        <img src={animeDetail.image_url} alt={animeDetail.title} className="h-full w-full object-cover" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h2 className="text-base font-extrabold text-slate-900 tracking-tight leading-tight">
                            {animeDetail.title}
                          </h2>
                          <span className="rounded-full bg-purple-50 px-2 py-0.5 text-[9px] font-bold text-purple-600 border border-purple-100">
                            {animeDetail.type}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 font-semibold mt-0.5">
                          {animeDetail.episodes} Episodes • {animeDetail.start_date || "?"} to {animeDetail.end_date || "?"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Track / Stage selector */}
                      <select
                        onChange={(e) => {
                          if (e.target.value) {
                            handleAddToQueue(animeDetail, e.target.value);
                            e.target.value = "";
                          }
                        }}
                        className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 shadow-sm hover:bg-slate-50 focus:outline-none"
                      >
                        <option value="">+ Add to Watch Queue</option>
                        {WATCH_STAGES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                      </select>

                      <button
                        onClick={() => {
                          setShareAnime(animeDetail);
                          setActiveTab("AI Share Workspace");
                        }}
                        className="flex items-center gap-1.5 rounded-lg bg-purple-600 px-3.5 py-2 text-xs font-bold text-white shadow-md shadow-purple-600/10 hover:bg-purple-700 focus:outline-none"
                      >
                        <Share2 className="h-3.5 w-3.5" />
                        <span>Share AI Post</span>
                      </button>
                    </div>
                  </div>

                  {/* Main Detail Body Content */}
                  <div className="p-5 space-y-5">
                    
                    {/* circular Affinity Gauge and Key Stats */}
                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                      
                      {/* circular Gauge card */}
                      <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-xs flex items-center justify-center gap-4">
                        <div className="relative flex items-center justify-center">
                          <svg className="h-20 w-20">
                            <circle className="text-slate-100" strokeWidth="6" stroke="currentColor" fill="transparent" r="32" cx="40" cy="40" />
                            <circle
                              className="text-purple-600 progress-ring__circle"
                              strokeWidth="6"
                              strokeDasharray={2 * Math.PI * 32}
                              strokeDashoffset={((100 - genieMatchScore) / 100) * (2 * Math.PI * 32)}
                              strokeLinecap="round"
                              stroke="currentColor"
                              fill="transparent"
                              r="32"
                              cx="40"
                              cy="40"
                            />
                          </svg>
                          <div className="absolute flex flex-col items-center justify-center">
                            <span className="text-xl font-extrabold text-slate-900 leading-none">{genieMatchScore}%</span>
                          </div>
                        </div>

                        <div>
                          <span className="text-[10px] font-bold text-purple-600 uppercase tracking-wider block">Genie Affinity</span>
                          <span className="text-[11px] font-bold text-slate-800 block mt-0.5 leading-snug">
                            {getScoreCategory(genieMatchScore).label}
                          </span>
                          <span className="text-[9px] text-slate-400 font-semibold mt-1 block">
                            Based on your preferred genres list
                          </span>
                        </div>
                      </div>

                      {/* Stats Column cards */}
                      <div className="col-span-2 grid grid-cols-4 gap-3">
                        {[
                          { label: "Rating", value: `★ ${animeDetail.score.toFixed(2)}`, sub: "MAL Score", color: "text-amber-500 bg-amber-50 border-amber-100" },
                          { label: "Ranked", value: animeDetail.rank ? `#${animeDetail.rank}` : "-", sub: "Global ranking", color: "text-purple-600 bg-purple-50 border-purple-100" },
                          { label: "Popularity", value: animeDetail.popularity ? `#${animeDetail.popularity}` : "-", sub: "Watch ranking", color: "text-indigo-600 bg-indigo-50 border-indigo-100" },
                          { label: "Members", value: animeDetail.members.toLocaleString(), sub: "Users watching", color: "text-emerald-600 bg-emerald-50 border-emerald-100" }
                        ].map((stat, i) => (
                          <div key={i} className={`rounded-xl border p-3 flex flex-col justify-between ${stat.color} shadow-xs`}>
                            <span className="text-[8px] font-extrabold uppercase tracking-wide opacity-80">{stat.label}</span>
                            <span className="text-sm font-extrabold leading-none my-1">{stat.value}</span>
                            <span className="text-[8px] opacity-70 font-semibold">{stat.sub}</span>
                          </div>
                        ))}
                      </div>

                    </div>

                    {/* Synopsis Description Card */}
                    <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-xs">
                      <h3 className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-2">Synopsis</h3>
                      <p className="text-xs leading-relaxed text-slate-700 font-medium">
                        {animeDetail.synopsis}
                      </p>
                      
                      <div className="flex flex-wrap gap-1.5 mt-4 pt-3 border-t border-slate-50">
                        {animeDetail.genres.map(g => (
                          <span key={g} className="rounded-full bg-purple-50 text-purple-600 border border-purple-100/50 px-2.5 py-0.5 text-[10px] font-bold">
                            {g}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Studios, Characters & Voice Actors */}
                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                      
                      {/* Production Details */}
                      <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-xs">
                        <h3 className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-3 border-b border-slate-50 pb-1.5">Production Companies</h3>
                        <div className="space-y-2">
                          <div>
                            <span className="text-[9px] font-bold text-slate-400 uppercase">Studios</span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {animeDetail.studios.length > 0 ? animeDetail.studios.map(s => (
                                <span key={s.company_id} className="text-xs bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-md font-bold text-slate-800">
                                  {s.name}
                                </span>
                              )) : <span className="text-xs text-slate-400">Unknown Studio</span>}
                            </div>
                          </div>
                          
                          <div className="pt-2">
                            <span className="text-[9px] font-bold text-slate-400 uppercase">Producers & Licensors</span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {animeDetail.producers.concat(animeDetail.licensors).slice(0, 8).map(p => (
                                <span key={p.company_id} className="text-[9px] bg-slate-50 border border-slate-100 text-slate-500 px-2 py-0.5 rounded font-medium">
                                  {p.name} ({p.role})
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Key Production Staff */}
                      <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-xs">
                        <h3 className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-3 border-b border-slate-50 pb-1.5">Key Staff</h3>
                        <div className="grid grid-cols-2 gap-2">
                          {animeDetail.staff.length > 0 ? animeDetail.staff.map(s => (
                            <div key={s.person_id} className="flex items-center gap-2 p-1.5 bg-slate-50 rounded border border-slate-100">
                              <div className="h-7 w-7 rounded-full bg-slate-200 shrink-0 overflow-hidden">
                                {s.image_url ? <img src={s.image_url} alt={s.name} className="h-full w-full object-cover" /> : null}
                              </div>
                              <div className="min-w-0">
                                <p className="text-[9px] font-bold text-slate-800 truncate">{s.name}</p>
                                <p className="text-[8px] text-slate-400 truncate leading-none mt-0.5">{s.role}</p>
                              </div>
                            </div>
                          )) : <span className="text-xs text-slate-400">Staff details not available</span>}
                        </div>
                      </div>

                    </div>

                    {/* Characters & Voice Actors List */}
                    <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-xs">
                      <h3 className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-3 border-b border-slate-50 pb-1.5">Characters & Japanese Voice Actors</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                        {animeDetail.characters.length > 0 ? animeDetail.characters.map(c => {
                          const va = c.voice_actors.find(va => va.language === "Japanese") || c.voice_actors[0];
                          
                          return (
                            <div key={c.character_id} className="flex justify-between items-center p-2 rounded-lg border border-slate-100 bg-slate-50/50">
                              {/* Character */}
                              <div className="flex items-center gap-2 min-w-0 flex-1">
                                <div className="h-8 w-8 bg-slate-200 rounded overflow-hidden shrink-0 shadow-inner">
                                  {c.image_url ? <img src={c.image_url} alt={c.name} className="h-full w-full object-cover" /> : null}
                                </div>
                                <div className="min-w-0">
                                  <p className="text-[9px] font-bold text-slate-900 truncate">{c.name}</p>
                                  <p className="text-[8px] text-slate-400 leading-none">{c.role}</p>
                                </div>
                              </div>
                              
                              {/* Voice Actor Arrow */}
                              {va && <ArrowRight className="h-3 w-3 text-slate-300 mx-1.5 shrink-0" />}

                              {/* Voice Actor */}
                              {va && (
                                <div className="flex items-center gap-2 min-w-0 text-right justify-end flex-1">
                                  <div className="min-w-0">
                                    <p className="text-[9px] font-bold text-slate-800 truncate">{va.name}</p>
                                    <p className="text-[8px] text-purple-500 leading-none">{va.language}</p>
                                  </div>
                                  <div className="h-8 w-8 bg-slate-200 rounded-full overflow-hidden shrink-0 shadow-inner">
                                    {va.image_url ? <img src={va.image_url} alt={va.name} className="h-full w-full object-cover" /> : null}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        }) : <span className="text-xs text-slate-400">Character mappings not available</span>}
                      </div>
                    </div>

                    {/* Machine Learning Recommendations Carousel */}
                    <div>
                      <div className="flex items-center justify-between mb-3 border-b border-slate-200 pb-1.5">
                        <div className="flex items-center gap-1.5">
                          <Cpu className="h-4.5 w-4.5 text-purple-600" />
                          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">ML Content-Based Recommendations</h3>
                        </div>
                        <span className="text-[9px] bg-indigo-50 border border-indigo-100 text-indigo-600 px-2 py-0.5 rounded font-bold uppercase">
                          TF-IDF + Cosine Similarity
                        </span>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                        {recommendations.map(rec => (
                          <div 
                            key={rec.anime_id}
                            onClick={() => setSelectedAnimeId(rec.anime_id)}
                            className="bg-white rounded-xl border border-slate-200/80 p-2 flex flex-col justify-between hover:border-purple-300 transition-all cursor-pointer group shadow-xs hover:shadow-xs"
                          >
                            <div>
                              <div className="aspect-[3/4] rounded bg-slate-100 overflow-hidden shadow-inner relative">
                                <img src={rec.image_url} alt={rec.title} className="h-full w-full object-cover transition-transform group-hover:scale-105" />
                                <span className="absolute bottom-1 right-1 bg-slate-900/80 text-[8px] font-bold text-white px-1 py-0.2 rounded">
                                  {Math.round(rec.similarity * 100)}% Sim
                                </span>
                              </div>
                              <h4 className="text-[10px] font-bold text-slate-800 leading-snug mt-1.5 line-clamp-2 group-hover:text-purple-600 transition-colors">
                                {rec.title}
                              </h4>
                            </div>
                            <div className="flex justify-between items-center text-[8px] font-semibold text-slate-400 mt-1">
                              <span>{rec.type}</span>
                              <span className="text-amber-500 font-bold">★ {rec.score.toFixed(1)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
                  <Film className="h-12 w-12 text-slate-300 animate-pulse" />
                  <p className="text-sm font-semibold text-slate-700 mt-2">Select an Anime</p>
                  <p className="text-xs text-slate-400 mt-1">Choose a show from the catalog to load ML details</p>
                </div>
              )}
            </main>

          </div>
        )}

        {/* TAB 2: WATCH QUEUE TAB (Kanban board pipeline) */}
        {activeTab === "Watch Queue" && (
          <div className="flex-1 flex flex-col bg-[#f8fafc] overflow-y-auto p-6">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-6">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Watch Queue Tracker</h2>
                <p className="text-xs text-slate-500 font-medium">Visual pipeline mapping your watch progress stages</p>
              </div>
              <button 
                onClick={() => setActiveTab("Catalog")}
                className="flex items-center gap-1 bg-purple-50 text-purple-600 border border-purple-100 hover:bg-purple-600 hover:text-white transition-all px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add from Catalog</span>
              </button>
            </div>

            {/* Kanban columns */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-start">
              {WATCH_STAGES.map(stage => {
                const items = watchQueue.filter(item => item.stage === stage.id);
                
                return (
                  <div key={stage.id} className="rounded-xl border border-slate-200/60 bg-white p-3.5 shadow-xs flex flex-col min-h-[450px]">
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-3 shrink-0">
                      <div className="flex items-center gap-1.5">
                        <span className={`h-2 w-2 rounded-full ${stage.dot}`} />
                        <span className="text-xs font-bold text-slate-800 uppercase tracking-tight">{stage.label}</span>
                      </div>
                      <span className="text-[10px] font-bold bg-slate-100 px-1.5 py-0.2 rounded text-slate-500">{items.length}</span>
                    </div>

                    {/* Items List */}
                    <div className="flex-1 space-y-2.5 overflow-y-auto max-h-[500px] p-0.5">
                      {items.length > 0 ? items.map(item => (
                        <div 
                          key={item.anime_id}
                          className="bg-slate-50/50 rounded-xl border border-slate-100 p-3 hover:border-purple-200 transition-all hover:bg-white group cursor-pointer relative"
                          onClick={() => {
                            setSelectedAnimeId(item.anime_id);
                            setActiveTab("Catalog");
                          }}
                        >
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveFromQueue(item.anime_id);
                            }}
                            className="absolute top-2 right-2 text-slate-300 hover:text-rose-500 rounded p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Remove"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>

                          <div className="flex items-start gap-2.5">
                            <div className="h-10 w-7 overflow-hidden rounded bg-slate-200 shrink-0 shadow-inner">
                              <img src={item.image_url} alt={item.title} className="h-full w-full object-cover" />
                            </div>
                            <div className="min-w-0">
                              <h4 className="text-[10.5px] font-bold text-slate-900 leading-tight truncate group-hover:text-purple-600">
                                {item.title}
                              </h4>
                              <span className="text-[9px] bg-slate-100 px-1 py-0.2 rounded text-slate-500 font-semibold block w-fit mt-1">
                                {item.type}
                              </span>
                            </div>
                          </div>

                          <div className="mt-3 pt-2.5 border-t border-slate-100/60 flex items-center justify-between text-[9px] text-slate-400">
                            <span className="flex items-center gap-1 font-semibold">
                              <Clock className="h-3 w-3" />
                              {item.dateAdded}
                            </span>
                            
                            {/* Action dropdown helper inside card */}
                            <select
                              value={item.stage}
                              onClick={(e) => e.stopPropagation()}
                              onChange={(e) => {
                                handleAddToQueue({ anime_id: item.anime_id, title: item.title, type: item.type, image_url: item.image_url }, e.target.value);
                              }}
                              className="bg-transparent border-0 font-bold text-purple-600 hover:text-purple-800 outline-none cursor-pointer text-[9px] py-0 pr-4"
                            >
                              {WATCH_STAGES.map(s => (
                                <option key={s.id} value={s.id}>{s.label.split(" ")[0]}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      )) : (
                        <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed border-slate-100 rounded-xl">
                          <Bookmark className="h-6 w-6 text-slate-200" />
                          <span className="text-[10px] text-slate-400 mt-1 font-medium">Empty Stage</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 3: AI SHARE WORKSPACE TAB */}
        {activeTab === "AI Share Workspace" && (
          <div className="flex-1 flex flex-col bg-[#f8fafc] overflow-y-auto p-6">
            <div className="border-b border-slate-200 pb-4 mb-6">
              <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">AI Genie Share Workspace</h2>
              <p className="text-xs text-slate-500 font-medium">Draft personalized watch recommendations and custom summaries using AI styles</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
              {/* Left Form controls */}
              <div className="md:col-span-1 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 border-b border-slate-50 pb-2">Outreach Setup</h3>
                
                {/* Selected Anime Info */}
                <div>
                  <label className="block text-[10px] font-extrabold uppercase text-slate-400 mb-1">Target Anime</label>
                  {shareAnime ? (
                    <div className="flex items-center gap-2.5 p-2 bg-slate-50 rounded-xl border border-slate-100">
                      <div className="h-9 w-6 overflow-hidden rounded bg-slate-200 shrink-0">
                        <img src={shareAnime.image_url} alt={shareAnime.title} className="h-full w-full object-cover" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[11px] font-bold text-slate-900 truncate leading-snug">{shareAnime.title}</p>
                        <p className="text-[9px] text-slate-400 font-semibold mt-0.5">Rating: ★ {shareAnime.score.toFixed(1)} • {shareAnime.type}</p>
                      </div>
                      <button 
                        onClick={() => setShareAnime(null)}
                        className="ml-auto text-slate-400 hover:text-slate-600 rounded"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setActiveTab("Catalog")}
                      className="w-full flex items-center justify-center gap-1.5 rounded-xl border border-dashed border-slate-200 p-4 text-xs font-semibold text-slate-500 hover:bg-slate-50"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Select Anime from Catalog</span>
                    </button>
                  )}
                </div>

                {/* Friend Name */}
                <div>
                  <label className="block text-[10px] font-extrabold uppercase text-slate-400 mb-1">Friend Name</label>
                  <input
                    type="text"
                    value={shareFriend}
                    onChange={(e) => setShareFriend(e.target.value)}
                    placeholder="e.g. Shubh"
                    className="w-full rounded-lg border border-slate-200 p-2 text-xs font-semibold text-slate-800 focus:border-purple-500 focus:outline-none"
                  />
                </div>

                {/* Tone Select */}
                <div>
                  <label className="block text-[10px] font-extrabold uppercase text-slate-400 mb-1">AI Tone</label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {["Excited", "Analytical", "Casual", "Poetic"].map(t => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setShareTone(t)}
                        className={`rounded-md py-1.5 text-[10px] font-bold border transition-all ${
                          shareTone === t
                            ? "bg-purple-600 text-white border-purple-600 shadow-xs"
                            : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Channel Select */}
                <div>
                  <label className="block text-[10px] font-extrabold uppercase text-slate-400 mb-1">Sharing Channel</label>
                  <select
                    value={shareChannel}
                    onChange={(e) => setShareChannel(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 p-2 text-xs font-semibold text-slate-800 focus:outline-none"
                  >
                    <option value="WhatsApp">WhatsApp Message</option>
                    <option value="Discord">Discord Message Block</option>
                    <option value="Social">Social Share (Twitter/Tags)</option>
                  </select>
                </div>

                <button
                  disabled={!shareAnime || generatingPost}
                  onClick={handleGenerateShare}
                  className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-purple-600 p-2.5 text-xs font-bold text-white shadow-md shadow-purple-600/10 hover:bg-purple-700 disabled:opacity-40"
                >
                  <Sparkles className="h-4 w-4" />
                  <span>{generatingPost ? "AI is typing..." : "Generate AI Recommendation"}</span>
                </button>
              </div>

              {/* Right Output post */}
              <div className="md:col-span-2 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm flex flex-col justify-between min-h-[350px]">
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-50 pb-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">Generated Outreach Text</h3>
                    {generatedPost && (
                      <button
                        onClick={() => copyToClipboard(generatedPost)}
                        className="flex items-center gap-1 text-[10px] font-bold text-purple-600 bg-purple-50 px-2 py-0.8 rounded hover:bg-purple-100"
                      >
                        <Copy className="h-3 w-3" />
                        <span>Copy Post</span>
                      </button>
                    )}
                  </div>

                  {generatedPost ? (
                    <div className="bg-slate-50 rounded-xl border border-slate-200/80 p-4">
                      <pre className="text-xs leading-relaxed text-slate-700 font-sans whitespace-pre-wrap font-medium">
                        {generatedPost}
                      </pre>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-center text-slate-400">
                      <Cpu className="h-10 w-10 text-slate-200 animate-pulse" />
                      <p className="text-xs font-semibold mt-3">Ready to compose</p>
                      <p className="text-[10px] max-w-xs mt-1">Select an anime on the left, customize your options, and generate customized recommenders.</p>
                    </div>
                  )}
                </div>

                {generatedPost && (
                  <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-[10px] font-bold text-slate-400">
                    <span className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                      <Check className="h-3.5 w-3.5" />
                      Template Ready for Copying
                    </span>
                    <span>Format: {shareChannel}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: EDA DASHBOARD TAB */}
        {activeTab === "EDA Dashboard" && (
          <div className="flex-1 flex flex-col bg-[#f8fafc] overflow-y-auto p-6">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-6">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Exploratory Data Analysis (EDA)</h2>
                <p className="text-xs text-slate-500 font-medium">Real-time charts and summaries of the 10,000 anime dataset</p>
              </div>
              <button 
                onClick={() => {
                  setLoadingAnalytics(true);
                  fetch(`${API_BASE}/analytics`)
                    .then(res => res.json())
                    .then(data => { setAnalytics(data); setLoadingAnalytics(false); showToast("Data refreshed!"); });
                }}
                className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 shadow-sm hover:bg-slate-50"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span>Refresh Data</span>
              </button>
            </div>

            {loadingAnalytics || !analytics ? (
              <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
                <RefreshCw className="h-10 w-10 text-purple-600 animate-spin" />
                <p className="text-sm text-slate-400 mt-3 font-semibold">Running statistical analysis on all relational CSVs...</p>
              </div>
            ) : (
              <div className="space-y-6">
                
                {/* Stats Counters Grid */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  {[
                    { label: "Total Anime", value: analytics.stats.total_anime.toLocaleString(), sub: "In database", color: "border-purple-100 bg-white" },
                    { label: "Avg Rating", value: `${analytics.stats.avg_score} / 10`, sub: "Non-zero scores", color: "border-indigo-100 bg-white" },
                    { label: "Unique Genres", value: analytics.stats.total_genres.toString(), sub: "Tags categorized", color: "border-blue-100 bg-white" },
                    { label: "Total Characters", value: analytics.stats.total_characters.toLocaleString(), sub: "Indexed entities", color: "border-emerald-100 bg-white" },
                    { label: "Production Studios", value: analytics.stats.total_studios.toLocaleString(), sub: "Indexed companies", color: "border-amber-100 bg-white" }
                  ].map((stat, i) => (
                    <div key={i} className={`rounded-xl border p-4 shadow-xs flex flex-col justify-between ${stat.color}`}>
                      <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400">{stat.label}</span>
                      <span className="text-xl font-extrabold text-slate-900 my-1">{stat.value}</span>
                      <span className="text-[9px] text-slate-500 font-semibold">{stat.sub}</span>
                    </div>
                  ))}
                </div>

                {/* Charts Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Genre Distribution (Horizontal Bar Chart) */}
                  <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-4 border-b border-slate-50 pb-2">
                      Top 10 Genres (Anime Count)
                    </h3>
                    <div className="space-y-3.5">
                      {analytics.genre_distribution.slice(0, 10).map((g, i) => {
                        const maxVal = analytics.genre_distribution[0].count;
                        const pct = Math.round((g.count / maxVal) * 100);
                        
                        return (
                          <div key={g.genre} className="flex items-center gap-3">
                            <span className="w-20 text-[10px] font-bold text-slate-600 truncate text-right">{g.genre}</span>
                            <div className="flex-1 h-3 bg-slate-50 rounded border border-slate-100 overflow-hidden relative">
                              <div 
                                className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-r" 
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <span className="w-10 text-[10px] font-extrabold text-slate-700">{g.count}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Format/Type stats (Custom SVG Charts) */}
                  <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs flex flex-col justify-between">
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-4 border-b border-slate-50 pb-2">
                        Rating Performance by Format
                      </h3>
                      <div className="space-y-4">
                        {analytics.type_distribution.map(item => (
                          <div key={item.type} className="flex items-center justify-between bg-slate-50/50 p-2.5 rounded-lg border border-slate-100">
                            <div className="flex items-center gap-2">
                              {item.type === "TV" ? <Tv className="h-4 w-4 text-purple-600" /> : <Film className="h-4 w-4 text-indigo-600" />}
                              <span className="text-xs font-bold text-slate-800">{item.type} Format</span>
                            </div>
                            <div className="flex items-center gap-4">
                              <span className="text-[10px] font-semibold text-slate-400">{item.count.toLocaleString()} shows</span>
                              <div className="flex items-center gap-1 bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded text-[10.5px] font-extrabold">
                                <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                                <span>{item.avg_score.toFixed(2)}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="bg-purple-50/40 border border-purple-100 rounded-xl p-3 text-[10px] text-purple-950 mt-4 leading-relaxed font-medium">
                      💡 <b>Insight:</b> TV shows generally score higher on average due to deeper storytelling and character development, whereas OVAs represent legacy archives.
                    </div>
                  </div>

                  {/* Score vs Popularity Scatter Plot */}
                  <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2 border-b border-slate-50 pb-2">
                      Score vs Popularity Rank Correlation
                    </h3>
                    <p className="text-[9px] text-slate-400 font-semibold mb-4">Sampled top-performing titles. Bottom-left (low rank/high score) is the best.</p>
                    
                    <div className="h-56 bg-slate-50 rounded-xl border border-slate-100 p-2 relative flex items-end justify-between">
                      {/* Grid labels */}
                      <span className="absolute left-2 top-2 text-[8px] font-bold text-slate-400">Score 10.0</span>
                      <span className="absolute left-2 bottom-2 text-[8px] font-bold text-slate-400">Score 6.0</span>
                      <span className="absolute right-2 bottom-2 text-[8px] font-bold text-slate-400">Popularity #2000</span>
                      <span className="absolute left-1/2 bottom-2 -translate-x-1/2 text-[8px] font-bold text-slate-400">Popularity #1000</span>

                      {/* Render simulated scatter items */}
                      <div className="absolute inset-x-6 inset-y-6">
                        {analytics.scatter_data.map((pt, idx) => {
                          // Score maps to Y: 6.0 -> 0%, 10.0 -> 100%
                          const yPct = Math.min(95, Math.max(5, ((pt.score - 6) / 4) * 100));
                          // Popularity maps to X: #2000 -> 0%, #1 -> 100% (lower popularity rank is better, so it maps closer to 100%)
                          const xPct = Math.min(95, Math.max(5, (1 - (pt.popularity / 2000)) * 100));
                          
                          return (
                            <div 
                              key={idx}
                              className="absolute w-2 h-2 rounded-full bg-indigo-600/70 hover:bg-purple-600 hover:scale-150 transition-all cursor-pointer shadow-inner border border-white"
                              style={{ bottom: `${yPct}%`, left: `${xPct}%` }}
                              title={`${pt.title}\nScore: ${pt.score}\nPopularity: #${pt.popularity}`}
                            />
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Release Years Trend (Simulated Sparkline Area) */}
                  <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2 border-b border-slate-50 pb-2">
                      Anime Production Volume Trends (1990 - 2026)
                    </h3>
                    <p className="text-[9px] text-slate-400 font-semibold mb-4">Volume spikes denote modern anime industry growth in recent decades.</p>

                    <div className="h-56 bg-slate-50 rounded-xl border border-slate-100 p-3 flex items-end justify-between gap-1 relative">
                      <div className="absolute left-2 top-2 text-[8px] font-bold text-slate-400">Volume Peak</div>
                      <span className="absolute left-2 bottom-1 text-[8px] font-bold text-slate-400">1990</span>
                      <span className="absolute right-2 bottom-1 text-[8px] font-bold text-slate-400">2026</span>

                      {/* Spark bar visual */}
                      <div className="absolute inset-x-6 inset-y-6 flex items-end gap-0.5">
                        {analytics.year_distribution.map((yd, idx) => {
                          const maxVal = Math.max(...analytics.year_distribution.map(d => d.count));
                          const pct = Math.round((yd.count / maxVal) * 90);
                          
                          return (
                            <div 
                              key={idx}
                              className="flex-1 bg-purple-200/70 hover:bg-purple-600 rounded-t transition-all group relative"
                              style={{ height: `${pct}%` }}
                              title={`${yd.year}: ${yd.count} releases`}
                            />
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Top Rated Studios */}
                  <div className="col-span-1 md:col-span-2 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-4 border-b border-slate-50 pb-2">
                      Top 10 Studios by Anime Output and Rating
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                      {analytics.studio_performance.map((st, i) => (
                        <div key={st.studio} className="bg-slate-50/60 p-3 rounded-xl border border-slate-100 flex flex-col justify-between">
                          <div>
                            <span className="text-[10px] font-extrabold text-slate-800 block truncate">{st.studio}</span>
                            <span className="text-[9px] text-slate-400 block mt-0.5">{st.count} shows in dataset</span>
                          </div>
                          <div className="flex items-center gap-1 mt-3 text-purple-700 bg-purple-50 px-2 py-0.5 rounded w-fit border border-purple-100 text-[10px] font-extrabold">
                            <Star className="h-3 w-3 fill-purple-400 text-purple-400" />
                            <span>{st.avg_score.toFixed(2)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>

              </div>
            )}
          </div>
        )}

      </div>

    </div>
  );
}

export default App;
