export default function ActivityTimeline({ activities, onQuickActivity }) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">Activity Timeline</h3>
        <div className="flex gap-1.5 flex-wrap">
          <button
            onClick={() => onQuickActivity?.("Log Outgoing Phone Call")}
            className="px-2 py-1 rounded bg-slate-50 border border-slate-200 hover:border-slate-300 text-slate-600 text-[10px] font-bold"
          >
            📞 Log Call
          </button>
          <button
            onClick={() => onQuickActivity?.("Log Outbound Email")}
            className="px-2 py-1 rounded bg-slate-50 border border-slate-200 hover:border-slate-300 text-slate-600 text-[10px] font-bold"
          >
            ✉️ Log Email
          </button>
          <button
            onClick={() => onQuickActivity?.("Schedule Product Demo")}
            className="px-2 py-1 rounded bg-amber-50 border border-amber-200 hover:bg-amber-100 text-amber-700 text-[10px] font-bold"
          >
            📅 Schedule Demo
          </button>
          <button
            onClick={() => onQuickActivity?.("Mark Lead Converted")}
            className="px-2 py-1 rounded bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 text-emerald-700 text-[10px] font-bold"
          >
            🏆 Convert
          </button>
        </div>
      </div>

      <div className="relative border-l border-slate-100 pl-4 ml-2 space-y-4.5 max-h-[250px] overflow-y-auto pr-1">
        {activities && activities.length > 0 ? (
          activities.map((act, idx) => (
            <div key={act.id || idx} className="relative group">
              <span className="absolute -left-6.5 top-1 h-3.5 w-3.5 rounded-full border-2 border-white bg-indigo-500 shadow-xs group-hover:scale-110 transition-transform" />
              <div className="flex justify-between items-start text-xs font-semibold">
                <div>
                  <h4 className="text-slate-800 text-[11.5px] font-bold">{act.activity}</h4>
                  <span className="text-[9.5px] text-slate-400 font-semibold">{act.date}</span>
                </div>
                <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${act.status === 'Completed' ? 'bg-indigo-50 text-indigo-700' : 'bg-slate-100 text-slate-500'}`}>
                  {act.status}
                </span>
              </div>
            </div>
          ))
        ) : (
          <div className="py-4 text-center text-slate-400 text-xs">No activity logs recorded. Click quick actions above to log calls, emails, or mark as converted.</div>
        )}
      </div>
    </div>
  );
}
