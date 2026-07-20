import { MapPin, DollarSign } from 'lucide-react';

export default function CompanyInfo({ leadDetail }) {
  if (!leadDetail) return null;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 border-b border-slate-100 pb-2">Company Profile</h3>
      <div className="grid grid-cols-2 gap-4 text-xs font-semibold text-slate-700">
        <div>
          <span className="block text-[9px] font-bold text-slate-400 uppercase mb-0.5">Location</span>
          <span className="flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5 text-indigo-500" />
            {leadDetail.location}
          </span>
        </div>
        <div>
          <span className="block text-[9px] font-bold text-slate-400 uppercase mb-0.5">Estimated Revenue</span>
          <span className="flex items-center gap-1">
            <DollarSign className="h-3.5 w-3.5 text-indigo-500" />
            {leadDetail.revenue}
          </span>
        </div>
        <div>
          <span className="block text-[9px] font-bold text-slate-400 uppercase mb-0.5">Employees</span>
          <span>📊 {leadDetail.employees}</span>
        </div>
        <div>
          <span className="block text-[9px] font-bold text-slate-400 uppercase mb-0.5">Funding Stage</span>
          <span>📈 {leadDetail.funding}</span>
        </div>
      </div>

      <div className="pt-2 border-t border-slate-100 text-xs font-semibold">
        <span className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Technology Stack</span>
        <div className="flex flex-wrap gap-1 mt-1">
          {leadDetail.technology?.split(",").map(t => (
            <span key={t} className="bg-slate-100 text-slate-700 rounded px-1.5 py-0.5 text-[9px] font-semibold">{t.trim()}</span>
          ))}
        </div>
      </div>

      <div className="pt-2 border-t border-slate-100 text-xs font-semibold">
        <span className="block text-[9px] font-bold text-slate-400 uppercase mb-0.5">Core Pain Point</span>
        <p className="text-[11px] leading-relaxed text-slate-600 font-medium">{leadDetail.pain_point || "No pain points listed."}</p>
      </div>

      <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[10px] font-bold text-slate-400">
        <span>Email Opens: {leadDetail.email_opens}</span>
        <span>Website Visits: {leadDetail.website_visits}</span>
        <span>Demo Requested: {leadDetail.demo_request ? "Yes" : "No"}</span>
      </div>
    </div>
  );
}
