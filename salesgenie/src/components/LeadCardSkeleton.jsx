export default function LeadCardSkeleton() {
  return (
    <div className="rounded-xl border border-slate-200/80 bg-white p-3.5 animate-pulse">
      <div className="flex justify-between items-start">
        <div className="space-y-2 min-w-0 flex-1">
          <div className="h-4 bg-slate-200 rounded w-3/5" />
          <div className="h-3 bg-slate-100 rounded w-2/5" />
        </div>
        <div className="h-5 bg-slate-200 rounded w-16" />
      </div>
      <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-slate-100/60">
        <div className="h-3 bg-slate-100 rounded w-20" />
        <div className="flex gap-1.5">
          <div className="h-3 bg-slate-100 rounded w-14" />
          <div className="h-3 bg-slate-100 rounded w-16" />
        </div>
      </div>
    </div>
  );
}
