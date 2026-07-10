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
  AlertCircle,
  Menu,
  ChevronLeft,
  DollarSign,
  Briefcase,
  FileText,
  MapPin
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL 
  ? `${import.meta.env.VITE_API_URL}/api` 
  : "http://127.0.0.1:8000/api";

const WATCH_STAGES = [
  { id: "plan", label: "Lead / Prospect", color: "bg-slate-100 border-slate-200 text-slate-700", dot: "bg-slate-400" },
  { id: "watching", label: "Contacted", color: "bg-indigo-50 border-indigo-200 text-indigo-700", dot: "bg-indigo-500" },
  { id: "hold", label: "Proposal Sent", color: "bg-blue-50 border-blue-200 text-blue-700", dot: "bg-blue-500" },
  { id: "completed", label: "Negotiation", color: "bg-amber-50 border-amber-200 text-amber-700", dot: "bg-amber-500" },
  { id: "dropped", label: "Closed Won", color: "bg-emerald-50 border-emerald-200 text-emerald-700", dot: "bg-emerald-500" }
];

function App() {
  const [activeTab, setActiveTab] = useState("Catalog");
  const [toast, setToast] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  // On mobile Catalog: false=list view, true=detail view
  const [mobileShowDetail, setMobileShowDetail] = useState(false);
  
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
  const [selectedAnimeId, setSelectedAnimeId] = useState(1); // First transaction as default
  const [animeDetail, setAnimeDetail] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Watch Queue State (analogous to Sales pipeline)
  const [watchQueue, setWatchQueue] = useState(() => {
    const saved = localStorage.getItem("applesalesgennie_pipeline");
    return saved ? JSON.parse(saved) : [
      { anime_id: 1, title: "Mint Chip Choco (Beverly Ward)", type: "UK", image_url: "https://images.unsplash.com/photo-1548907040-4d42b52145ca?w=200", stage: "watching", dateAdded: "2h ago" },
      { anime_id: 2, title: "85% Dark Bars (Emily Watson)", type: "USA", image_url: "https://images.unsplash.com/photo-1548907040-4d42b52145ca?w=200", stage: "plan", dateAdded: "1d ago" },
      { anime_id: 3, title: "Peanut Butter Cubes (John Doe)", type: "Canada", image_url: "https://images.unsplash.com/photo-1548907040-4d42b52145ca?w=200", stage: "dropped", dateAdded: "3d ago" }
    ];
  });

  // User Preferences (Target Chocolate Products for focus matchmaking)
  const [userFavGenres, setUserFavGenres] = useState(["Mint Chip Choco", "85% Dark Bars", "Peanut Butter Cubes", "Eclairs"]);
  
  // AI Share Workspace State (repurposed for AI Pitch Workspace)
  const [shareAnime, setShareAnime] = useState(null);
  const [shareFriend, setShareFriend] = useState("");
  const [shareChannel, setShareChannel] = useState("WhatsApp"); // WhatsApp, Email, LinkedIn, Slack
  const [shareTone, setShareTone] = useState("Excited"); // Excited (Persuasive), Analytical (Professional), Casual (Friendly), Poetic (Friendly)
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
    localStorage.setItem("applesalesgennie_pipeline", JSON.stringify(watchQueue));
  }, [watchQueue]);

  // Fetch unique products on startup
  useEffect(() => {
    fetch(`${API_BASE}/genres`)
      .then(res => res.json())
      .then(data => setGenres(data))
      .catch(err => console.error("Error fetching products:", err));
  }, []);

  // Fetch Sales list when filters change
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
        // Set first loaded item as selected if none is set
        if (data.results.length > 0 && !selectedAnimeId) {
          setSelectedAnimeId(data.results[0].anime_id);
        }
      })
      .catch(err => {
        console.error("Error fetching transactions:", err);
        setLoadingList(false);
      });
  }, [page, searchQuery, selectedGenre, selectedType, sortBy, sortOrder]);

  // Fetch Transaction Detail & Recommendations
  useEffect(() => {
    if (!selectedAnimeId) return;
    setLoadingDetail(true);
    
    // Fetch detail
    fetch(`${API_BASE}/anime/${selectedAnimeId}`)
      .then(res => {
        if (!res.ok) throw new Error("Transaction not found");
        return res.json();
      })
      .then(data => {
        setAnimeDetail(data);
        setShareAnime(data);
        setLoadingDetail(false);
      })
      .catch(err => {
        console.error("Error fetching details:", err);
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
      fetch(`${API_BASE}/analytics-compat`)
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

  // Calculate Match Score dynamically (Deal Quality Match Score)
  const genieMatchScore = useMemo(() => {
    if (!animeDetail) return 0;
    // Base score from original score weight (e.g. 50%) + Genre alignment weight (e.g. 50%)
    const scoreWeight = animeDetail.score * 5; // Convert 0-10 score to 0-50 weight
    
    const matchingGenres = animeDetail.genres.filter(g => userFavGenres.includes(g));
    const genreWeight = Math.min(50, matchingGenres.length * 15);
    
    return Math.min(100, Math.round(scoreWeight + genreWeight));
  }, [animeDetail, userFavGenres]);

  const getScoreCategory = (score) => {
    if (score >= 85) return { label: "Premium Value Deal", color: "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100", dot: "bg-emerald-500" };
    if (score >= 65) return { label: "High Performance", color: "bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100", dot: "bg-indigo-500" };
    if (score >= 45) return { label: "Optimal Volume", color: "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100", dot: "bg-blue-500" };
    return { label: "Low Margin Deal", color: "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100", dot: "bg-slate-400" };
  };

  // Manage Deal pipeline stages
  const handleAddToQueue = (anime, stageId) => {
    setWatchQueue(prev => {
      const filtered = prev.filter(item => item.anime_id !== anime.anime_id);
      const newEntry = {
        anime_id: anime.anime_id,
        title: anime.title,
        type: anime.type, // country
        image_url: anime.image_url,
        stage: stageId,
        dateAdded: "Just now"
      };
      return [newEntry, ...filtered];
    });
    showToast(`Added to pipeline stage: ${WATCH_STAGES.find(s => s.id === stageId).label}!`);
  };

  const handleRemoveFromQueue = (animeId) => {
    setWatchQueue(prev => prev.filter(item => item.anime_id !== animeId));
    showToast("Removed from pipeline.");
  };

  // Generate AI Pitch
  const handleGenerateShare = () => {
    if (!shareAnime) return;
    setGeneratingPost(true);

    fetch(`${API_BASE}/generate-recommendation`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        anime_title: shareAnime.genres[0] || "Chocolate Product",
        anime_score: shareAnime.score,
        synopsis: shareAnime.synopsis,
        target_friend: shareFriend || "Valued Client",
        channel: shareChannel,
        tone: shareTone
      })
    })
      .then(res => res.json())
      .then(data => {
        setGeneratedPost(data.message);
        setGeneratingPost(false);
        showToast("AI Pitch Generated!");
      })
      .catch(err => {
        console.error("Error generating pitch:", err);
        setGeneratingPost(false);
      });
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    showToast("Pitch copied to clipboard!");
  };

  const handleTabChange = (name) => {
    setActiveTab(name);
    setSidebarOpen(false);
    setMobileShowDetail(false);
  };

  const handleSelectAnime = (id) => {
    setSelectedAnimeId(id);
    setMobileShowDetail(true);
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

      {/* Mobile overlay backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* COLUMN 1: LEFT NAVIGATION SIDEBAR */}
      <aside className={`fixed lg:relative z-40 flex flex-col justify-between border-r border-slate-800 bg-[#0f172a] text-slate-300 transition-transform duration-300 h-full ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      } w-64 shrink-0`}>
        <div>
          {/* Logo Brand area */}
          <div className="flex h-16 items-center gap-2.5 px-6 border-b border-slate-800/80">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-purple-500 via-indigo-600 to-violet-500 text-white shadow-lg shadow-purple-500/20">
              <Sparkles className="h-4.5 w-4.5" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-white leading-none">AppleSalesGennie</h1>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-purple-400">AI Intelligence Hub</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="mt-6 space-y-1.5 px-3">
            {[
              { name: "Catalog", label: "Sales Explorer", icon: Search },
              { name: "Watch Queue", label: "Deal Pipeline", icon: Layers },
              { name: "AI Share Workspace", label: "AI Pitch Generator", icon: Send },
              { name: "EDA Dashboard", label: "Analytics Dashboard", icon: LayoutDashboard }
            ].map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.name;
              return (
                <button
                  key={item.name}
                  onClick={() => handleTabChange(item.name)}
                  className={`flex w-full items-center gap-3.5 rounded-lg px-4 py-3 text-sm font-medium transition-all duration-200 group relative ${
                    isActive
                      ? "bg-purple-600 text-white shadow-md shadow-purple-600/10"
                      : "hover:bg-slate-800/60 hover:text-white"
                  }`}
                >
                  <Icon className={`h-5 w-5 transition-transform duration-200 group-hover:scale-105 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`} />
                  <span>{item.label}</span>
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
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wide">Focus Chocolate Categories</span>
            <div className="flex flex-wrap gap-1 mt-1">
              {userFavGenres.map(g => (
                <span key={g} className="text-[9px] bg-purple-950/60 text-purple-300 px-1.5 py-0.5 rounded border border-purple-800/40">{g}</span>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-lg p-2 mt-3 hover:bg-slate-800/40">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-500/10 text-purple-400 font-semibold text-sm">
              AS
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate">Sales Specialist</p>
              <p className="text-[10px] text-slate-500 truncate">AI Analytics Engine</p>
            </div>
            <Settings className="h-4.5 w-4.5 text-slate-500 hover:text-slate-300 cursor-pointer" />
          </div>
        </div>
      </aside>

      {/* MAIN LAYOUT: CHOSEN TAB VIEW */}
      <div className="flex flex-1 flex-col overflow-hidden">

        {/* Mobile Top Bar */}
        <header className="flex lg:hidden items-center justify-between bg-[#0f172a] px-4 py-3 shrink-0">
          <button onClick={() => setSidebarOpen(true)} className="text-white p-1">
            <Menu className="h-6 w-6" />
          </button>
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-tr from-purple-500 to-violet-500">
              <Sparkles className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="text-sm font-bold text-white">AppleSalesGennie</span>
          </div>
          <div className="w-8" />
        </header>

        <div className="flex flex-1 overflow-hidden">

        {/* TAB 1: CATALOG TAB (SALES EXPLORER) */}
        {activeTab === "Catalog" && (
          <div className="flex flex-1 overflow-hidden">
            
            {/* COLUMN 2: DEALS LIST (MIDDLE PANEL) */}
            <section className={`flex flex-col border-r border-slate-200 bg-white ${mobileShowDetail ? 'hidden md:flex' : 'flex'} w-full md:w-80 lg:w-96 shrink-0`}>
              {/* Header Area */}
              <div className="p-4 border-b border-slate-100 flex flex-col gap-3 shrink-0">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 leading-tight">Sales Explorer</h2>
                    <p className="text-xs text-slate-500 font-medium">Browse transactions & ML recommendation matching</p>
                  </div>
                  <span className="text-xs font-bold bg-purple-50 text-purple-600 px-2 py-0.5 rounded border border-purple-100">
                    {totalRecords.toLocaleString()} Deals
                  </span>
                </div>

                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
                    placeholder="Search salesperson or product..."
                    className="w-full rounded-lg border border-slate-200 bg-slate-50/50 py-2 pl-9 pr-4 text-xs font-medium text-slate-700 placeholder-slate-400 outline-none transition-all focus:border-purple-500 focus:bg-white focus:ring-1 focus:ring-purple-500"
                  />
                </div>

                {/* Filters */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Product</label>
                    <select
                      value={selectedGenre}
                      onChange={(e) => { setSelectedGenre(e.target.value); setPage(1); }}
                      className="w-full rounded-lg border border-slate-200 bg-slate-50/80 p-1.5 text-xs font-medium text-slate-700 focus:outline-none"
                    >
                      <option value="">All Products</option>
                      {genres.map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Country</label>
                    <select
                      value={selectedType}
                      onChange={(e) => { setSelectedType(e.target.value); setPage(1); }}
                      className="w-full rounded-lg border border-slate-200 bg-slate-50/80 p-1.5 text-xs font-medium text-slate-700 focus:outline-none"
                    >
                      <option value="All">All Markets</option>
                      <option value="UK">United Kingdom</option>
                      <option value="USA">United States</option>
                      <option value="Canada">Canada</option>
                      <option value="India">India</option>
                      <option value="Australia">Australia</option>
                      <option value="New Zealand">New Zealand</option>
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
                      Sort: {sortBy === "rank" ? "Date" : sortBy === "score" ? "Revenue" : "Date"}
                    </button>
                    <button 
                      onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                      className="px-2 py-0.5 bg-slate-50 rounded border border-slate-200"
                    >
                      {sortOrder.toUpperCase()}
                    </button>
                  </div>
                  
                  <span>Pg {page} of {totalPages}</span>
                </div>
              </div>

              {/* Transaction List Content */}
              <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-2 space-y-1.5 bg-slate-50/40">
                {loadingList ? (
                  <div className="flex flex-col items-center justify-center p-12 text-center">
                    <RefreshCw className="h-8 w-8 text-purple-600 animate-spin" />
                    <p className="text-xs text-slate-400 mt-2 font-medium">Querying transactions...</p>
                  </div>
                ) : animeList.length > 0 ? (
                  animeList.map((a) => {
                    const isActive = a.anime_id === selectedAnimeId;
                    
                    return (
                      <div
                        key={a.anime_id}
                        onClick={() => handleSelectAnime(a.anime_id)}
                        className={`flex gap-3 rounded-xl border p-3 transition-all duration-200 cursor-pointer group ${
                          isActive
                            ? "bg-purple-50/40 border-purple-200 shadow-xs"
                            : "bg-white border-slate-100 hover:border-slate-200"
                        }`}
                      >
                        {/* Box Shipped Icon Graphic */}
                        <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-purple-100 flex flex-col items-center justify-center text-purple-700 shadow-inner">
                          <Briefcase className="h-5 w-5" />
                        </div>

                        {/* Info */}
                        <div className="min-w-0 flex-1 flex flex-col justify-between">
                          <div>
                            <h4 className="font-bold text-[11px] leading-tight text-slate-900 group-hover:text-purple-600 transition-colors truncate">
                              {a.title}
                            </h4>
                            <p className="text-[10px] text-slate-500 truncate mt-0.5">
                              {a.type} • {a.episodes} boxes
                            </p>
                          </div>

                          <div className="flex justify-between items-center mt-1">
                            <span className="text-[10px] font-bold text-slate-700">
                              ${(a.score * 2000.0).toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}
                            </span>
                            <span className="text-[8px] bg-slate-100 text-slate-500 px-1 py-0.2 rounded font-medium">
                              {a.genres[0]}
                            </span>
                          </div>
                        </div>

                        {/* Rank indicator badge */}
                        <div className="flex flex-col items-end justify-center shrink-0">
                          <span className="text-[9px] font-bold text-purple-600 bg-purple-50 border border-purple-100/50 px-1.5 py-0.5 rounded">
                            ID {a.anime_id}
                          </span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="flex flex-col items-center justify-center p-8 text-center bg-white border border-slate-100 rounded-xl m-2">
                    <AlertCircle className="h-8 w-8 text-slate-300" />
                    <p className="text-sm font-semibold text-slate-700 mt-2">No transactions found</p>
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

            {/* COLUMN 3: DETAILED TRANSACTION VIEW */}
            <main className={`flex-1 bg-[#f8fafc] overflow-y-auto flex flex-col ${!mobileShowDetail ? 'hidden md:flex' : 'flex'}`}>
              {loadingDetail ? (
                <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
                  <RefreshCw className="h-10 w-10 text-purple-600 animate-spin" />
                  <p className="text-sm text-slate-400 mt-3 font-semibold">Running ML content analysis...</p>
                </div>
              ) : animeDetail ? (
                <>
                  {/* Sticky Detail Header */}
                  <div className="sticky top-0 z-10 flex items-center justify-between bg-white/80 border-b border-slate-200/60 p-3 md:p-5 backdrop-blur-md">
                    <div className="flex items-center gap-2 md:gap-4">
                      {/* Back button: mobile only */}
                      <button
                        onClick={() => setMobileShowDetail(false)}
                        className="flex md:hidden items-center justify-center h-8 w-8 rounded-lg bg-slate-100 text-slate-600 shrink-0"
                      >
                        <ChevronLeft className="h-5 w-5" />
                      </button>
                      <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-purple-100 flex flex-col items-center justify-center text-purple-700 shadow-inner">
                        <Briefcase className="h-6 w-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h2 className="text-base font-extrabold text-slate-900 tracking-tight leading-tight">
                            {animeDetail.title.split('(')[0]}
                          </h2>
                          <span className="rounded-full bg-purple-50 px-2 py-0.5 text-[9px] font-bold text-purple-600 border border-purple-100">
                            {animeDetail.type}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 font-semibold mt-0.5">
                          Shipment Date: {animeDetail.start_date || "?"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 md:gap-2">
                      {/* Pipeline Stage Selector */}
                      <select
                        onChange={(e) => {
                          if (e.target.value) {
                            handleAddToQueue(animeDetail, e.target.value);
                            e.target.value = "";
                          }
                        }}
                        className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 md:px-3 md:py-2 text-xs font-bold text-slate-700 shadow-sm hover:bg-slate-50 focus:outline-none max-w-[130px] md:max-w-none"
                      >
                        <option value="">+ Add to Deal Pipeline</option>
                        {WATCH_STAGES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                      </select>

                      <button
                        onClick={() => {
                          setShareAnime(animeDetail);
                          handleTabChange("AI Share Workspace");
                        }}
                        className="flex items-center gap-1.5 rounded-lg bg-purple-600 px-2.5 py-1.5 md:px-3.5 md:py-2 text-xs font-bold text-white shadow-md shadow-purple-600/10 hover:bg-purple-700 focus:outline-none"
                      >
                        <Share2 className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Generate AI Pitch</span>
                        <span className="sm:hidden">Pitch</span>
                      </button>
                    </div>
                  </div>

                  {/* Main Detail Body Content */}
                  <div className="p-3 md:p-5 space-y-4 md:space-y-5">
                    
                    {/* Gauge and Key Stats */}
                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                      
                      {/* Deal Health score card */}
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
                          <span className="text-[10px] font-bold text-purple-600 uppercase tracking-wider block">AI Deal Quality</span>
                          <span className="text-[11px] font-bold text-slate-800 block mt-0.5 leading-snug">
                            {getScoreCategory(genieMatchScore).label}
                          </span>
                          <span className="text-[9px] text-slate-400 font-semibold mt-1 block">
                            Calculated dynamically based on revenue & product focus alignment
                          </span>
                        </div>
                      </div>

                      {/* Stats Column cards */}
                      <div className="col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-2 md:gap-3">
                        {[
                          { label: "Deal Revenue", value: `$${(animeDetail.score * 2000.0).toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}`, sub: "Gross Amount", color: "text-amber-500 bg-amber-50 border-amber-100" },
                          { label: "Boxes Shipped", value: animeDetail.episodes.toLocaleString(), sub: "Quantity Vol", color: "text-purple-600 bg-purple-50 border-purple-100" },
                          { label: "Destination Market", value: animeDetail.type, sub: "Retail Location", color: "text-indigo-600 bg-indigo-50 border-indigo-100" },
                          { label: "Pricing Metrics", value: animeDetail.licensors[0]?.name.split(': ')[1] || "N/A", sub: "Unit Value / Box", color: "text-emerald-600 bg-emerald-50 border-emerald-100" }
                        ].map((stat, i) => (
                          <div key={i} className={`rounded-xl border p-3 flex flex-col justify-between ${stat.color} shadow-xs`}>
                            <span className="text-[8px] font-extrabold uppercase tracking-wide opacity-80">{stat.label}</span>
                            <span className="text-[11px] font-extrabold leading-none my-1 truncate">{stat.value}</span>
                            <span className="text-[8px] opacity-70 font-semibold">{stat.sub}</span>
                          </div>
                        ))}
                      </div>

                    </div>

                    {/* Synopsis Description Card */}
                    <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-xs">
                      <h3 className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-2">Deal Synopsis</h3>
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

                    {/* Details Panel */}
                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                      
                      {/* Market Info */}
                      <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-xs">
                        <h3 className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-3 border-b border-slate-50 pb-1.5">Market & Representative Details</h3>
                        <div className="space-y-2">
                          <div>
                            <span className="text-[9px] font-bold text-slate-400 uppercase">Sales Representative</span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              <span className="text-xs bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-md font-bold text-slate-800">
                                {animeDetail.studios[0]?.name || "N/A"}
                              </span>
                            </div>
                          </div>
                          
                          <div className="pt-2">
                            <span className="text-[9px] font-bold text-slate-400 uppercase">Distributor Country & Metrics</span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              <span className="text-[9px] bg-slate-50 border border-slate-100 text-slate-500 px-2 py-0.5 rounded font-medium">
                                Destination: {animeDetail.producers[0]?.name} ({animeDetail.producers[0]?.role})
                              </span>
                              <span className="text-[9px] bg-slate-50 border border-slate-100 text-slate-500 px-2 py-0.5 rounded font-medium">
                                pricing: {animeDetail.licensors[0]?.name}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Rep Performance Card */}
                      <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-xs">
                        <h3 className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-3 border-b border-slate-50 pb-1.5">Sales Agent Analytics</h3>
                        <div className="space-y-3">
                          {animeDetail.characters.map(c => (
                            <div key={c.character_id} className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-3">
                              <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 shrink-0">
                                <Users className="h-4.5 w-4.5" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-bold text-slate-900 truncate">{c.name}</span>
                                  <span className="text-[9px] font-extrabold text-purple-600 bg-purple-50 px-1.5 py-0.2 rounded border border-purple-100">
                                    {c.role}
                                  </span>
                                </div>
                                <div className="flex gap-2 mt-1 text-[9px] text-slate-500">
                                  <span>Total Sales: {animeDetail.staff[0]?.name}</span>
                                  <span>•</span>
                                  <span>Deals: {c.voice_actors[0]?.name.split(': ')[1]}</span>
                                  <span>•</span>
                                  <span>Avg Vol: {c.voice_actors[0]?.language.split(': ')[1]}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                    </div>

                    {/* Machine Learning Recommendations Carousel */}
                    <div>
                      <div className="flex items-center justify-between mb-3 border-b border-slate-200 pb-1.5">
                        <div className="flex items-center gap-1.5">
                          <Cpu className="h-4.5 w-4.5 text-purple-600" />
                          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">ML-Similar deals intelligence</h3>
                        </div>
                        <span className="text-[9px] bg-indigo-50 border border-indigo-100 text-indigo-600 px-2 py-0.5 rounded font-bold uppercase">
                          TF-IDF Similarity Matrix
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
                              <div className="aspect-[4/3] rounded bg-purple-50 flex flex-col items-center justify-center text-purple-700 shadow-inner relative overflow-hidden">
                                <Briefcase className="h-6 w-6 transition-transform group-hover:scale-105" />
                                <span className="absolute bottom-1 right-1 bg-slate-900/80 text-[8px] font-bold text-white px-1 py-0.2 rounded">
                                  {Math.round(rec.similarity * 100)}% Match
                                </span>
                              </div>
                              <h4 className="text-[10px] font-bold text-slate-800 leading-snug mt-1.5 line-clamp-2 group-hover:text-purple-600 transition-colors">
                                {rec.title.split(' (')[0]}
                              </h4>
                              <p className="text-[8px] text-slate-400 mt-0.5 truncate">
                                Rep: {rec.title.split(' (')[1]?.replace(')', '') || "Sales Rep"}
                              </p>
                            </div>
                            <div className="flex justify-between items-center text-[8px] font-semibold text-slate-400 mt-2 pt-1.5 border-t border-slate-50">
                              <span>{rec.type}</span>
                              <span className="text-slate-900 font-extrabold">${(rec.score * 2000.0).toLocaleString(undefined, {maximumFractionDigits:0})}</span>
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
                  <p className="text-sm font-semibold text-slate-700 mt-2">Select a transaction</p>
                  <p className="text-xs text-slate-400 mt-1">Choose a record from the catalog to load ML metrics</p>
                </div>
              )}
            </main>

          </div>
        )}

        {/* TAB 2: WATCH QUEUE TAB (DEAL PIPELINE) */}
        {activeTab === "Watch Queue" && (
          <div className="flex-1 flex flex-col bg-[#f8fafc] overflow-y-auto p-3 md:p-6">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-6">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Deal Pipeline Tracker</h2>
                <p className="text-xs text-slate-500 font-medium">Visual Kanban mapping your sales transaction stages</p>
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 md:gap-4 items-start">
              {WATCH_STAGES.map(stage => {
                const items = watchQueue.filter(item => item.stage === stage.id);
                
                return (
                  <div key={stage.id} className="rounded-xl border border-slate-200/60 bg-white p-3.5 shadow-xs flex flex-col min-h-[200px] md:min-h-[400px]">
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
                            <div className="h-8 w-8 rounded-lg bg-purple-100 flex items-center justify-center text-purple-700 shrink-0 shadow-inner">
                              <Briefcase className="h-4.5 w-4.5" />
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

        {/* TAB 3: AI SHARE WORKSPACE TAB (AI PITCH GENERATOR) */}
        {activeTab === "AI Share Workspace" && (
          <div className="flex-1 flex flex-col bg-[#f8fafc] overflow-y-auto p-3 md:p-6">
            <div className="border-b border-slate-200 pb-4 mb-6">
              <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">AI Pitch Generator Workspace</h2>
              <p className="text-xs text-slate-500 font-medium">Draft customized client follow-up and sales pitch messages powered by AI styles</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
              {/* Left Form controls */}
              <div className="md:col-span-1 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 border-b border-slate-50 pb-2">Pitch Setup</h3>
                
                {/* Selected Deal Info */}
                <div>
                  <label className="block text-[10px] font-extrabold uppercase text-slate-400 mb-1">Target Deal</label>
                  {shareAnime ? (
                    <div className="flex items-center gap-2.5 p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                      <div className="h-8 w-8 rounded bg-purple-100 flex items-center justify-center text-purple-700 shrink-0">
                        <Briefcase className="h-4.5 w-4.5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[11px] font-bold text-slate-900 truncate leading-snug">{shareAnime.title.split('(')[0]}</p>
                        <p className="text-[9px] text-slate-400 font-semibold mt-0.5">Value: ${(shareAnime.score * 2000.0).toLocaleString()} • {shareAnime.type}</p>
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
                      <span>Select Deal from Catalog</span>
                    </button>
                  )}
                </div>

                {/* Client Name */}
                <div>
                  <label className="block text-[10px] font-extrabold uppercase text-slate-400 mb-1">Client Contact Name</label>
                  <input
                    type="text"
                    value={shareFriend}
                    onChange={(e) => setShareFriend(e.target.value)}
                    placeholder="e.g. Johnathan Miller"
                    className="w-full rounded-lg border border-slate-200 p-2 text-xs font-semibold text-slate-800 focus:border-purple-500 focus:outline-none"
                  />
                </div>

                {/* Tone Select */}
                <div>
                  <label className="block text-[10px] font-extrabold uppercase text-slate-400 mb-1">AI Tone</label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {[
                      { val: "Excited", label: "Persuasive" },
                      { val: "Analytical", label: "Professional" },
                      { val: "Casual", label: "Friendly" },
                      { val: "Poetic", label: "Urgent" }
                    ].map(t => (
                      <button
                        key={t.val}
                        type="button"
                        onClick={() => setShareTone(t.val)}
                        className={`rounded-md py-1.5 text-[10px] font-bold border transition-all ${
                          shareTone === t.val
                            ? "bg-purple-600 text-white border-purple-600 shadow-xs"
                            : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Channel Select */}
                <div>
                  <label className="block text-[10px] font-extrabold uppercase text-slate-400 mb-1">Outreach Channel</label>
                  <select
                    value={shareChannel}
                    onChange={(e) => setShareChannel(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 p-2 text-xs font-semibold text-slate-800 focus:outline-none"
                  >
                    <option value="WhatsApp">WhatsApp Message</option>
                    <option value="Discord">Email Template</option>
                    <option value="Social">LinkedIn Message</option>
                  </select>
                </div>

                <button
                  disabled={!shareAnime || generatingPost}
                  onClick={handleGenerateShare}
                  className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-purple-600 p-2.5 text-xs font-bold text-white shadow-md shadow-purple-600/10 hover:bg-purple-700 disabled:opacity-40"
                >
                  <Sparkles className="h-4 w-4" />
                  <span>{generatingPost ? "Generating Pitch..." : "Generate AI Pitch"}</span>
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
                        <span>Copy Pitch</span>
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
                      <p className="text-[10px] max-w-xs mt-1">Select a transaction on the left, customize outreach parameters, and click generate to launch AI sales writing assistant.</p>
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

        {/* TAB 4: EDA DASHBOARD TAB (ANALYTICS) */}
        {activeTab === "EDA Dashboard" && (
          <div className="flex-1 flex flex-col bg-[#f8fafc] overflow-y-auto p-3 md:p-6">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-6">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">AppleSalesGennie Analytics Dashboard</h2>
                <p className="text-xs text-slate-500 font-medium">Real-time summaries and charts of the chocolate sales dataset</p>
              </div>
              <button 
                onClick={() => {
                  setLoadingAnalytics(true);
                  fetch(`${API_BASE}/analytics-compat`)
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
                <p className="text-sm text-slate-400 mt-3 font-semibold">Running statistical analysis on sales database...</p>
              </div>
            ) : (
              <div className="space-y-6">
                
                {/* Stats Counters Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 md:gap-4">
                  {[
                    { label: "Total Transactions", value: analytics.stats.total_anime.toLocaleString(), sub: "Total deals logged", color: "border-purple-100 bg-white" },
                    { label: "Avg Deal Size", value: `$${(analytics.stats.avg_score * 2000.0).toLocaleString(undefined, {maximumFractionDigits:0})}`, sub: "Average transaction", color: "border-indigo-100 bg-white" },
                    { label: "Unique Products", value: analytics.stats.total_genres.toString(), sub: "Chocolates tracked", color: "border-blue-100 bg-white" },
                    { label: "Sales Representatives", value: analytics.stats.total_characters.toString(), sub: "Active agents", color: "border-emerald-100 bg-white" },
                    { label: "Markets Tracked", value: analytics.stats.total_studios.toString(), sub: "Destination countries", color: "border-amber-100 bg-white" }
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
                  
                  {/* Product Revenue (Horizontal Bar Chart) */}
                  <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-4 border-b border-slate-50 pb-2">
                      Top Products (Revenue Share)
                    </h3>
                    <div className="space-y-3.5">
                      {analytics.genre_distribution.slice(0, 10).map((g, i) => {
                        const maxVal = analytics.genre_distribution[0].count;
                        const pct = Math.round((g.count / maxVal) * 100);
                        
                        return (
                          <div key={g.genre} className="flex items-center gap-3">
                            <span className="w-24 text-[10px] font-bold text-slate-600 truncate text-right">{g.genre}</span>
                            <div className="flex-1 h-3 bg-slate-50 rounded border border-slate-100 overflow-hidden relative">
                              <div 
                                className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-r" 
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <span className="w-16 text-[10px] font-extrabold text-slate-700">${(g.count * 1000).toLocaleString()}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Market/Country stats */}
                  <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs flex flex-col justify-between">
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-4 border-b border-slate-50 pb-2">
                        Market Performance by Country
                      </h3>
                      <div className="space-y-4">
                        {analytics.type_distribution.map(item => (
                          <div key={item.type} className="flex items-center justify-between bg-slate-50/50 p-2.5 rounded-lg border border-slate-100">
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4 text-purple-600" />
                              <span className="text-xs font-bold text-slate-800">{item.type}</span>
                            </div>
                            <div className="flex items-center gap-4">
                              <span className="text-[10px] font-semibold text-slate-400">{item.count.toLocaleString()} deals</span>
                              <div className="flex items-center gap-1 bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded text-[10.5px] font-extrabold">
                                <span>Avg: ${(item.avg_score * 50000.0).toLocaleString(undefined, {maximumFractionDigits:0})}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="bg-purple-50/40 border border-purple-100 rounded-xl p-3 text-[10px] text-purple-950 mt-4 leading-relaxed font-medium">
                      💡 <b>Insight:</b> UK and USA remain top export destinations by sheer order frequency, while New Zealand shows high average deal value ratios.
                    </div>
                  </div>

                  {/* Deal Revenue vs Boxes Shipped Scatter Plot */}
                  <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2 border-b border-slate-50 pb-2">
                      Revenue vs Boxes Shipped Correlation
                    </h3>
                    <p className="text-[9px] text-slate-400 font-semibold mb-4">Sampled transactions. Shows relationship between quantities shipped (X) and deal value (Y).</p>
                    
                    <div className="h-56 bg-slate-50 rounded-xl border border-slate-100 p-2 relative flex items-end justify-between">
                      {/* Grid labels */}
                      <span className="absolute left-2 top-2 text-[8px] font-bold text-slate-400">Value $20,000</span>
                      <span className="absolute left-2 bottom-2 text-[8px] font-bold text-slate-400">Value $0</span>
                      <span className="absolute right-2 bottom-2 text-[8px] font-bold text-slate-400">Quantity 150 boxes</span>
                      <span className="absolute left-1/2 bottom-2 -translate-x-1/2 text-[8px] font-bold text-slate-400">Quantity 75 boxes</span>

                      {/* Render simulated scatter items */}
                      <div className="absolute inset-x-6 inset-y-6">
                        {analytics.scatter_data.map((pt, idx) => {
                          const yPct = Math.min(95, Math.max(5, (pt.score / 10) * 100));
                          const xPct = Math.min(95, Math.max(5, (pt.members / 160) * 100));
                          
                          return (
                            <div 
                              key={idx}
                              className="absolute w-2.5 h-2.5 rounded-full bg-indigo-600/70 hover:bg-purple-600 hover:scale-150 transition-all cursor-pointer shadow-inner border border-white"
                              style={{ bottom: `${yPct}%`, left: `${xPct}%` }}
                              title={`${pt.title}\nValue: $${(pt.score * 2000.0).toLocaleString()}\nQuantity: ${pt.members} boxes`}
                            />
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Monthly Revenue Volume Trends */}
                  <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2 border-b border-slate-50 pb-2">
                      Monthly Revenue Trend (2022 timeline)
                    </h3>
                    <p className="text-[9px] text-slate-400 font-semibold mb-4">Shows periodic sales fluctuations throughout the fiscal year.</p>

                    <div className="h-56 bg-slate-50 rounded-xl border border-slate-100 p-3 flex items-end justify-between gap-1 relative">
                      <div className="absolute left-2 top-2 text-[8px] font-bold text-slate-400">Revenue Peak</div>
                      <span className="absolute left-2 bottom-1 text-[8px] font-bold text-slate-400">Jan</span>
                      <span className="absolute right-2 bottom-1 text-[8px] font-bold text-slate-400">Dec</span>

                      {/* Spark bar visual */}
                      <div className="absolute inset-x-6 inset-y-6 flex items-end gap-1.5">
                        {analytics.year_distribution.map((yd, idx) => {
                          const maxVal = Math.max(...analytics.year_distribution.map(d => d.count));
                          const pct = Math.round((yd.count / maxVal) * 90);
                          
                          return (
                            <div 
                              key={idx}
                              className="flex-1 bg-purple-200/70 hover:bg-purple-600 rounded-t transition-all group relative"
                              style={{ height: `${pct}%` }}
                              title={`Month ${yd.year}: $${(yd.count * 1000).toLocaleString()}`}
                            />
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Top Rated Salespersons */}
                  <div className="col-span-1 md:col-span-2 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-4 border-b border-slate-50 pb-2">
                      Sales Representative Performance Rankings
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                      {analytics.studio_performance.map((st, i) => (
                        <div key={st.studio} className="bg-slate-50/60 p-3 rounded-xl border border-slate-100 flex flex-col justify-between">
                          <div>
                            <span className="text-[10px] font-extrabold text-slate-800 block truncate">{st.studio}</span>
                            <span className="text-[9px] text-slate-400 block mt-0.5">{st.count} deals closed</span>
                          </div>
                          <div className="flex items-center gap-1 mt-3 text-purple-700 bg-purple-50 px-2 py-0.5 rounded w-fit border border-purple-100 text-[10px] font-extrabold">
                            <span>Revenue Match: ${(st.avg_score * 20000.0).toLocaleString(undefined, {maximumFractionDigits:0})}</span>
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

        </div>{/* end inner flex */}

        {/* Mobile Bottom Navigation Bar */}
        <nav className="flex lg:hidden shrink-0 bg-[#0f172a] border-t border-slate-800">
          {[
            { name: "Catalog", label: "Explorer", icon: Search },
            { name: "Watch Queue", label: "Pipeline", icon: Layers },
            { name: "AI Share Workspace", label: "AI Pitch", icon: Send },
            { name: "EDA Dashboard", label: "Analytics", icon: LayoutDashboard }
          ].map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.name;
            return (
              <button
                key={item.name}
                onClick={() => handleTabChange(item.name)}
                className={`flex flex-1 flex-col items-center justify-center py-2 gap-0.5 text-[9px] font-bold uppercase tracking-wide transition-colors ${
                  isActive ? 'text-purple-400' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

      </div>

    </div>
  );
}

export default App;
