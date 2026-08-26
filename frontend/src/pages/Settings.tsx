import React, { useState } from 'react';
import { Settings as SettingsIcon, Bot, Cpu, Bell, Database, KeyRound, CheckCircle2 } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div>
        <h2 className="text-xl font-bold text-white">إعدادات النظام والاتصال</h2>
        <p className="text-sm text-slate-400 mt-1">
          تخصيص مزودات WhatsApp، الذكاء الاصطناعي، وقنوات التنبيهات الإدارية
        </p>
      </div>

      {savedSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5" />
          <span>تم حفظ الإعدادات وتطبيقها بنجاح في النظام.</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* WhatsApp Provider Card */}
        <div className="glass-panel rounded-3xl p-6 border border-slate-800 space-y-4">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">إعدادات ربط واتساب (WhatsApp Provider)</h3>
              <p className="text-xs text-slate-400">حدد طريقة الربط والمفاتيح المعتمدة</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">المزود النشط (Provider)</label>
              <select className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500">
                <option value="simulator">Interactive Simulator (محاكي محلي للتطوير والاختبار)</option>
                <option value="baileys">Baileys Multi-Device Socket (الربط المباشر المتقدم)</option>
                <option value="cloud_api">Meta WhatsApp Cloud API (الواجهة الرسمية للشركات)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">رقم هاتف المشرف للتنبيهات المباشرة</label>
              <input
                type="text"
                defaultValue="+966500000000"
                placeholder="+9665xxxxxxxx"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white font-mono text-xs focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* AI Moderation Card */}
        <div className="glass-panel rounded-3xl p-6 border border-slate-800 space-y-4">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">الرقابة الذكية بالذكاء الاصطناعي (AI Moderation)</h3>
              <p className="text-xs text-slate-400">تحليل دلالي وسياقي متقدم للرسائل الملتبسة</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">تفعيل الرقابة بالـ AI</label>
              <select className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500">
                <option value="false">معطل (الاعتماد على Rules Engine فقط)</option>
                <option value="true">مفعّل (تشغيل الذكاء الاصطناعي كطبقة إضافية)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">مزود الذكاء الاصطناعي</label>
              <select className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500">
                <option value="openai">OpenAI (GPT-4o-mini)</option>
                <option value="gemini">Google Gemini (1.5 Flash)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">مفتاح الـ API (API Key)</label>
              <input
                type="password"
                placeholder="sk-proj-••••••••••••••••"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white font-mono text-xs focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* Notifications Providers Card */}
        <div className="glass-panel rounded-3xl p-6 border border-slate-800 space-y-4">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">قنوات التنبيهات الإدارية الفورية</h3>
              <p className="text-xs text-slate-400">إرسال تقارير المخالفات عبر قنوات متعددة</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">Telegram Bot Token</label>
              <input
                type="password"
                placeholder="123456789:ABCdefGHI..."
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white font-mono text-xs focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">Telegram Chat ID</label>
              <input
                type="text"
                placeholder="-1001234567890"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white font-mono text-xs focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">بريد التنبيهات الإلكتروني (Email)</label>
              <input
                type="email"
                placeholder="security@yourcompany.com"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-xs focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">رابط Webhook (Discord / Custom)</label>
              <input
                type="url"
                placeholder="https://discord.com/api/webhooks/..."
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white font-mono text-xs focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <button
            type="submit"
            className="px-8 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm shadow-lg shadow-emerald-500/20 transition-all"
          >
            حفظ وتطبيق كافة الإعدادات
          </button>
        </div>
      </form>
    </div>
  );
};
