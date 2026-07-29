import React, { useState, useRef } from 'react';
import { 
  Upload, FileAudio, CheckCircle2, Clock, Mail, PhoneCall, 
  Calendar, FileText, Sparkles, Building2, User, RefreshCw, 
  PlusCircle, ArrowUpRight, Bot
} from 'lucide-react';
import { API_BASE } from '../constants';

export default function CallIntelligence({ showToast }) {
  const [file, setFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState('Conversations');
  const [recordingResult, setRecordingResult] = useState(null);
  const fileInputRef = useRef(null);

  // Mock initial data based on Milestone 3 slides
  const [discussionPoints, setDiscussionPoints] = useState([
    "Data processing bottlenecks affecting customer experience",
    "Need for real-time analytics and reporting capabilities",
    "Budget approved for Q3 technology infrastructure upgrade",
    "Competitive evaluation in progress with 2 other vendors"
  ]);

  const [actionItems, setActionItems] = useState([
    { assignee: "Alex Thompson", due: "Jun 10", task: "Send technical architecture document and integration guide" },
    { assignee: "Sarah Johnson", due: "Jun 12", task: "Schedule technical deep-dive with engineering team" }
  ]);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      showToast?.("Please select an audio file first.", "error");
      return;
    }

    setIsProcessing(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(`${API_BASE}/upload-audio`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("Audio upload failed.");
      const data = await res.json();
      
      setRecordingResult(data);
      if (data.summary) {
        setDiscussionPoints(data.summary.split('. ').filter(Boolean));
      }
      if (data.action_items && data.action_items.length > 0) {
        setActionItems(data.action_items.map((item, idx) => ({
          assignee: idx % 2 === 0 ? "Alex Thompson" : "Sarah Johnson",
          due: "Jun 15",
          task: item
        })));
      }
      showToast?.("Sales call recording analyzed successfully!", "success");
    } catch (err) {
      console.error(err);
      showToast?.("Using demo transcript & LLM insights fallback.", "info");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex-1 bg-slate-50/70 overflow-y-auto p-4 md:p-6 font-sans">
      <div className="max-w-7xl mx-auto space-y-5">
        
        {/* Top Header Badge */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-700 text-xs font-bold uppercase tracking-wider mb-1">
              <span>MILESTONE 3 • WEEKS 5–6</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              CRM Integration & Conversation Intelligence
            </h1>
            <p className="text-sm text-slate-500 font-medium">
              Sync with CRM and extract insights from sales conversations
            </p>
          </div>

          {/* Quick Audio Trigger Button */}
          <div className="flex items-center gap-3">
            <input 
              type="file" 
              accept="audio/*" 
              className="hidden" 
              ref={fileInputRef} 
              onChange={handleFileChange}
            />
            {file && (
              <span className="text-xs font-semibold text-slate-600 bg-white border border-slate-200 px-3 py-1.5 rounded-lg truncate max-w-[150px]">
                {file.name}
              </span>
            )}
            <button
              onClick={() => fileInputRef.current ? fileInputRef.current.click() : null}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 font-semibold text-xs shadow-xs hover:bg-slate-50 transition-colors"
            >
              <Upload className="w-3.5 h-3.5 text-indigo-600" />
              <span>{file ? "Change Audio" : "Upload Call Recording"}</span>
            </button>

            <button
              onClick={handleUpload}
              disabled={!file || isProcessing}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white shadow-sm transition-all ${
                !file || isProcessing 
                  ? "bg-slate-300 cursor-not-allowed" 
                  : "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isProcessing ? "Processing..." : "Process AI Call"}</span>
            </button>
          </div>
        </div>

        {/* Main Interface Window */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
          
          {/* Inner Navigation Tabs */}
          <div className="flex items-center justify-between px-6 border-b border-slate-100 bg-slate-50/50">
            <div className="flex items-center gap-1">
              {['Leads', 'Outreach', 'Conversations', 'Dashboard'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-5 py-3 text-xs font-bold border-b-2 transition-colors ${
                    activeTab === tab 
                      ? 'border-indigo-600 text-indigo-600 bg-white' 
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
            <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              FastAPI & CRM Active
            </span>
          </div>

          {/* 3-Column Layout specified in Milestone 3 */}
          <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-100 min-h-[520px]">
            
            {/* 1. Left Column: CRM Sync Status */}
            <div className="lg:col-span-3 p-5 space-y-4 bg-slate-50/30">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">CRM Sync Status</h3>
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                  <CheckCircle2 className="w-3 h-3" /> Synced
                </span>
              </div>

              <div className="space-y-3">
                {/* Sync Event 1 */}
                <div className="bg-white border border-slate-200/80 rounded-xl p-3.5 shadow-2xs hover:border-slate-300 transition-colors">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-slate-800">Contact Synced</span>
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">Added</span>
                  </div>
                  <p className="text-xs font-medium text-slate-600 leading-snug">
                    Sarah Johnson, CTO at TechCorp Solutions
                  </p>
                  <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-slate-100 text-[10px] text-slate-400 font-medium">
                    <span>Salesforce</span>
                    <span>2 min ago</span>
                  </div>
                </div>

                {/* Sync Event 2 */}
                <div className="bg-white border border-slate-200/80 rounded-xl p-3.5 shadow-2xs hover:border-slate-300 transition-colors">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-slate-800">Activity Logged</span>
                    <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">Updated</span>
                  </div>
                  <p className="text-xs font-medium text-slate-600 leading-snug">
                    Initial outreach email sent and opened
                  </p>
                  <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-slate-100 text-[10px] text-slate-400 font-medium">
                    <span>HubSpot</span>
                    <span>15 min ago</span>
                  </div>
                </div>

                {/* Sync Event 3 */}
                <div className="bg-white border border-slate-200/80 rounded-xl p-3.5 shadow-2xs hover:border-slate-300 transition-colors">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-slate-800">Deal Stage Updated</span>
                    <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">Moved</span>
                  </div>
                  <p className="text-xs font-medium text-slate-600 leading-snug">
                    Moved from "Prospecting" to "Qualified"
                  </p>
                  <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-slate-100 text-[10px] text-slate-400 font-medium">
                    <span>Salesforce</span>
                    <span>1 hour ago</span>
                  </div>
                </div>

                {/* Sync Event 4 */}
                <div className="bg-white border border-slate-200/80 rounded-xl p-3.5 shadow-2xs hover:border-slate-300 transition-colors">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-slate-800">Task Created</span>
                    <span className="text-[10px] font-bold text-teal-600 bg-teal-50 px-1.5 py-0.5 rounded">New</span>
                  </div>
                  <p className="text-xs font-medium text-slate-600 leading-snug">
                    Follow-up scheduled with engineering team
                  </p>
                </div>
              </div>
            </div>

            {/* 2. Middle Column: Meeting Summary */}
            <div className="lg:col-span-6 p-6 space-y-6">
              
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <h2 className="text-base font-bold text-slate-900">Meeting Summary</h2>
                <span className="inline-flex items-center gap-1 text-xs font-bold text-purple-600 bg-purple-50 px-2.5 py-1 rounded-full border border-purple-100">
                  <Sparkles className="w-3.5 h-3.5 text-purple-600" /> AI Powered
                </span>
              </div>

              {/* Speaker Metadata */}
              <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                <div className="flex items-center gap-1.5 text-slate-800">
                  <User className="w-4 h-4 text-indigo-600" />
                  <span>Sarah Johnson, CTO</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-slate-400" />
                  <span>45 min • Today</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-slate-400" />
                  <span>TechCorp Solutions</span>
                </div>
              </div>

              {/* Key Discussion Points */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <FileText className="w-4 h-4 text-indigo-600" />
                  Key Discussion Points
                </h4>
                <ul className="space-y-2.5 pl-1">
                  {discussionPoints.map((point, index) => (
                    <li key={index} className="flex items-start gap-3 text-xs font-semibold text-slate-700">
                      <span className="w-2 h-2 rounded-full bg-indigo-600 mt-1.5 shrink-0"></span>
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Action Items */}
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                  Action Items
                </h4>

                <div className="space-y-2.5">
                  {actionItems.map((item, idx) => (
                    <div key={idx} className="bg-amber-50/60 border border-amber-200/70 rounded-xl p-3.5">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-bold text-slate-800">{item.assignee}</span>
                        <span className="text-[10px] font-bold text-amber-700">Due: {item.due}</span>
                      </div>
                      <p className="text-xs font-semibold text-slate-700 leading-normal">
                        {item.task}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Live Transcript Display if processed */}
              {recordingResult?.transcript && (
                <div className="pt-4 border-t border-slate-100">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                    Speech-to-Text Transcript (Whisper)
                  </h4>
                  <div className="bg-slate-900 text-slate-200 text-xs p-3.5 rounded-xl font-mono max-h-32 overflow-y-auto">
                    {recordingResult.transcript}
                  </div>
                </div>
              )}

            </div>

            {/* 3. Right Column: Recent Activity */}
            <div className="lg:col-span-3 p-5 space-y-4 bg-slate-50/30">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">
                Recent Activity
              </h3>

              <div className="space-y-4 relative before:absolute before:inset-0 before:left-3 before:w-0.5 before:bg-slate-200/70">
                
                {/* Activity 1 */}
                <div className="relative pl-7 space-y-0.5">
                  <div className="absolute left-0 top-0.5 w-6 h-6 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
                    <Mail className="w-3 h-3" />
                  </div>
                  <p className="text-xs font-bold text-slate-800 leading-tight">Follow-up email opened by Sarah</p>
                  <p className="text-[10px] text-slate-400 font-medium">TechCorp Solutions • 30 min ago</p>
                </div>

                {/* Activity 2 */}
                <div className="relative pl-7 space-y-0.5">
                  <div className="absolute left-0 top-0.5 w-6 h-6 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
                    <PhoneCall className="w-3 h-3" />
                  </div>
                  <p className="text-xs font-bold text-slate-800 leading-tight">Discovery call completed (45 min)</p>
                  <p className="text-[10px] text-slate-400 font-medium">TechCorp Solutions • 2 hours ago</p>
                </div>

                {/* Activity 3 */}
                <div className="relative pl-7 space-y-0.5">
                  <div className="absolute left-0 top-0.5 w-6 h-6 rounded-full bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-600">
                    <Calendar className="w-3 h-3" />
                  </div>
                  <p className="text-xs font-bold text-slate-800 leading-tight">Demo scheduled for Jun 15 at 2:00 PM</p>
                  <p className="text-[10px] text-slate-400 font-medium">TechCorp Solutions • Yesterday</p>
                </div>

                {/* Activity 4 */}
                <div className="relative pl-7 space-y-0.5">
                  <div className="absolute left-0 top-0.5 w-6 h-6 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
                    <FileText className="w-3 h-3" />
                  </div>
                  <p className="text-xs font-bold text-slate-800 leading-tight">
                    Added note: <span className="font-normal italic">"Technical team very interested in API capabilities"</span>
                  </p>
                  <p className="text-[10px] text-slate-400 font-medium">TechCorp Solutions • Yesterday</p>
                </div>

                {/* Activity 5 */}
                <div className="relative pl-7 space-y-0.5">
                  <div className="absolute left-0 top-0.5 w-6 h-6 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500">
                    <Mail className="w-3 h-3" />
                  </div>
                  <p className="text-xs font-bold text-slate-800 leading-tight">Initial outreach email sent</p>
                  <p className="text-[10px] text-slate-400 font-medium">TechCorp Solutions • 3 days ago</p>
                </div>

              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
