import { Sparkles, Search, Layers3, Send, LayoutDashboard, Settings } from 'lucide-react';
import { OUR_PRODUCT_STACK } from '../constants';

const navItems = [
  { name: "Leads Explorer", label: "Leads Database", icon: Search },
  { name: "Deal Pipeline", label: "Sales Pipeline", icon: Layers3 },
  { name: "AI Outreach Generator", label: "AI Outreach Writer", icon: Send },
  { name: "Analytics Dashboard", label: "Sales Analytics", icon: LayoutDashboard }
];

export default function Sidebar({ activeTab, onTabChange, sidebarOpen, onClose }) {
  return (
    <aside className={`fixed lg:relative z-40 flex flex-col justify-between border-r border-slate-800 bg-[#0f172a] text-slate-300 transition-transform duration-300 h-full ${
      sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
    } w-64 shrink-0`}>
      <div>
        {/* Logo */}
        <div className="flex h-16 items-center gap-2.5 px-6 border-b border-slate-800/80">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-500 via-purple-600 to-pink-500 text-white shadow-lg shadow-indigo-500/20">
            <Sparkles className="h-4.5 w-4.5" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-white leading-none">SalesGenie AI</h1>
            <span className="text-[9px] font-bold uppercase tracking-wider text-indigo-400 mt-0.5 block">Lead Intelligence CRM</span>
          </div>
        </div>

        {/* Nav items */}
        <nav className="mt-6 space-y-1.5 px-3">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.name;
            return (
              <button
                key={item.name}
                onClick={() => { onTabChange(item.name); onClose?.(); }}
                className={`flex w-full items-center gap-3.5 rounded-lg px-4 py-3 text-sm font-medium transition-all duration-200 group relative ${
                  isActive
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/10"
                    : "hover:bg-slate-800/60 hover:text-white"
                }`}
              >
                <Icon className={`h-5 w-5 transition-transform duration-200 group-hover:scale-105 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`} />
                <span>{item.label}</span>
                {isActive && (
                  <span className="absolute right-3 top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-white shadow" />
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer */}
      <div className="border-t border-slate-800 p-4">
        <div className="flex flex-col gap-2 rounded-lg bg-slate-800/40 p-3">
          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wide">Our Target Product Stack</span>
          <div className="flex flex-wrap gap-1 mt-1">
            {OUR_PRODUCT_STACK.map(tech => (
              <span key={tech} className="text-[9px] bg-indigo-950/60 text-indigo-300 px-1.5 py-0.5 rounded border border-indigo-800/40">{tech}</span>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-lg p-2 mt-3 hover:bg-slate-800/40">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400 font-semibold text-sm">
            SR
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-white truncate">Sales Representative</p>
            <p className="text-[10px] text-slate-500 truncate">Lead Management Center</p>
          </div>
          <Settings className="h-4.5 w-4.5 text-slate-500 hover:text-slate-300 cursor-pointer" />
        </div>
      </div>
    </aside>
  );
}
