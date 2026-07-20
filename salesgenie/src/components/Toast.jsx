import { CheckCircle } from 'lucide-react';

export default function Toast({ message }) {
  if (!message) return null;
  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-white shadow-2xl animate-in fade-in slide-in-from-bottom-5">
      <CheckCircle className="h-5 w-5 text-indigo-400" />
      <span className="text-sm font-medium">{message}</span>
    </div>
  );
}
