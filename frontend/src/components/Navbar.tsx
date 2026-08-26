import React from 'react';
import { Bell, ShieldCheck, Activity } from 'lucide-react';

interface NavbarProps {
  title: string;
  subtitle?: string;
  botConnected?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ title, subtitle, botConnected = true }) => {
  return (
    <header className="h-20 bg-slate-900/60 backdrop-blur-md border-b border-slate-800/80 px-8 flex items-center justify-between sticky top-0 z-30">
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight">{title}</h2>
        {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-4">
        {/* Live Bot Connection Status indicator */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/80 border border-slate-700 text-xs">
          <span className={`w-2.5 h-2.5 rounded-full ${botConnected ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'}`} />
          <span className="font-medium text-slate-300">
            {botConnected ? 'البوت متصل ونشط' : 'البوت غير متصل'}
          </span>
        </div>

        <div className="p-2 rounded-xl bg-slate-800/60 border border-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-emerald-400 rounded-full" />
        </div>
      </div>
    </header>
  );
};
