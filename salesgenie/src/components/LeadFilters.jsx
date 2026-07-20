import { Search, Plus } from 'lucide-react';
import { SALES_STAGES, INDUSTRIES, SORT_OPTIONS } from '../constants';

export default function LeadFilters({
  searchQuery, setSearchQuery,
  selectedIndustry, setSelectedIndustry,
  selectedStage, setSelectedStage,
  sortBy, setSortBy,
  sortOrder, setSortOrder,
  onRegisterClick
}) {
  return (
    <div className="p-4 border-b border-slate-200 flex flex-col gap-3 shrink-0">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-extrabold text-slate-900 leading-tight">CRM Prospects</h2>
          <p className="text-xs text-slate-500 font-medium">Search companies, lead scores, and industries</p>
        </div>
        <button
          onClick={onRegisterClick}
          className="flex items-center gap-1.5 bg-indigo-600 text-white hover:bg-indigo-700 transition-all px-3 py-1.5 rounded-lg text-xs font-bold shadow-md shadow-indigo-600/10"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Add Lead</span>
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search company, contact name, location, stack..."
          className="w-full rounded-lg border border-slate-200 bg-slate-50/50 py-2 pl-9 pr-4 text-xs font-medium text-slate-700 placeholder-slate-400 outline-none transition-all focus:border-indigo-500 focus:bg-white focus:ring-1 focus:ring-indigo-500"
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Industry</label>
          <select
            value={selectedIndustry}
            onChange={(e) => setSelectedIndustry(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-slate-50/80 p-1.5 text-xs font-medium text-slate-700 focus:outline-none focus:border-indigo-500"
          >
            <option value="">All Industries</option>
            {INDUSTRIES.map(ind => <option key={ind} value={ind}>{ind}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Pipeline Stage</label>
          <select
            value={selectedStage}
            onChange={(e) => setSelectedStage(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-slate-50/80 p-1.5 text-xs font-medium text-slate-700 focus:outline-none focus:border-indigo-500"
          >
            <option value="">All Stages</option>
            {SALES_STAGES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
        </div>
      </div>

      <div className="flex gap-2 items-center justify-between border-t border-slate-100 pt-2 text-[10px] font-bold text-slate-400">
        <span>Sort By:</span>
        <div className="flex gap-1.5">
          {SORT_OPTIONS.map(opt => (
            <button
              key={opt.val}
              onClick={() => {
                if (sortBy === opt.val) {
                  setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                } else {
                  setSortBy(opt.val);
                  setSortOrder("desc");
                }
              }}
              className={`px-2 py-0.5 rounded transition-colors ${sortBy === opt.val ? "bg-indigo-50 text-indigo-700 border border-indigo-100" : "hover:text-slate-700"}`}
            >
              {opt.label} {sortBy === opt.val ? (sortOrder === "desc" ? "↓" : "↑") : ""}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
