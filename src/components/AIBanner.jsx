import { Sparkles, Clock, Send, BookOpen } from 'lucide-react';

export default function AIBanner({ leadDetail }) {
  if (!leadDetail) return null;
  const { next_action, followup_timing, recommended_channel, content_strategy } = leadDetail;

  return (
    <div className="bg-gradient-to-r from-indigo-50/80 via-purple-50/60 to-slate-50 rounded-2xl border border-indigo-100 p-4.5 shadow-xs space-y-3">
      <div className="flex items-center gap-2 border-b border-indigo-100/60 pb-2">
        <Sparkles className="h-4.5 w-4.5 text-indigo-600 shrink-0" />
        <span className="text-[10px] font-extrabold text-indigo-800 uppercase tracking-wider">AI Sales Strategy & Execution Plan</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
        {/* Next Best Action */}
        <div className="bg-white/80 rounded-xl p-3 border border-indigo-50">
          <span className="text-[9px] font-extrabold text-slate-400 uppercase block mb-1">Recommended Action</span>
          <p className="font-extrabold text-slate-800 text-[11px] leading-snug">{next_action}</p>
        </div>

        {/* Follow-Up Timing */}
        <div className="bg-white/80 rounded-xl p-3 border border-indigo-50 flex items-start gap-2">
          <Clock className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <span className="text-[9px] font-extrabold text-slate-400 uppercase block mb-0.5">Optimal Follow-Up Timing</span>
            <span className="font-extrabold text-slate-800 text-[11px]">{followup_timing}</span>
          </div>
        </div>

        {/* Recommended Channel */}
        <div className="bg-white/80 rounded-xl p-3 border border-indigo-50 flex items-start gap-2">
          <Send className="h-4 w-4 text-indigo-500 shrink-0 mt-0.5" />
          <div>
            <span className="text-[9px] font-extrabold text-slate-400 uppercase block mb-0.5">Recommended Channel Mix</span>
            <span className="font-bold text-indigo-700 text-[11px]">{recommended_channel}</span>
          </div>
        </div>

        {/* Content Strategy */}
        <div className="bg-white/80 rounded-xl p-3 border border-indigo-50 flex items-start gap-2">
          <BookOpen className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
          <div>
            <span className="text-[9px] font-extrabold text-slate-400 uppercase block mb-0.5">Content Angle & Case Study</span>
            <span className="font-semibold text-slate-700 text-[10.5px] block">{content_strategy?.angle}</span>
            <span className="text-[9px] font-extrabold text-emerald-600 mt-1 block">📌 {content_strategy?.case_study}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

