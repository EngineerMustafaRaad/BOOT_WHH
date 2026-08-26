import React from 'react';
import {
  LayoutDashboard,
  Users,
  ShieldAlert,
  AlertTriangle,
  UserX,
  PlaySquare,
  Settings,
  LogOut,
  Bot,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const { logout, user } = useAuth();

  const navItems = [
    { id: 'dashboard', label: 'لوحة التحكم', icon: LayoutDashboard },
    { id: 'groups', label: 'إدارة المجموعات', icon: Users },
    { id: 'words', label: 'الكلمات الممنوعة', icon: ShieldAlert },
    { id: 'violations', label: 'سجل المخالفات', icon: AlertTriangle },
    { id: 'members', label: 'الأعضاء والمخالفات', icon: UserX },
    { id: 'simulator', label: 'محاكي الرسائل الحي', icon: PlaySquare },
    { id: 'settings', label: 'إعدادات النظام', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-slate-900/95 border-l border-slate-800 flex flex-col h-screen fixed top-0 right-0 z-40">
      {/* Brand Header */}
      <div className="p-6 border-b border-slate-800 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
          <Bot className="w-6 h-6" />
        </div>
        <div>
          <h1 className="font-bold text-white text-base tracking-wide">WA Moderator</h1>
          <p className="text-xs text-emerald-400 font-medium">نظام المراقبة الذكي</p>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 ${
                isActive
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* User Info & Logout */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/40">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-emerald-400 uppercase">
              {user?.name?.charAt(0) || 'A'}
            </div>
            <div className="truncate">
              <p className="text-xs font-bold text-slate-200 truncate">{user?.name || 'المشرف'}</p>
              <p className="text-[10px] text-slate-400 truncate">{user?.email || 'admin@local'}</p>
            </div>
          </div>
          <button
            onClick={logout}
            title="تسجيل الخروج"
            className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
