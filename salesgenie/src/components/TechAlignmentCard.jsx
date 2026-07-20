import { Award } from 'lucide-react';

export default function TechAlignmentCard({ techAlignment }) {
  const { score, matched } = techAlignment || { score: 0, matched: [] };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between min-h-[180px]">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Tech Stack Alignment</span>
        <Award className="h-4.5 w-4.5 text-purple-500" />
      </div>
      <div className="my-2">
        <span className="text-2xl font-extrabold text-slate-900">{score}%</span>
        <span className="text-[9px] text-slate-400 font-bold block uppercase mt-0.5">Active Stack Matches</span>
      </div>
      <div className="space-y-1">
        <span className="text-[9px] font-bold text-slate-400 uppercase">Matched Technologies:</span>
        <div className="flex flex-wrap gap-1">
          {matched.length > 0 ? (
            matched.map(tech => (
              <span key={tech} className="bg-purple-50 text-purple-700 border border-purple-100 rounded px-1.5 py-0.2 text-[8px] font-extrabold">{tech}</span>
            ))
          ) : (
            <span className="text-[9.5px] font-bold text-rose-500 bg-rose-50 px-1.5 py-0.2 rounded border border-rose-100">0 Matching Tech Stack</span>
          )}
        </div>
      </div>
    </div>
  );
}
