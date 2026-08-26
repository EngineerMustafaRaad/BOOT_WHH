import React from 'react';
import { Sidebar } from './Sidebar.js';
import { Navbar } from './Navbar.js';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  title: string;
  subtitle?: string;
  botConnected?: boolean;
}

export const Layout: React.FC<LayoutProps> = ({
  children,
  activeTab,
  setActiveTab,
  title,
  subtitle,
  botConnected,
}) => {
  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100 font-sans" dir="rtl">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <div className="flex-1 mr-64 flex flex-col min-h-screen">
        <Navbar title={title} subtitle={subtitle} botConnected={botConnected} />
        <main className="flex-1 p-8 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
};
