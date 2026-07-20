import { Sparkles } from 'lucide-react';

export default function AIBanner({ nextAction }) {
  return (
    <div className="bg-gradient-to-r from-indigo-50 via-indigo-100/30 to-purple-50 rounded-2xl border border-indigo-100 p-4 shadow-sm flex items-start gap-3">
      <Sparkles className="h-5 w-5 text-indigo-600 shrink-0 mt-0.5" />
      <div>
        <span className="text-[9.5px] font-extrabold text-indigo-700 uppercase tracking-wider">AI Recommendation & Strategy</span>
        <p className="text-xs font-bold text-slate-800 mt-1 leading-relaxed">{nextAction}</p>
      </div>
    </div>
  );
}
