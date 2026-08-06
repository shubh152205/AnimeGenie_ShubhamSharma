export default function SimilarDeals({ similarDeals, onSelect }) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3.5">
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 border-b border-slate-100 pb-2">Similar Converted Deals</h3>
        <p className="text-[9px] text-slate-400 font-semibold mt-1 leading-snug">Uses TF-IDF Vectorization over Industry + Tech Stack + Pain Points to find matching profiles.</p>
      </div>

      <div className="space-y-2.5">
        {similarDeals && similarDeals.length > 0 ? (
          similarDeals.map(deal => (
            <div
              key={deal.id}
              onClick={() => onSelect?.(deal.id)}
              className="bg-slate-50/50 p-2.5 rounded-xl border border-slate-100 hover:border-indigo-200 cursor-pointer transition-colors flex items-center justify-between group"
            >
              <div>
                <h4 className="text-[11px] font-bold text-slate-800 group-hover:text-indigo-600 leading-tight">{deal.company}</h4>
                <span className="text-[9px] text-slate-400 font-semibold">{deal.industry} • {deal.location}</span>
              </div>
              <div className="text-right flex flex-col items-end">
                <span className="text-[10px] font-extrabold text-emerald-600 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-100">{deal.stage}</span>
                <span className="text-[9px] text-slate-400 font-bold mt-0.5">{deal.similarity}% Match</span>
              </div>
            </div>
          ))
        ) : (
          <div className="py-6 text-center text-slate-400 text-xs">No similar deals found.</div>
        )}
      </div>
    </div>
  );
}
