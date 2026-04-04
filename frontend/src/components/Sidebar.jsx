import { NavLink } from 'react-router-dom';
import { Activity, LayoutDashboard, LineChart, Search, TrendingUp, Menu } from 'lucide-react';
import { useState } from 'react';

const navItems = [
  { to: '/', label: 'Home', icon: Activity },
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/predict', label: 'Value Prediction', icon: TrendingUp },
  { to: '/analysis', label: 'Player Analysis', icon: Search },
  { to: '/metrics', label: 'Model Metrics', icon: LineChart },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className={`transition-all duration-300 ${collapsed ? 'w-16' : 'w-64'} bg-[#1E293B] border-r border-[rgba(255,255,255,0.06)] flex flex-col hidden md:flex z-50`}>
      <div className="h-16 flex items-center justify-between px-4 border-b border-[rgba(255,255,255,0.06)]">
        {!collapsed && <span className="font-bold text-lg gradient-text whitespace-nowrap overflow-hidden">EliteScout AI</span>}
        <button onClick={() => setCollapsed(!collapsed)} className="text-gray-400 hover:text-white transition-colors ml-auto">
          <Menu size={20} />
        </button>
      </div>
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
                isActive
                  ? 'bg-[rgba(11,95,255,0.15)] text-[#3b82f6] shadow-[inset_2px_0_0_0_#3b82f6]'
                  : 'text-gray-400 hover:bg-[#263348] hover:text-white'
              }`
            }
          >
            <item.icon size={20} className="shrink-0" />
            {!collapsed && <span className="whitespace-nowrap font-medium text-sm">{item.label}</span>}
          </NavLink>
        ))}
      </nav>
      {/* Footer / User space */}
      <div className="p-4 border-t border-[rgba(255,255,255,0.06)]">
         {!collapsed && <div className="text-xs text-gray-500 text-center">v2.0.0 MLOps</div>}
      </div>
    </div>
  );
}
