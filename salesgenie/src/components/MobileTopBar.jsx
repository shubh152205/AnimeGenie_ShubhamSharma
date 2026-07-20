import { Menu, Sparkles } from 'lucide-react';

export default function MobileTopBar({ onMenuClick }) {
  return (
    <header className="flex lg:hidden items-center justify-between bg-[#0f172a] px-4 py-3 shrink-0">
      <button onClick={onMenuClick} className="text-white p-1">
        <Menu className="h-6 w-6" />
      </button>
      <div className="flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-tr from-indigo-500 to-purple-500">
          <Sparkles className="h-3.5 w-3.5 text-white" />
        </div>
        <span className="text-sm font-bold text-white">SalesGenie AI</span>
      </div>
      <div className="w-8" />
    </header>
  );
}
