import { useState } from 'react';
import { MessageSquare, Sparkles, CheckCircle2, AlertTriangle, RefreshCw } from 'lucide-react';
import { API_BASE } from '../constants';

export default function ConversationIntelligence({ leadId, onActivityAdded, showToast }) {
  const [isOpen, setIsOpen] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);

  const handleAnalyze = async (e) => {
    e.preventDefault();
    if (!transcript.trim()) return;
    setAnalyzing(true);
    try {
      const res = await fetch(`${API_BASE}/leads/${leadId}/summarize-conversation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript }),
      });
      if (!res.ok) throw new Error('Failed to analyze conversation');
      const data = await res.json();
      setResult(data.analysis);
      showToast?.('Conversation analyzed & logged to timeline!');
      onActivityAdded?.();
    } catch (err) {
      console.error(err);
      showToast?.('Failed to process conversation', 'error');
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4.5 w-4.5 text-indigo-600" />
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-800">
            Conversation Intelligence & Call Summarizer
          </h3>
        </div>
        <button
          onClick={() => { setIsOpen(!isOpen); setResult(null); }}
          className="text-[10.5px] font-extrabold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-lg transition-colors"
        >
          {isOpen ? 'Close Summarizer' : 'Analyze Meeting / Call Transcript'}
        </button>
      </div>

      {!isOpen ? (
        <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
          Log sales call notes or paste meeting transcripts to automatically extract lead sentiment, key takeaways, action items, and trigger automatic sales pipeline progression.
        </p>
      ) : (
        <div className="space-y-4 mt-3">
          <form onSubmit={handleAnalyze} className="space-y-3">
            <div>
              <label className="block text-[10px] font-extrabold uppercase text-slate-400 mb-1">
                Paste Call Notes / Meeting Transcript
              </label>
              <textarea
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                placeholder="Example: Spoke with CTO John today. They were very interested in our AWS and Python backend integrations. Discussed budget of $15k and requested a product demo next Tuesday..."
                rows={3}
                className="w-full rounded-xl border border-slate-200 p-3 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 font-sans"
              />
            </div>
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-xs font-bold text-slate-400 hover:text-slate-600 px-3 py-1.5"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={analyzing || !transcript.trim()}
                className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-3.5 py-1.5 rounded-lg shadow-sm disabled:opacity-50 transition-colors"
              >
                {analyzing ? (
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Sparkles className="h-3.5 w-3.5" />
                )}
                <span>{analyzing ? 'Analyzing...' : 'Analyze with AI'}</span>
              </button>
            </div>
          </form>

          {result && (
            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 space-y-3 text-xs">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <span className="font-extrabold text-slate-500 text-[10px] uppercase">Extracted AI Sentiment</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                  result.sentiment.includes('Positive') ? 'bg-emerald-100 text-emerald-800' :
                  result.sentiment.includes('Attention') ? 'bg-rose-100 text-rose-800' :
                  'bg-amber-100 text-amber-800'
                }`}>
                  {result.sentiment}
                </span>
              </div>

              <div>
                <span className="font-extrabold text-slate-600 text-[10px] uppercase block mb-1">Key Takeaways</span>
                <ul className="space-y-1">
                  {result.key_takeaways.map((t, idx) => (
                    <li key={idx} className="flex items-start gap-1.5 text-slate-700 text-[11px]">
                      <CheckCircle2 className="h-3.5 w-3.5 text-indigo-500 shrink-0 mt-0.5" />
                      <span>{t}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <span className="font-extrabold text-slate-600 text-[10px] uppercase block mb-1">Recommended Action Items</span>
                <ul className="space-y-1">
                  {result.action_items.map((a, idx) => (
                    <li key={idx} className="flex items-start gap-1.5 text-slate-700 text-[11px]">
                      <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />
                      <span>{a}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
