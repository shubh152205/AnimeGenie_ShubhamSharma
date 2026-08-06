export default function ScoreGauge({ score, category }) {
  const ringColor = score >= 85 ? "text-rose-500" : score >= 70 ? "text-indigo-500" : "text-slate-400";
  const badgeClass = score >= 85
    ? "bg-rose-50 text-rose-700 border border-rose-100"
    : score >= 70
    ? "bg-indigo-50 text-indigo-700 border border-indigo-100"
    : "bg-slate-100 text-slate-600";

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col items-center justify-between text-center min-h-[180px]">
      <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">AI Rule-Based Score</span>
      <div className="relative h-24 w-24 flex items-center justify-center mt-2">
        <svg className="h-full w-full" viewBox="0 0 36 36">
          <path
            className="text-slate-100"
            strokeWidth="3.5"
            stroke="currentColor"
            fill="none"
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
          />
          <path
            className={ringColor}
            strokeDasharray={`${score}, 100`}
            strokeWidth="3.5"
            strokeLinecap="round"
            stroke="currentColor"
            fill="none"
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
          />
        </svg>
        <div className="absolute text-center">
          <span className="text-2xl font-extrabold text-slate-900 leading-none">{score}</span>
          <span className="text-[9px] text-slate-400 font-bold block">/ 100</span>
        </div>
      </div>
      <span className={`text-[10.5px] font-extrabold px-2.5 py-0.5 rounded-full mt-2 uppercase tracking-wide ${badgeClass}`}>
        🔥 {category}
      </span>
    </div>
  );
}
