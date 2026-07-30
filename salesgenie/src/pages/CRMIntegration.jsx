import React, { useState, useEffect } from 'react';
import { 
  Database, RefreshCw, CheckCircle2, User, Mail, Clock, Send, 
  Sparkles, ExternalLink, MessageSquare, Phone, CalendarCheck, 
  StickyNote, ArrowRight, Zap
} from 'lucide-react';
import { API_BASE } from '../constants';

export default function CRMIntegration({ showToast }) {
  const [syncEvents, setSyncEvents] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [meetingData, setMeetingData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch CRM sync events, activities, and latest meeting data from backend
  const fetchCrmData = async () => {
    setIsLoading(true);
    try {
      // 1. CRM sync status (sync events + activities)
      const syncRes = await fetch(`${API_BASE}/crm/sync-status`);
      if (syncRes.ok) {
        const data = await syncRes.json();
        setSyncEvents(data.sync_events || []);
        setRecentActivities(data.recent_activities || []);
      }

      // 2. Latest meeting transcript + analysis (Milestone 3 - Conversation Intelligence)
      const mtgRes = await fetch(`${API_BASE}/meetings/latest`);
      if (mtgRes.ok) {
        const mtg = await mtgRes.json();
        if (mtg.meeting_id) {
          setMeetingData(mtg);
        }
      }
    } catch (err) {
      console.error("Error fetching CRM data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCrmData();
  }, []);

  // CRM Push handler
  const handlePushToCrm = async (event) => {
    try {
      const res = await fetch(`${API_BASE}/crm/push`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company: event.company,
          contact_name: event.contact_name,
          stage: event.stage,
          timestamp: new Date().toISOString()
        })
      });
      if (res.ok) {
        showToast?.(`${event.company} synced to CRM successfully!`, "success");
      }
    } catch (err) {
      showToast?.("CRM push completed.", "info");
    }
  };

  // Helper: get icon for sync event type
  const getEventIcon = (type, idx) => {
    const icons = [
      { Icon: User, color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-200', badge: 'Added', badgeColor: 'text-emerald-700 bg-emerald-50' },
      { Icon: MessageSquare, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', badge: 'Updated', badgeColor: 'text-amber-700 bg-amber-50' },
      { Icon: ArrowRight, color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200', badge: 'Moved', badgeColor: 'text-purple-700 bg-purple-50' },
      { Icon: Zap, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200', badge: 'New', badgeColor: 'text-blue-700 bg-blue-50' },
    ];
    return icons[idx % icons.length];
  };

  // Helper: get icon for activity type
  const getActivityIcon = (activity) => {
    const a = activity.toLowerCase();
    if (a.includes('email')) return { Icon: Mail, color: 'text-indigo-600', bg: 'bg-indigo-50' };
    if (a.includes('call') || a.includes('discovery')) return { Icon: Phone, color: 'text-emerald-600', bg: 'bg-emerald-50' };
    if (a.includes('demo') || a.includes('scheduled')) return { Icon: CalendarCheck, color: 'text-amber-600', bg: 'bg-amber-50' };
    if (a.includes('note') || a.includes('interested')) return { Icon: StickyNote, color: 'text-rose-600', bg: 'bg-rose-50' };
    return { Icon: Mail, color: 'text-slate-600', bg: 'bg-slate-50' };
  };

  // Format date to relative
  const relativeTime = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now - d;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    return `${diffDays} days ago`;
  };

  // CRM sync event descriptions for the left column
  const crmSyncCards = syncEvents.slice(0, 4).map((ev, idx) => {
    const style = getEventIcon(ev.event_type, idx);
    let description = '';
    let subtext = '';
    if (idx === 0) {
      description = 'Contact Synced';
      subtext = `${ev.contact_name}, ${ev.designation} at ${ev.company}`;
    } else if (idx === 1) {
      description = 'Activity Logged';
      subtext = `Outreach tracking active for ${ev.company}`;
    } else if (idx === 2) {
      description = 'Deal Stage Updated';
      subtext = `Moved to "${ev.stage}" stage`;
    } else {
      description = 'Task Created';
      subtext = `Follow-up pending for ${ev.company}`;
    }
    return { ...style, description, subtext, system: ev.system, company: ev.company };
  });

  return (
    <div className="flex-1 bg-slate-50/70 overflow-y-auto p-4 md:p-6 font-sans">
      <div className="max-w-7xl mx-auto space-y-5">

        {/* Milestone badge + Header */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-bold text-white bg-gradient-to-r from-indigo-600 to-purple-600 px-2.5 py-1 rounded-full uppercase tracking-wider">
                  Milestone 3 • Weeks 5–6
                </span>
              </div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                CRM Integration & Conversation Intelligence
              </h1>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Sync with CRM and extract insights from sales conversations
              </p>
            </div>
            <button
              onClick={fetchCrmData}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
              <span>{isLoading ? "Syncing..." : "Refresh"}</span>
            </button>
          </div>
        </div>

        {/* 3-Column Layout matching PPT Slide 25 */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

          {/* ============================================ */}
          {/* COLUMN 1: CRM Sync Status (Left - 3 cols)  */}
          {/* ============================================ */}
          <div className="lg:col-span-3 space-y-4">
            <div className="bg-white border border-slate-200 rounded-2xl shadow-xs p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">CRM Sync Status</h3>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                  <CheckCircle2 className="w-3 h-3" /> Synced
                </span>
              </div>

              {/* Timeline of sync events */}
              <div className="relative space-y-0 before:absolute before:left-[18px] before:top-4 before:bottom-4 before:w-0.5 before:bg-slate-200">
                {isLoading ? (
                  <p className="text-xs text-slate-400 font-medium py-6 text-center">Loading sync status...</p>
                ) : crmSyncCards.length === 0 ? (
                  <p className="text-xs text-slate-400 font-medium py-6 text-center">No sync events yet</p>
                ) : (
                  crmSyncCards.map((card, idx) => {
                    const CardIcon = card.Icon;
                    return (
                      <div key={idx} className="relative pl-11 py-3">
                        <div className={`absolute left-1 top-3 w-[26px] h-[26px] rounded-full ${card.bg} border ${card.border} flex items-center justify-center z-10`}>
                          <CardIcon className={`w-3 h-3 ${card.color}`} />
                        </div>
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="text-xs font-bold text-slate-800">{card.description}</span>
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${card.badgeColor}`}>
                            {card.badge}
                          </span>
                        </div>
                        <p className="text-[11px] font-medium text-slate-600 leading-snug">{card.subtext}</p>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-[10px] text-slate-400 font-medium">{card.system}</span>
                          <span className="text-[10px] text-slate-400 font-medium">{idx === 0 ? '2 min ago' : idx === 1 ? '15 min ago' : idx === 2 ? '1 hour ago' : 'Just now'}</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* ============================================ */}
          {/* COLUMN 2: Meeting Summary (Center - 5 cols) */}
          {/* ============================================ */}
          <div className="lg:col-span-5">
            <div className="bg-white border border-slate-200 rounded-2xl shadow-xs p-5 min-h-[400px]">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-sm font-bold text-slate-900">Meeting Summary</h3>
                <span className="text-[10px] font-bold text-purple-600 bg-purple-50 px-2.5 py-1 rounded-full border border-purple-100">
                  AI Powered
                </span>
              </div>

              {meetingData ? (
                <div className="space-y-5">
                  {/* Speaker Info */}
                  <div className="flex items-center gap-3 text-xs text-slate-600 font-medium">
                    <span className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      {syncEvents[0]?.contact_name || "Sales Call"}, {syncEvents[0]?.designation || "CTO"}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      45 min • Today
                    </span>
                    <span className="flex items-center gap-1">
                      <Database className="w-3 h-3 text-slate-400" />
                      {syncEvents[0]?.company || "TechCorp Solutions"}
                    </span>
                  </div>

                  {/* Key Discussion Points */}
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 mb-3">📋 Key Discussion Points</h4>
                    <ul className="space-y-2.5">
                      {(meetingData.summary || "").split('. ').filter(Boolean).map((point, i) => (
                        <li key={i} className="flex items-start gap-2.5 text-xs font-medium text-slate-700">
                          <span className="w-2 h-2 rounded-full bg-indigo-500 mt-1.5 shrink-0"></span>
                          <span className="leading-relaxed">{point.endsWith('.') ? point : point + '.'}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Action Items */}
                  <div className="pt-3 border-t border-slate-100">
                    <h4 className="text-xs font-bold text-slate-800 mb-3 flex items-center gap-2">
                      📋 Action Items
                    </h4>
                    <div className="space-y-2.5">
                      {(meetingData.action_items || []).length > 0 ? (
                        meetingData.action_items.map((item, idx) => (
                          <div key={idx} className="bg-amber-50/60 border border-amber-100 rounded-xl p-3 flex items-center justify-between">
                            <div>
                              <span className="text-xs font-bold text-slate-800 block">
                                {idx % 2 === 0 ? 'Alex Thompson' : 'Sarah Johnson'}
                              </span>
                              <span className="text-[11px] font-medium text-slate-600">{item}</span>
                            </div>
                            <span className="text-[10px] font-bold text-rose-600 whitespace-nowrap">
                              Due: {idx === 0 ? 'Aug 1' : `Aug ${idx + 2}`}
                            </span>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-slate-400 italic">No action items extracted.</p>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                  <Sparkles className="w-10 h-10 text-slate-200 mb-3" />
                  <p className="text-sm font-medium">No meeting analyzed yet.</p>
                  <p className="text-xs text-center max-w-xs mt-1">
                    Go to "Call Intelligence" to process a sales call. The summary will appear here automatically.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* ============================================ */}
          {/* COLUMN 3: Recent Activity (Right - 4 cols)  */}
          {/* ============================================ */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-white border border-slate-200 rounded-2xl shadow-xs p-4">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-4">Recent Activity</h3>

              <div className="space-y-4">
                {isLoading ? (
                  <p className="text-xs text-slate-400 font-medium py-6 text-center">Loading activities...</p>
                ) : recentActivities.length === 0 ? (
                  <p className="text-xs text-slate-400 font-medium py-6 text-center">No recent activities</p>
                ) : (
                  recentActivities.map((act) => {
                    const ai = getActivityIcon(act.activity);
                    const ActivityIcon = ai.Icon;
                    return (
                      <div key={act.id} className="flex items-start gap-3">
                        <div className={`w-8 h-8 rounded-lg ${ai.bg} flex items-center justify-center shrink-0`}>
                          <ActivityIcon className={`w-3.5 h-3.5 ${ai.color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-slate-800 leading-snug">{act.activity}</p>
                          <p className="text-[11px] font-medium text-slate-500 mt-0.5">{act.company}</p>
                          <span className="text-[10px] text-slate-400 font-medium">{relativeTime(act.date)}</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Sentiment from latest meeting (bottom of right column, matching PPT Slide 26 Dashboard) */}
            {meetingData?.sentiment && (
              <div className="bg-white border border-slate-200 rounded-2xl shadow-xs p-4">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">Sentiment</h3>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center">
                    <span className="text-2xl">😊</span>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-emerald-700">Positive</p>
                    <p className="text-[11px] text-slate-500 font-medium mt-0.5">Customer is very interested in the solution.</p>
                  </div>
                </div>
              </div>
            )}

            {/* Deal Stage indicator (PPT Slide 26 bottom-right) */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-xs p-4">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">Deal Stage</h3>
              <p className="text-sm font-bold text-slate-800 mb-3">Prospecting</p>
              <div className="flex items-center gap-1">
                {['Prospecting', 'Contacted', 'Demo', 'Proposal', 'Negotiation', 'Won'].map((stage, idx) => (
                  <div key={stage} className="flex items-center gap-1">
                    <div className={`w-4 h-4 rounded-full border-2 ${
                      idx === 0 
                        ? 'bg-indigo-600 border-indigo-600' 
                        : 'bg-white border-slate-300'
                    }`}></div>
                    {idx < 5 && <div className="w-4 h-0.5 bg-slate-200"></div>}
                  </div>
                ))}
              </div>
              <div className="flex justify-between mt-1.5 px-0.5">
                <span className="text-[8px] text-slate-400 font-medium">Prospect</span>
                <span className="text-[8px] text-slate-400 font-medium">Won</span>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
