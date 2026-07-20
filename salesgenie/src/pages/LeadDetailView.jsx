import { Briefcase, Trash2, AlertCircle } from 'lucide-react';
import { SALES_STAGES } from '../constants';
import ScoreGauge from '../components/ScoreGauge';
import MLConversionCard from '../components/MLConversionCard';
import TechAlignmentCard from '../components/TechAlignmentCard';
import AIBanner from '../components/AIBanner';
import CompanyInfo from '../components/CompanyInfo';
import SimilarDeals from '../components/SimilarDeals';
import ActivityTimeline from '../components/ActivityTimeline';

export default function LeadDetailView({ leadDetail, onStageChange, onDelete, onQuickActivity, onSelectDeal }) {
  if (!leadDetail) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-20 text-center text-slate-400">
        <AlertCircle className="h-10 w-10 text-slate-200 animate-pulse" />
        <p className="text-sm font-extrabold mt-3">No Lead Selected</p>
        <p className="text-xs text-slate-400 mt-1 max-w-xs">Select a prospect lead from the list on the left to see company details, technology stacks, machine learning conversion probabilities, and outreach strategies.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto w-full">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white shrink-0 shadow-inner">
            <Briefcase className="h-6 w-6" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-extrabold text-slate-900 leading-tight">{leadDetail.company}</h2>
              <span className="px-2 py-0.5 rounded font-extrabold text-[8px] bg-indigo-50 text-indigo-600 uppercase border border-indigo-100 tracking-tight">
                {leadDetail.industry}
              </span>
            </div>
            <p className="text-xs font-bold text-slate-600 mt-1">
              Contact: <span className="text-indigo-600 font-semibold">{leadDetail.contact_name}</span> ({leadDetail.designation})
            </p>
            <span className="text-[10px] font-extrabold bg-purple-50 text-purple-700 border border-purple-100 rounded-full px-2.5 py-0.5 mt-2 block w-fit">
              👤 {leadDetail.decision_maker_type}
            </span>
          </div>
        </div>
        <div className="flex items-end md:items-end flex-col justify-between shrink-0 gap-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Pipeline Stage:</span>
            <select
              value={leadDetail.stage}
              onChange={(e) => onStageChange?.(leadDetail.id, e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-indigo-700 px-2 py-1.5 focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              {SALES_STAGES.map(s => (
                <option key={s.id} value={s.id}>{s.label}</option>
              ))}
            </select>
          </div>
          <button
            onClick={() => onDelete?.(leadDetail.id)}
            className="flex items-center gap-1 text-[10px] font-bold text-rose-500 hover:text-rose-700 hover:bg-rose-50 px-2 py-1 rounded transition-colors self-end"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Delete Lead</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <ScoreGauge score={leadDetail.score} category={leadDetail.category} />
        <MLConversionCard mlProb={leadDetail.ml_prob} />
        <TechAlignmentCard techAlignment={leadDetail.tech_alignment} />
      </div>

      {/* AI Recommendation */}
      <AIBanner nextAction={leadDetail.next_action} />

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <CompanyInfo leadDetail={leadDetail} />
        <SimilarDeals similarDeals={leadDetail.similar_deals} onSelect={onSelectDeal} />
      </div>

      {/* Activity Timeline */}
      <ActivityTimeline activities={leadDetail.activities} onQuickActivity={onQuickActivity} />
    </div>
  );
}
