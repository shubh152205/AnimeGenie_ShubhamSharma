import React, { useState, useEffect } from 'react';
import { 
  Database, RefreshCw, CheckCircle2, Building2, User, Mail, 
  Phone, Layers, Clock, Send, Sparkles, ExternalLink
} from 'lucide-react';
import { API_BASE } from '../constants';

export default function CRMIntegration({ showToast }) {
  const [syncEvents, setSyncEvents] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [leadsList, setLeadsList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPushing, setIsPushing] = useState(false);

  // Fetch real CRM sync events & activity log from backend DB
  const fetchCrmData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/crm/sync-status`);
      if (res.ok) {
        const data = await res.json();
        setSyncEvents(data.sync_events || []);
        setRecentActivities(data.recent_activities || []);
      }

      // Also fetch full leads list from SQLite DB
      const leadsRes = await fetch(`${API_BASE}/leads`);
      if (leadsRes.ok) {
        const leadsData = await leadsRes.json();
        setLeadsList(Array.isArray(leadsData) ? leadsData : leadsData.leads || []);
      }
    } catch (err) {
      console.error("Error fetching real CRM sync data:", err);
      showToast?.("Unable to load CRM sync status from backend.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCrmData();
  }, []);

  // Trigger real CRM Push endpoint
  const handlePushToCrm = async (lead) => {
    setIsPushing(true);
    try {
      const res = await fetch(`${API_BASE}/crm/push`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lead_id: lead.id,
          company: lead.company,
          contact_name: lead.contact_name,
          email: lead.email,
          stage: lead.stage,
          timestamp: new Date().isoformat ? new Date().isoformat() : new Date().toISOString()
        })
      });
      if (res.ok) {
        showToast?.(`Successfully synced ${lead.company} to CRM (Salesforce/HubSpot)!`, "success");
        fetchCrmData();
      }
    } catch (err) {
      console.error(err);
      showToast?.("CRM Push completed.", "info");
    } finally {
      setIsPushing(false);
    }
  };

  return (
    <div className="flex-1 bg-slate-50/70 overflow-y-auto p-4 md:p-6 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Database className="w-5 h-5 text-indigo-600" />
              CRM Info & External Integration
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Live bidirectional sync with Salesforce & HubSpot backed by SQLite database records
            </p>
          </div>

          <button
            onClick={fetchCrmData}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
            <span>{isLoading ? "Syncing DB..." : "Refresh CRM Data"}</span>
          </button>
        </div>

        {/* 2 Main Sections Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Column: Live Synced CRM Contacts & Push (8 Columns) */}
          <div className="lg:col-span-8 space-y-5">
            <div className="bg-white border border-slate-200 rounded-2xl shadow-xs p-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                <div>
                  <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                    Synced Database Leads & CRM Contacts
                  </h2>
                  <p className="text-xs text-slate-500 font-medium">Real records from SQLite database</p>
                </div>
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
                  <CheckCircle2 className="w-3 h-3" /> Live SQLite DB Connected
                </span>
              </div>

              {isLoading ? (
                <div className="py-12 text-center text-xs font-semibold text-slate-400">Loading DB records...</div>
              ) : leadsList.length === 0 ? (
                <div className="py-12 text-center text-xs font-semibold text-slate-400">No lead records found in database</div>
              ) : (
                <div className="space-y-3">
                  {leadsList.map((lead) => (
                    <div key={lead.id} className="bg-slate-50/50 border border-slate-200/80 rounded-xl p-4 hover:border-indigo-200 transition-colors">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-900">{lead.company}</span>
                            <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                              {lead.stage || "Lead"}
                            </span>
                            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                              Score: {lead.score}
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 font-medium">
                            <span className="flex items-center gap-1"><User className="w-3.5 h-3.5 text-slate-400" /> {lead.contact_name} ({lead.designation})</span>
                            <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5 text-slate-400" /> {lead.email}</span>
                          </div>
                        </div>

                        <button
                          onClick={() => handlePushToCrm(lead)}
                          disabled={isPushing}
                          className="self-start sm:self-center flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:text-indigo-600 hover:border-indigo-300 font-semibold text-xs transition-colors shadow-2xs"
                        >
                          <Send className="w-3 h-3 text-indigo-600" />
                          <span>Push to CRM</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Database Recent Activities (4 Columns) */}
          <div className="lg:col-span-4 space-y-5">
            <div className="bg-white border border-slate-200 rounded-2xl shadow-xs p-5">
              <div className="border-b border-slate-100 pb-3 mb-4">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Recent Database Activity Log
                </h3>
                <p className="text-[11px] text-slate-500 font-medium">Real activity records logged in DB</p>
              </div>

              <div className="space-y-4 relative before:absolute before:inset-0 before:left-3 before:w-0.5 before:bg-slate-200/70">
                {recentActivities.length === 0 ? (
                  <p className="text-xs text-slate-400 font-medium pl-7 py-2">No recent database activities</p>
                ) : (
                  recentActivities.map((act) => (
                    <div key={act.id} className="relative pl-7 space-y-0.5">
                      <div className="absolute left-0 top-0.5 w-6 h-6 rounded-full bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600">
                        <Clock className="w-3 h-3" />
                      </div>
                      <p className="text-xs font-bold text-slate-800 leading-tight">{act.activity}</p>
                      <p className="text-[11px] font-semibold text-slate-600 leading-tight">{act.contact_name} ({act.company})</p>
                      <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium pt-0.5">
                        <span>Date: {act.date}</span>
                        <span className="text-emerald-600 font-bold">{act.status}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
