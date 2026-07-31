import React, { useState, useEffect } from 'react';
import { 
  Database, RefreshCw, CheckCircle2, User, Mail, Clock, Send, 
  Sparkles, ExternalLink, MessageSquare, Phone, CalendarCheck, 
  StickyNote, ArrowRight, Zap, Calendar, Video
} from 'lucide-react';
import { API_BASE } from '../constants';

export default function CRMIntegration({ showToast }) {
  const [syncEvents, setSyncEvents] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [meetingData, setMeetingData] = useState(null);
  const [leadsList, setLeadsList] = useState([]);
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

      // 3. Fetch leads for meeting scheduler
      const leadsRes = await fetch(`${API_BASE}/leads`);
      if (leadsRes.ok) {
        const leadsData = await leadsRes.json();
        setLeadsList(Array.isArray(leadsData) ? leadsData : leadsData.leads || []);
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

  // Filter scheduled meetings from activities
  const scheduledMeetings = recentActivities.filter(act => act.status === 'Scheduled');

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

        {/* Header */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
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

        {/* Independent 3-Column Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">

          {/* ============================================ */}
          {/* BLOCK 1: CRM Sync Status                     */}
          {/* ============================================ */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xs p-5 flex flex-col">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">CRM Sync Status</h3>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                <CheckCircle2 className="w-3 h-3" /> Synced
              </span>
            </div>

            <div className="relative space-y-0">
              {isLoading ? (
                <p className="text-xs text-slate-400 font-medium py-6 text-center">Loading sync status...</p>
              ) : crmSyncCards.length === 0 ? (
                <p className="text-xs text-slate-400 font-medium py-6 text-center">No sync events yet</p>
              ) : (
                crmSyncCards.map((card, idx) => {
                  const CardIcon = card.Icon;
                  const isLast = idx === crmSyncCards.length - 1;
                  return (
                    <div key={idx} className="relative pl-12 py-3.5">
                      {/* Clean Connector Line connecting icon nodes only */}
                      {!isLast && (
                        <div className="absolute left-[19px] top-7 bottom-0 w-0.5 bg-slate-200" />
                      )}
                      <div className={`absolute left-1 top-3 w-8 h-8 rounded-full ${card.bg} border ${card.border} flex items-center justify-center z-10`}>
                        <CardIcon className={`w-3.5 h-3.5 ${card.color}`} />
                      </div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-bold text-slate-800">{card.description}</span>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${card.badgeColor}`}>
                          {card.badge}
                        </span>
                      </div>
                      <p className="text-xs font-medium text-slate-600 leading-snug">{card.subtext}</p>
                      <div className="flex items-center justify-between mt-1.5">
                        <span className="text-[10px] text-slate-400 font-medium">{card.system}</span>
                        <span className="text-[10px] text-slate-400 font-medium">{idx === 0 ? '2 min ago' : idx === 1 ? '15 min ago' : idx === 2 ? '1 hour ago' : 'Just now'}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* ============================================ */}
          {/* BLOCK 2: Meeting Summary                     */}
          {/* ============================================ */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xs p-5 flex flex-col">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Meeting Summary</h3>
              <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-full border border-purple-200 flex items-center gap-1 shadow-2xs">
                <Sparkles className="w-3 h-3 text-purple-600 animate-pulse" /> GLM-4.5 / 5.2 AI
              </span>
            </div>

            {meetingData ? (
              <div className="space-y-6">
                {/* Speaker Info */}
                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 font-medium bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="flex items-center gap-1.5 font-semibold text-slate-700">
                    <User className="w-3.5 h-3.5 text-indigo-500" />
                    {syncEvents[0]?.contact_name || "Alex Thompson"}
                  </span>
                  <span className="flex items-center gap-1.5 font-semibold text-slate-700">
                    <Database className="w-3.5 h-3.5 text-emerald-500" />
                    {syncEvents[0]?.company || "TechCorp Systems"}
                  </span>
                  <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100 ml-auto">
                    {meetingData.sentiment || "Positive"}
                  </span>
                </div>

                {/* Key Discussion Points */}
                <div>
                  <h4 className="text-xs font-bold text-slate-800 mb-3 uppercase tracking-wider flex items-center justify-between">
                    <span>📋 Key Discussion</span>
                    <span className="text-[10px] text-slate-400 font-normal">GLM-4.5 Analysis</span>
                  </h4>
                  <ul className="space-y-3">
                    {((meetingData.summary || "").split('. ').filter(Boolean)).map((point, i) => (
                      <li key={i} className="flex items-start gap-3 text-xs font-medium text-slate-700 bg-slate-50/50 p-2.5 rounded-lg border border-slate-100/80">
                        <span className="w-2 h-2 rounded-full bg-indigo-500 mt-1.5 shrink-0"></span>
                        <span className="leading-relaxed">{point.endsWith('.') ? point : point + '.'}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Action Items */}
                <div className="pt-4 border-t border-slate-100">
                  <h4 className="text-xs font-bold text-slate-800 mb-3 uppercase tracking-wider">
                    ⚡ Action Items Extracted
                  </h4>
                  <div className="space-y-3">
                    {(meetingData.action_items || []).length > 0 ? (
                      meetingData.action_items.map((item, idx) => (
                        <div key={idx} className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-3 flex items-center justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <span className="text-xs font-bold text-slate-800 block mb-0.5">
                              {idx % 2 === 0 ? 'Alex Thompson' : 'Sarah Johnson'}
                            </span>
                            <span className="text-[11px] font-medium text-slate-600 leading-snug block truncate whitespace-normal">{item}</span>
                          </div>
                          <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-100 shrink-0">
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
              <div className="flex flex-col items-center justify-center py-10 text-slate-400">
                <Sparkles className="w-10 h-10 text-slate-200 mb-3" />
                <p className="text-sm font-medium">No meeting analyzed yet.</p>
                <p className="text-xs text-center max-w-xs mt-2">
                  Go to "Call Intelligence" to process a sales call.
                </p>
              </div>
            )}
          </div>

          {/* ============================================ */}
          {/* BLOCK 3: Recent Activity                     */}
          {/* ============================================ */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xs p-5 flex flex-col">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-5">Recent Activity</h3>

            <div className="space-y-4 max-h-[460px] overflow-y-auto pr-1">
              {isLoading ? (
                <p className="text-xs text-slate-400 font-medium py-6 text-center">Loading activities...</p>
              ) : recentActivities.length === 0 ? (
                <p className="text-xs text-slate-400 font-medium py-6 text-center">No recent activities</p>
              ) : (
                recentActivities.map((act) => {
                  const ai = getActivityIcon(act.activity);
                  const ActivityIcon = ai.Icon;
                  return (
                    <div key={act.id} className="flex items-start gap-3.5 p-2 rounded-xl hover:bg-slate-50 transition-colors">
                      <div className={`w-9 h-9 rounded-xl ${ai.bg} flex items-center justify-center shrink-0 border border-slate-100`}>
                        <ActivityIcon className={`w-4 h-4 ${ai.color}`} />
                      </div>
                      <div className="flex-1 min-w-0 pt-0.5">
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

          {/* ============================================ */}
          {/* BLOCK 4: Schedule Meeting Form               */}
          {/* ============================================ */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xs p-5 flex flex-col h-full">
            <div className="border-b border-slate-100 pb-4 mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Schedule Meeting
                </h3>
                <p className="text-[11px] text-slate-500 font-medium mt-1">Book a call or demo</p>
              </div>
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                <Calendar className="w-4 h-4" />
              </div>
            </div>
            
            <form className="space-y-4 flex-1 flex flex-col" onSubmit={async (e) => { 
              e.preventDefault(); 
              const formData = new FormData(e.target);
              const leadId = formData.get("lead_id");
              const date = formData.get("date");
              const time = formData.get("time");
              const agenda = formData.get("agenda");

              try {
                const res = await fetch(`${API_BASE}/meetings/schedule`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ lead_id: leadId, date, time, agenda })
                });
                if (res.ok) {
                  showToast?.("Meeting scheduled successfully!", "success");
                  e.target.reset();
                  fetchCrmData();
                }
              } catch (err) {
                showToast?.("Failed to schedule meeting.", "error");
              }
            }}>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1.5">Select Lead</label>
                <select name="lead_id" required className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:border-indigo-500 font-medium text-slate-700">
                  <option value="">-- Choose a Lead --</option>
                  {leadsList.map(lead => (
                    <option key={lead.id} value={lead.id}>{lead.contact_name} ({lead.company})</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1.5">Date</label>
                  <input name="date" type="date" required className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:border-indigo-500 font-medium text-slate-700" />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1.5">Time</label>
                  <input name="time" type="time" required className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:border-indigo-500 font-medium text-slate-700" />
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1.5">Meeting Agenda</label>
                <input name="agenda" type="text" placeholder="e.g. Product Demo, Pricing Discuss" required className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:border-indigo-500 font-medium text-slate-700" />
              </div>
              
              <div className="mt-auto pt-2">
                <button type="submit" className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm">
                  Confirm & Schedule
                </button>
              </div>
            </form>
          </div>

          {/* ============================================ */}
          {/* BLOCK 5: Scheduled Meetings                  */}
          {/* ============================================ */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xs p-5 flex flex-col h-full">
            <div className="border-b border-slate-100 pb-4 mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Scheduled Meetings
                </h3>
                <p className="text-[11px] text-slate-500 font-medium mt-1">Upcoming calls and demos</p>
              </div>
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                <Video className="w-4 h-4" />
              </div>
            </div>

            <div className="space-y-3 flex-1 overflow-y-auto">
              {scheduledMeetings.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-400 py-8">
                  <CalendarCheck className="w-8 h-8 text-slate-200 mb-2" />
                  <p className="text-xs font-medium">No meetings scheduled.</p>
                </div>
              ) : (
                scheduledMeetings.map((mtg, idx) => (
                  <div key={idx} className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 hover:border-indigo-300 transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-xs font-bold text-slate-800">{mtg.company}</span>
                      <span className="text-[9px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">Upcoming</span>
                    </div>
                    <p className="text-xs text-slate-600 font-medium mb-3">{mtg.activity}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <button className="flex-1 text-[10px] font-bold bg-white border border-slate-200 text-slate-700 py-1.5 rounded-lg hover:bg-slate-100 transition-colors">Reschedule</button>
                      <button className="flex-1 text-[10px] font-bold bg-indigo-50 border border-indigo-100 text-indigo-700 py-1.5 rounded-lg hover:bg-indigo-100 transition-colors">Join Call</button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* ============================================ */}
          {/* BLOCK 6: Sentiment & Deal Stage              */}
          {/* ============================================ */}
          <div className="flex flex-col gap-5 h-full">
            
            {/* Sentiment */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-xs p-5 flex-1">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">Latest Sentiment</h3>
              {meetingData?.sentiment ? (
                <div className="flex items-center gap-4 bg-emerald-50/50 p-4 rounded-xl border border-emerald-100">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-100 border border-emerald-200 flex items-center justify-center shrink-0">
                    <span className="text-3xl">😊</span>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-emerald-700 mb-1">Positive</p>
                    <p className="text-xs text-slate-600 font-medium leading-snug">Customer is very interested in the solution and requested pricing.</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <div className="w-14 h-14 rounded-2xl bg-slate-200 flex items-center justify-center shrink-0">
                    <span className="text-3xl">😐</span>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-500 mb-1">Unknown</p>
                    <p className="text-xs text-slate-500 font-medium leading-snug">No recent meeting analyzed.</p>
                  </div>
                </div>
              )}
            </div>

            {/* Deal Stage */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-xs p-5 flex-1">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">Pipeline Stage</h3>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <p className="text-sm font-bold text-indigo-700 mb-3">Proposal Sent</p>
                <div className="flex items-center gap-1 w-full">
                  {['Prospect', 'Contacted', 'Demo', 'Proposal', 'Negotiation', 'Won'].map((stage, idx) => (
                    <React.Fragment key={stage}>
                      <div className={`w-4 h-4 rounded-full border-2 shrink-0 ${
                        idx <= 3
                          ? 'bg-indigo-600 border-indigo-600' 
                          : 'bg-white border-slate-300'
                      }`}></div>
                      {idx < 5 && (
                        <div className={`flex-1 h-1 ${
                          idx < 3 ? 'bg-indigo-600' : 'bg-slate-200'
                        }`}></div>
                      )}
                    </React.Fragment>
                  ))}
                </div>
                <div className="flex justify-between mt-2">
                  <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Start</span>
                  <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Close</span>
                </div>
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
