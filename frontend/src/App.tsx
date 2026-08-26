import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.js';
import { Layout } from './components/Layout.js';
import { Login } from './pages/Login.js';
import { Dashboard } from './pages/Dashboard.js';
import { Groups } from './pages/Groups.js';
import { ForbiddenWords } from './pages/ForbiddenWords.js';
import { Violations } from './pages/Violations.js';
import { Members } from './pages/Members.js';
import { Simulator } from './pages/Simulator.js';
import { SettingsPage } from './pages/Settings.js';

const AppContent: React.FC = () => {
  const { user, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  const getPageInfo = () => {
    switch (activeTab) {
      case 'dashboard':
        return { title: 'لوحة التحكم والإحصائيات', subtitle: 'نظرة عامة على نشاط البوت والمجموعات والمخالفات اليومية' };
      case 'groups':
        return { title: 'إدارة المجموعات', subtitle: 'تخصيص سياسات المراقبة والإجراءات التلقائية لكل مجموعة' };
      case 'words':
        return { title: 'الكلمات والعبارات الممنوعة', subtitle: 'إدارة الكلمات المحظورة والاستثناءات والتصنيفات' };
      case 'violations':
        return { title: 'سجل المخالفات المكتشفة', subtitle: 'سجل تدقيق كامل لكافة الرسائل المخالفة وتاريخ حدوثها' };
      case 'members':
        return { title: 'الأعضاء والمخالفات', subtitle: 'متابعة رصيد مخالفات الأعضاء وإعادة ضبطها' };
      case 'simulator':
        return { title: 'محاكي الرسائل الحي', subtitle: 'اختبار دقيق لقواعد الحماية وتطبيع النصوص العربية بشكل فوري' };
      case 'settings':
        return { title: 'إعدادات النظام والاتصال', subtitle: 'إدارة مفاتيح الربط ومزودات الذكاء الاصطناعي والتنبيهات' };
      default:
        return { title: 'لوحة التحكم', subtitle: '' };
    }
  };

  const { title, subtitle } = getPageInfo();

  return (
    <Layout
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      title={title}
      subtitle={subtitle}
      botConnected={true}
    >
      {activeTab === 'dashboard' && <Dashboard />}
      {activeTab === 'groups' && <Groups />}
      {activeTab === 'words' && <ForbiddenWords />}
      {activeTab === 'violations' && <Violations />}
      {activeTab === 'members' && <Members />}
      {activeTab === 'simulator' && <Simulator />}
      {activeTab === 'settings' && <SettingsPage />}
    </Layout>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
