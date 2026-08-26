import React, { useEffect, useState } from 'react';
import {
  Users,
  ShieldCheck,
  AlertOctagon,
  Trash2,
  BellRing,
  Activity,
  Layers,
  Sparkles,
  ArrowUpRight,
} from 'lucide-react';
import { api } from '../services/api.js';
import { DashboardStats } from '../types/index.js';
import { StatsCard } from '../components/StatsCard.js';
import { CategoryBadge, SeverityBadge } from '../components/Badge.js';

export const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      const res = await api.get('/stats/dashboard');
      if (res.data.success) {
        setStats(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch dashboard stats', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 10000); // Live poll every 10s
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-8 h-8 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
      </div>
    );
  }

  const overview = stats?.overview;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Welcome / Bot Health Banner */}
      <div className="glass-panel bg-gradient-to-r from-slate-900/90 via-slate-900/70 to-emerald-950/40 p-6 rounded-3xl border border-emerald-500/20 relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Sparkles className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">نظام الرقابة والحماية الذكي يعمل بكفاءة</h2>
              <p className="text-sm text-slate-400 mt-1">
                المزود النشط: <span className="text-emerald-400 font-semibold">{overview?.botStatus?.provider || 'WhatsApp Adapter'}</span> | {overview?.botStatus?.details}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-slate-950/60 px-4 py-2 rounded-xl border border-slate-800 text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-slate-300 font-medium">مراقبة فورية للرسائل (&lt;1ms)</span>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="مخالفات اليوم"
          value={overview?.todayViolations || 0}
          subtitle={`إجمالي المخالفات: ${overview?.totalViolations || 0}`}
          icon={AlertOctagon}
          iconColor="text-amber-400"
          trend="+5%"
          trendPositive={false}
        />
        <StatsCard
          title="الرسائل المحذوفة"
          value={overview?.deletedMessages || 0}
          subtitle="تم حذفها فوراً وفق الصلاحيات"
          icon={Trash2}
          iconColor="text-rose-400"
        />
        <StatsCard
          title="التحذيرات المرسلة"
          value={overview?.warningsSent || 0}
          subtitle="تحذيرات آلية تصاعدية"
          icon={BellRing}
          iconColor="text-yellow-400"
        />
        <StatsCard
          title="المجموعات المراقبة"
          value={overview?.activeGroups || 0}
          subtitle={`إجمالي المسجلة: ${overview?.totalGroups || 0}`}
          icon={Users}
          iconColor="text-emerald-400"
        />
      </div>

      {/* Analytics Breakdown Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Top Violators */}
        <div className="glass-panel rounded-3xl p-6 border border-slate-800">
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-rose-400" />
              <h3 className="font-bold text-white text-base">أكثر الأعضاء مخالفة</h3>
            </div>
            <span className="text-xs text-slate-400">تحديث تلقائي</span>
          </div>

          <div className="space-y-3.5">
            {stats?.topViolators && stats.topViolators.length > 0 ? (
              stats.topViolators.map((violator, idx) => (
                <div
                  key={violator.id}
                  className="flex items-center justify-between p-3 rounded-2xl bg-slate-950/50 border border-slate-800/80 hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center text-xs font-bold">
                      {idx + 1}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">{violator.name}</p>
                      <p className="text-xs text-slate-400 font-mono">{violator.phoneNumber || violator.userJid.split('@')[0]}</p>
                    </div>
                  </div>
                  <div className="text-left">
                    <span className="px-2.5 py-1 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs font-bold">
                      {violator.totalViolations} مخالفات
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-400 text-center py-6">لا توجد مخالفات مسجلة حتى الآن.</p>
            )}
          </div>
        </div>

        {/* Top Triggered Rules */}
        <div className="glass-panel rounded-3xl p-6 border border-slate-800">
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-amber-400" />
              <h3 className="font-bold text-white text-base">أكثر القواعد تطابقاً</h3>
            </div>
            <span className="text-xs text-slate-400">الكلمات والأنماط</span>
          </div>

          <div className="space-y-3.5">
            {stats?.topRules && stats.topRules.length > 0 ? (
              stats.topRules.map((rule, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 rounded-2xl bg-slate-950/50 border border-slate-800/80 hover:border-slate-700 transition-colors"
                >
                  <div>
                    <p className="text-sm font-semibold text-white">{rule.rule}</p>
                    <div className="mt-1">
                      <CategoryBadge category={rule.category} />
                    </div>
                  </div>
                  <span className="text-xs font-bold px-2 py-1 rounded-md bg-slate-800 text-slate-300">
                    {rule.count} مرة
                  </span>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-400 text-center py-6">لا توجد قواعد مسجلة حتى الآن.</p>
            )}
          </div>
        </div>

        {/* Quick System Summary */}
        <div className="glass-panel rounded-3xl p-6 border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 pb-4 mb-4 border-b border-slate-800">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <h3 className="font-bold text-white text-base">معلومات الحماية والقواعد</h3>
            </div>

            <div className="space-y-4 text-sm">
              <div className="flex justify-between py-2 border-b border-slate-800/60">
                <span className="text-slate-400">إجمالي الكلمات الممنوعة</span>
                <span className="text-white font-bold">{overview?.totalRules || 0} كلمة</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-800/60">
                <span className="text-slate-400">إجمالي الأعضاء المراقبين</span>
                <span className="text-white font-bold">{overview?.totalMembers || 0} عضو</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-800/60">
                <span className="text-slate-400">محرك معالجة النصوص العربية</span>
                <span className="text-emerald-400 font-semibold">مفعّل (ArabicNormalizer v2)</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-slate-400">سرعة استجابة المحرك</span>
                <span className="text-emerald-400 font-semibold">&lt; 1ms (In-Memory Cache)</span>
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-slate-300">
            💡 يمكنك استخدام <strong className="text-emerald-400">محاكي الرسائل الحي</strong> من القائمة الجانبية لتجربة إرسال رسائل واختبار القواعد مباشرة بدون هاتف.
          </div>
        </div>
      </div>

      {/* Recent Violations Activity Table */}
      <div className="glass-panel rounded-3xl p-6 border border-slate-800">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
          <h3 className="font-bold text-white text-base">سجل المخالفات الأحدث</h3>
          <span className="text-xs text-slate-400">آخر 10 مخالفات تم رصدها</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-sm">
            <thead>
              <tr className="text-xs font-semibold text-slate-400 border-b border-slate-800">
                <th className="pb-3 pr-2">المجموعة</th>
                <th className="pb-3">العضو</th>
                <th className="pb-3">الرسالة</th>
                <th className="pb-3">القاعدة</th>
                <th className="pb-3">التصنيف</th>
                <th className="pb-3">الخطورة</th>
                <th className="pb-3">الإجراء</th>
                <th className="pb-3 pl-2">الوقت</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {stats?.recentViolations && stats.recentViolations.length > 0 ? (
                stats.recentViolations.map((v) => (
                  <tr key={v.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="py-3 pr-2 font-medium text-white">{v.group?.name || v.groupName}</td>
                    <td className="py-3 text-slate-300">{v.member?.name || v.userName}</td>
                    <td className="py-3 max-w-xs truncate text-slate-400 font-mono text-xs" title={v.messageText}>
                      "{v.messageText}"
                    </td>
                    <td className="py-3 text-amber-400 font-medium">{v.detectedRule}</td>
                    <td className="py-3">
                      <CategoryBadge category={v.category} />
                    </td>
                    <td className="py-3">
                      <SeverityBadge severity={v.severity} />
                    </td>
                    <td className="py-3 text-xs text-slate-300">{v.actionTaken}</td>
                    <td className="py-3 pl-2 text-xs text-slate-400">
                      {new Date(v.createdAt).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500">
                    لا توجد مخالفات مسجلة حتى الآن.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
