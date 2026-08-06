import { Plus, Bookmark, MapPin } from 'lucide-react';
import { SALES_STAGES } from '../constants';

export default function DealPipeline({ leads, onStageChange, onTabChange, onSelectLead }) {
  return (
    <div className="flex-1 flex flex-col bg-[#f8fafc] overflow-y-auto p-4 md:p-6">
      <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-6">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Sales Pipeline Kanban</h2>
          <p className="text-xs text-slate-500 font-medium">Visual tracking of sales stages, lead progress, and tech alignment</p>
        </div>
        <button
          onClick={() => onTabChange?.("Leads Explorer")}
          className="flex items-center gap-1 bg-indigo-50 text-indigo-600 border border-indigo-100 hover:bg-indigo-600 hover:text-white transition-all px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Add New Lead</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 items-start">
        {SALES_STAGES.map(stage => {
          const items = leads.filter(l => l.stage === stage.id);
          return (
            <div key={stage.id} className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs flex flex-col min-h-[400px]">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-3 shrink-0">
                <div className="flex items-center gap-1.5">
                  <span className={`h-2.5 w-2.5 rounded-full ${stage.dot}`} />
                  <span className="text-[10px] font-extrabold text-slate-800 uppercase tracking-tight">{stage.label}</span>
                </div>
                <span className="text-[9px] font-extrabold bg-slate-100 px-1.5 py-0.5 rounded text-slate-500">{items.length}</span>
              </div>

              <div className="flex-1 space-y-2.5 overflow-y-auto max-h-[550px] p-0.5">
                {items.length > 0 ? (
                  items.map(item => (
                    <div
                      key={item.id}
                      className="bg-slate-50/50 rounded-xl border border-slate-100 p-3 hover:border-indigo-300 transition-all hover:bg-white group cursor-pointer relative"
                      onClick={() => {
                        onSelectLead?.(item.id);
                        onTabChange?.("Leads Explorer");
                      }}
                    >
                      <div className="flex items-start gap-2 justify-between">
                        <div className="min-w-0">
                          <h4 className="text-[11px] font-extrabold text-slate-900 leading-tight truncate group-hover:text-indigo-600">
                            {item.company}
                          </h4>
                          <span className="text-[9px] text-slate-400 font-semibold block truncate mt-0.5">{item.designation}</span>
                        </div>
                        <span className={`text-[8.5px] font-extrabold px-1 rounded shrink-0 ${
                          item.score >= 85 ? "bg-rose-50 text-rose-700" :
                          item.score >= 70 ? "bg-indigo-50 text-indigo-700" :
                          "bg-slate-100 text-slate-500"
                        }`}>
                          {item.score}
                        </span>
                      </div>

                      <div className="mt-3.5 pt-2.5 border-t border-slate-100/60 flex items-center justify-between text-[9px] text-slate-400">
                        <span className="flex items-center gap-1 font-semibold">
                           <MapPin className="h-3 w-3" />
                          {item.location}
                        </span>
                        <select
                          value={item.stage}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => onStageChange?.(item.id, e.target.value)}
                          className="bg-transparent border-0 font-extrabold text-indigo-600 hover:text-indigo-800 outline-none cursor-pointer text-[9px] py-0 pr-4"
                        >
                          {SALES_STAGES.map(s => (
                            <option key={s.id} value={s.id}>{s.label.split(" ")[0]}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed border-slate-100 rounded-xl">
                    <Bookmark className="h-5 w-5 text-slate-200" />
                    <span className="text-[9px] text-slate-400 mt-1 font-medium">No leads in stage</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
