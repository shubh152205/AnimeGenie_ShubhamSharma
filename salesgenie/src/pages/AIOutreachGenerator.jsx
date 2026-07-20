import { Sparkles, Copy, RefreshCw, FileText, Mail, Phone } from 'lucide-react';
import { OUTREACH_CHANNELS } from '../constants';

export default function AIOutreachGenerator({
  leads, outreachLeadId, setOutreachLeadId,
  outreachChannel, setOutreachChannel,
  outreachTone, setOutreachTone,
  generatedOutreach, generatingOutreach,
  onGenerate, onCopy
}) {
  const OUTREACH_TONES = [
    { val: "Professional", label: "👔 Professional" },
    { val: "Persuasive", label: "🎯 Persuasive" },
    { val: "Friendly", label: "😊 Friendly" },
    { val: "Urgent", label: "⚡ Urgent" }
  ];

  return (
    <div className="flex-1 flex flex-col bg-[#f8fafc] overflow-y-auto p-4 md:p-6">
      <div className="border-b border-slate-200 pb-4 mb-6">
        <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">AI Outreach Generator</h2>
        <p className="text-xs text-slate-500 font-medium">Compose personalized outreach messages, email pitches, and LinkedIn messages tailored to prospects</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Setup Panel */}
        <div className="lg:col-span-1 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4.5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 border-b border-slate-100 pb-2">Outreach Settings</h3>

          <div>
            <label className="block text-[10px] font-extrabold uppercase text-slate-400 mb-1.5">Select Target Lead</label>
            <select
              value={outreachLeadId}
              onChange={(e) => setOutreachLeadId(e.target.value)}
              className="w-full rounded-lg border border-slate-200 p-2.5 text-xs font-semibold text-slate-800 focus:outline-none focus:border-indigo-500"
            >
              {leads.map(lead => (
                <option key={lead.id} value={lead.id}>{lead.company}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-extrabold uppercase text-slate-400 mb-1.5">Outreach Channel</label>
            <div className="grid grid-cols-2 gap-1.5">
              {OUTREACH_CHANNELS.map(ch => (
                <button
                  key={ch.val}
                  onClick={() => setOutreachChannel(ch.val)}
                  className={`rounded-lg py-2 text-[10.5px] font-bold border transition-all ${
                    outreachChannel === ch.val
                      ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                      : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {ch.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-extrabold uppercase text-slate-400 mb-1.5">AI Pitch Strategy</label>
            <div className="grid grid-cols-2 gap-1.5">
              {OUTREACH_TONES.map(t => (
                <button
                  key={t.val}
                  onClick={() => setOutreachTone(t.val)}
                  className={`rounded-lg py-2 text-[10.5px] font-bold border transition-all ${
                    outreachTone === t.val
                      ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                      : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={onGenerate}
            disabled={generatingOutreach}
            className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600 p-3 text-xs font-bold text-white shadow-md shadow-indigo-600/15 hover:bg-indigo-700 transition-colors disabled:opacity-50"
          >
            {generatingOutreach ? (
              <RefreshCw className="h-4.5 w-4.5 animate-spin" />
            ) : (
              <Sparkles className="h-4.5 w-4.5" />
            )}
            <span>{generatingOutreach ? "Generating..." : "Generate AI Outreach"}</span>
          </button>
        </div>

        {/* Output Panel */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs min-h-[400px]">
          {generatedOutreach ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <div className="flex items-center gap-2 text-xs font-bold">
                  <FileText className="h-4 w-4 text-indigo-500" />
                  <span className="text-slate-600">Generated:</span>
                  <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded text-[10px]">{generatedOutreach.channel}</span>
                  <span className="bg-purple-50 text-purple-700 px-2 py-0.5 rounded text-[10px]">{generatedOutreach.tone}</span>
                </div>
                <button
                  onClick={() => onCopy?.(generatedOutreach.message)}
                  className="flex items-center gap-1 text-[10px] font-bold text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 px-2 py-1 rounded transition-colors"
                >
                  <Copy className="h-3.5 w-3.5" />
                  <span>Copy</span>
                </button>
              </div>

              {generatedOutreach.subject && (
                <div className="bg-amber-50/50 border border-amber-100 rounded-lg p-2.5 text-[11px] font-semibold text-slate-700">
                  <span className="text-[9px] font-extrabold text-amber-600 uppercase">Subject: </span>
                  {generatedOutreach.subject}
                </div>
              )}

              <pre className="text-[11.5px] leading-relaxed text-slate-700 whitespace-pre-wrap font-sans bg-slate-50/30 p-3 rounded-lg border border-slate-100">
                {generatedOutreach.message}
              </pre>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="h-14 w-14 rounded-xl bg-indigo-50 flex items-center justify-center mb-4">
                <Mail className="h-7 w-7 text-indigo-400" />
              </div>
              <p className="text-sm font-extrabold text-slate-700">AI Outreach Not Generated Yet</p>
              <p className="text-[11px] text-slate-400 font-medium mt-1 max-w-xs">
                Configure your settings on the left panel and click "Generate AI Outreach" to automatically compose the pitch.
              </p>
              <div className="flex gap-4 mt-5 text-[10px] font-bold text-slate-400">
                <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> Multi-Channel</span>
                <span className="flex items-center gap-1"><FileText className="h-3 w-3" /> Strategy Control</span>
                <span className="flex items-center gap-1"><Sparkles className="h-3 w-3" /> AI Powered</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
