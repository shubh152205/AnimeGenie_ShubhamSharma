import { MapPin } from 'lucide-react';
import { SALES_STAGES } from '../constants';

export default function LeadCard({ lead, isSelected, onClick }) {
  const stageColor = SALES_STAGES.find(s => s.id === lead.stage)?.color || "bg-slate-100 text-slate-700";

  return (
    <div
      onClick={onClick}
      className={`rounded-xl border p-3.5 transition-all cursor-pointer relative group ${
        isSelected
          ? "bg-white border-indigo-600 shadow-md ring-1 ring-indigo-600/30"
          : "bg-white border-slate-200/80 hover:border-slate-300 hover:shadow-sm"
      }`}
    >
      <div className="flex justify-between items-start">
        <div className="min-w-0">
          <h3 className="text-xs font-extrabold text-slate-900 group-hover:text-indigo-600 transition-colors truncate">
            {lead.company}
          </h3>
          <p className="text-[10px] text-slate-500 font-semibold mt-0.5 truncate">
            {lead.designation}
          </p>
        </div>
        <div className="flex flex-col items-end shrink-0">
          <span className={`text-[10.5px] font-extrabold px-1.5 py-0.5 rounded shadow-xs ${
            lead.score >= 85 ? "bg-rose-50 text-rose-700 border border-rose-100" :
            lead.score >= 70 ? "bg-indigo-50 text-indigo-700 border border-indigo-100" :
            "bg-slate-100 text-slate-600"
          }`}>
            Score: {lead.score}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-slate-100/60 text-[9px] text-slate-400">
        <span className="flex items-center gap-1 font-semibold">
          <MapPin className="h-3 w-3" />
          {lead.location}
        </span>
        <div className="flex gap-1">
          <span className="px-1.5 py-0.2 rounded font-extrabold text-[8px] bg-slate-100 text-slate-500 uppercase tracking-tight">
            {lead.industry}
          </span>
          <span className={`px-1.5 py-0.2 rounded font-extrabold text-[8px] uppercase tracking-tight ${stageColor}`}>
            {SALES_STAGES.find(s => s.id === lead.stage)?.label || lead.stage}
          </span>
        </div>
      </div>
    </div>
  );
}
