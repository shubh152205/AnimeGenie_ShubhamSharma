// Analytics data is fetched from App.jsx when this tab is activated
import React, { useEffect } from 'react';
import { RefreshCw, TrendingUp, Users, Award, Target, Activity } from 'lucide-react';

export default function AnalyticsDashboard({ analytics, loadingAnalytics, fetchAnalytics }) {
  useEffect(() => {
    fetchAnalytics?.();
  }, [fetchAnalytics]);

  if (loadingAnalytics && !analytics) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-[#f8fafc]">
        <RefreshCw className="h-8 w-8 animate-spin text-indigo-500 mb-2" />
        <span className="text-xs font-semibold text-slate-400">Loading analytics...</span>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#f8fafc]">
        <p className="text-sm text-slate-400">No analytics data available.</p>
      </div>
    );
  }

  const { summary, stages, industries, locations, scatter_data, industry_conversion } = analytics;

  return (
    <div className="flex-1 flex flex-col bg-[#f8fafc] overflow-y-auto p-4 md:p-6">
      <div className="border-b border-slate-200 pb-4 mb-6">
        <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Sales Intelligence Analytics</h2>
        <p className="text-xs text-slate-500 font-medium">Key sales metrics, industry-specific conversion rates, and engagement patterns</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-6">
        <KPICard icon={<Users className="h-4 w-4" />} label="Total Leads" value={summary.total_leads} color="text-indigo-600" bg="bg-indigo-50" />
        <KPICard icon={<Award className="h-4 w-4" />} label="Avg Lead Score" value={summary.avg_score} color="text-purple-600" bg="bg-purple-50" suffix="" />
        <KPICard icon={<Target className="h-4 w-4" />} label="Hot Leads" value={summary.hot_leads} color="text-rose-600" bg="bg-rose-50" />
        <KPICard icon={<TrendingUp className="h-4 w-4" />} label="Closed Won" value={summary.closed_won} color="text-emerald-600" bg="bg-emerald-50" />
        <KPICard icon={<Activity className="h-4 w-4" />} label="Lead Conversion" value={summary.conversion_rate} color="text-amber-600" bg="bg-amber-50" suffix="%" />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Stage Distribution */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-4">Sales Stage Distribution</h3>
          <div className="space-y-2.5">
            {stages?.map(s => {
              const total = stages.reduce((a, b) => a + b.count, 0);
              const pct = total > 0 ? Math.round((s.count / total) * 100) : 0;
              return (
                <div key={s.stage} className="flex items-center gap-3">
                  <span className="text-[10px] font-bold text-slate-600 w-24 truncate">{s.stage}</span>
                  <div className="flex-1 h-5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-extrabold text-slate-500 w-12 text-right">{s.count}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Industry Distribution */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-4">Leads by Industry</h3>
          <div className="space-y-2.5">
            {industries?.map(ind => {
              const total = industries.reduce((a, b) => a + b.count, 0);
              const pct = total > 0 ? Math.round((ind.count / total) * 100) : 0;
              return (
                <div key={ind.industry} className="flex items-center gap-3">
                  <span className="text-[10px] font-bold text-slate-600 w-24 truncate">{ind.industry}</span>
                  <div className="flex-1 h-5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-extrabold text-slate-500 w-12 text-right">{ind.count}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Location Scores */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-4">Avg Score by Location</h3>
          <div className="space-y-2.5">
            {locations?.map(loc => (
              <div key={loc.location} className="flex items-center gap-3">
                <span className="text-[10px] font-bold text-slate-600 w-24 truncate">{loc.location}</span>
                <div className="flex-1 h-5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full"
                    style={{ width: `${Math.min(loc.avg_score, 100)}%` }}
                  />
                </div>
                <span className="text-[10px] font-extrabold text-slate-500 w-12 text-right">{Math.round(loc.avg_score)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Conversion by Industry */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-4">Conversion Rate by Industry</h3>
          <div className="space-y-2.5">
            {industry_conversion?.map(ind => (
              <div key={ind.industry} className="flex items-center gap-3">
                <span className="text-[10px] font-bold text-slate-600 w-24 truncate">{ind.industry}</span>
                <div className="flex-1 h-5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-rose-500 to-pink-500 rounded-full"
                    style={{ width: `${Math.min(ind.conversion_rate, 100)}%` }}
                  />
                </div>
                <span className="text-[10px] font-extrabold text-slate-500 w-12 text-right">{ind.conversion_rate}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Engagement Scatter */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs lg:col-span-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-4">Lead Engagement Matrix: Email Opens vs Website Visits</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-[10px]">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left font-extrabold text-slate-500 pb-2 pr-3">Company</th>
                  <th className="text-right font-extrabold text-slate-500 pb-2 pr-3">Email Opens</th>
                  <th className="text-right font-extrabold text-slate-500 pb-2 pr-3">Website Visits</th>
                  <th className="text-right font-extrabold text-slate-500 pb-2 pr-3">Score</th>
                  <th className="text-right font-extrabold text-slate-500 pb-2">Stage</th>
                </tr>
              </thead>
              <tbody>
                {scatter_data?.map(row => (
                  <tr key={row.company} className="border-b border-slate-50 hover:bg-slate-50/50">
                    <td className="py-2 pr-3 font-bold text-slate-700">{row.company}</td>
                    <td className="py-2 pr-3 text-right font-semibold text-slate-600">{row.email_opens}</td>
                    <td className="py-2 pr-3 text-right font-semibold text-slate-600">{row.website_visits}</td>
                    <td className="py-2 pr-3 text-right font-extrabold">{row.score}</td>
                    <td className="py-2 text-right">
                      <span className="text-[9px] bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded">{row.stage}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function KPICard({ icon, label, value, color, bg, suffix = "" }) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex items-center gap-3">
      <div className={`h-9 w-9 rounded-lg ${bg} ${color} flex items-center justify-center shrink-0`}>
        {icon}
      </div>
      <div>
        <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-tight">{label}</span>
        <span className="text-lg font-extrabold text-slate-900">{value}{suffix}</span>
      </div>
    </div>
  );
}
