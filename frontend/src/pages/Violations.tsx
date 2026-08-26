import React, { useEffect, useState } from 'react';
import {
  Trash2,
  Filter,
  Search,
  Calendar,
  ChevronRight,
  ChevronLeft,
  Eye,
  MessageSquareX,
  User,
  Clock,
  AlertTriangle,
  ShieldAlert,
  X,
} from 'lucide-react';
import { api } from '../services/api.js';
import { Violation, Group } from '../types/index.js';
import { CategoryBadge, SeverityBadge } from '../components/Badge.js';
import { Modal } from '../components/Modal.js';

const ACTION_COLOR: Record<string, string> = {
  WARN: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
  DELETE: 'bg-rose-500/10 border-rose-500/20 text-rose-400',
  KICK: 'bg-red-600/10 border-red-600/20 text-red-400',
  MUTE: 'bg-violet-500/10 border-violet-500/20 text-violet-400',
  NONE: 'bg-slate-700/30 border-slate-700 text-slate-400',
};

const ACTION_LABEL: Record<string, string> = {
  WARN: '⚠️ تحذير',
  DELETE: '🗑️ رسالة محذوفة',
  KICK: '🚫 طرد',
  MUTE: '🔇 كتم',
  NONE: 'لا إجراء',
};

export const Violations: React.FC = () => {
  const [violations, setViolations] = useState<Violation[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [limit] = useState(25);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedGroup, setSelectedGroup] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState('');
  const [selectedAction, setSelectedAction] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Detail Modal
  const [detailViolation, setDetailViolation] = useState<Violation | null>(null);

  const fetchViolations = async () => {
    try {
      setLoading(true);
      const params: any = { limit, offset: page * limit };
      if (selectedGroup) params.groupId = selectedGroup;
      if (selectedCategory) params.category = selectedCategory;
      if (selectedSeverity) params.severity = selectedSeverity;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const res = await api.get('/violations', { params });
      if (res.data.success) {
        const items: Violation[] = res.data.data.items;
        // Filter by action on client side
        const filtered = selectedAction ? items.filter((v) => v.actionTaken === selectedAction) : items;
        setViolations(filtered);
        setTotal(res.data.data.total);
      }
    } catch (err) {
      console.error('Failed to fetch violations', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchGroups = async () => {
    try {
      const res = await api.get('/groups');
      if (res.data.success) setGroups(res.data.data);
    } catch (err) {
      console.error('Failed to fetch groups for filter', err);
    }
  };

  useEffect(() => { fetchGroups(); }, []);
  useEffect(() => { fetchViolations(); }, [page, selectedGroup, selectedCategory, selectedSeverity, selectedAction, startDate, endDate]);

  const totalPages = Math.ceil(total / limit);
  const deletedCount = violations.filter((v) => v.actionTaken === 'DELETE' || v.actionTaken === 'KICK').length;

  const activeFilters = [selectedGroup, selectedCategory, selectedSeverity, selectedAction, startDate, endDate].filter(Boolean).length;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <MessageSquareX className="w-5 h-5 text-rose-400" />
            سجل الرسائل المحذوفة والمخالفات
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            جميع الرسائل التي رصدها البوت مع تفاصيل كاملة والإجراء المتخذ
          </p>
        </div>

        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`relative flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all ${
            showFilters || activeFilters > 0
              ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
              : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800'
          }`}
        >
          <Filter className="w-4 h-4" />
          <span>فلترة وتصفية</span>
          {activeFilters > 0 && (
            <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-emerald-500 text-white text-[10px] font-bold flex items-center justify-center">
              {activeFilters}
            </span>
          )}
        </button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'إجمالي المخالفات', value: total, color: 'text-white', icon: <ShieldAlert className="w-4 h-4 text-rose-400" /> },
          { label: 'رسائل محذوفة', value: violations.filter((v) => v.actionTaken === 'DELETE').length, color: 'text-rose-400', icon: <Trash2 className="w-4 h-4 text-rose-400" /> },
          { label: 'تحذيرات مُرسَلة', value: violations.filter((v) => v.actionTaken === 'WARN').length, color: 'text-amber-400', icon: <AlertTriangle className="w-4 h-4 text-amber-400" /> },
          { label: 'أعضاء مطرودون', value: violations.filter((v) => v.actionTaken === 'KICK').length, color: 'text-red-400', icon: <X className="w-4 h-4 text-red-400" /> },
        ].map((stat) => (
          <div key={stat.label} className="glass-panel rounded-2xl p-4 border border-slate-800">
            <div className="flex items-center gap-2 mb-2">{stat.icon}<span className="text-xs text-slate-400">{stat.label}</span></div>
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="glass-panel rounded-2xl p-5 border border-slate-800 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">المجموعة</label>
              <select value={selectedGroup} onChange={(e) => { setSelectedGroup(e.target.value); setPage(0); }}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500">
                <option value="">جميع المجموعات</option>
                {groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">نوع المخالفة</label>
              <select value={selectedCategory} onChange={(e) => { setSelectedCategory(e.target.value); setPage(0); }}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500">
                <option value="">كل الأنواع</option>
                <option value="SPAM">سبام</option>
                <option value="INSULT">إهانة</option>
                <option value="ADVERTISEMENT">إعلان</option>
                <option value="PROFANITY">ألفاظ نابية</option>
                <option value="HARASSMENT">تحرش</option>
                <option value="CUSTOM">مخصص</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">الإجراء المتخذ</label>
              <select value={selectedAction} onChange={(e) => { setSelectedAction(e.target.value); setPage(0); }}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500">
                <option value="">كل الإجراءات</option>
                <option value="DELETE">🗑️ رسالة محذوفة</option>
                <option value="WARN">⚠️ تحذير</option>
                <option value="KICK">🚫 طرد</option>
                <option value="MUTE">🔇 كتم</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">من تاريخ</label>
              <input type="date" value={startDate} onChange={(e) => { setStartDate(e.target.value); setPage(0); }}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500" />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">إلى تاريخ</label>
              <input type="date" value={endDate} onChange={(e) => { setEndDate(e.target.value); setPage(0); }}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500" />
            </div>

            <div className="flex items-end">
              <button
                onClick={() => { setSelectedGroup(''); setSelectedCategory(''); setSelectedSeverity(''); setSelectedAction(''); setStartDate(''); setEndDate(''); setPage(0); }}
                className="w-full py-2 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold transition-colors"
              >
                مسح الفلاتر كلها
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Violations Table */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-rose-500/30 border-t-rose-500 rounded-full animate-spin" />
        </div>
      ) : violations.length === 0 ? (
        <div className="glass-panel rounded-3xl p-16 border border-slate-800 text-center">
          <MessageSquareX className="w-16 h-16 text-slate-700 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-slate-400 mb-2">لا توجد مخالفات مسجلة</h3>
          <p className="text-sm text-slate-500">عند رصد البوت أي رسالة مخالفة، ستظهر هنا فوراً</p>
        </div>
      ) : (
        <div className="space-y-3">
          {violations.map((violation) => (
            <div
              key={violation.id}
              className="glass-panel rounded-2xl p-5 border border-slate-800 hover:border-slate-700 transition-all"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                {/* Left: Message content */}
                <div className="flex-1 min-w-0 space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Action Badge */}
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${ACTION_COLOR[violation.actionTaken] || ACTION_COLOR.NONE}`}>
                      {ACTION_LABEL[violation.actionTaken] || violation.actionTaken}
                    </span>
                    <CategoryBadge category={violation.category} />
                    <SeverityBadge severity={violation.severity} />
                  </div>

                  {/* The deleted message text */}
                  <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5">
                    <p className="text-xs text-slate-500 mb-1.5 font-semibold">📝 نص الرسالة المحذوفة:</p>
                    <p className="text-sm text-white leading-relaxed break-words line-clamp-3">{violation.messageText || '(لا يوجد نص محفوظ)'}</p>
                    {violation.matchedWord && (
                      <div className="mt-2 flex items-center gap-2">
                        <span className="text-xs text-slate-400">الكلمة المكتشفة:</span>
                        <code className="px-2 py-0.5 rounded-lg bg-rose-500/15 border border-rose-500/20 text-rose-300 text-xs font-mono">{violation.matchedWord}</code>
                      </div>
                    )}
                  </div>

                  {/* Member & Group info */}
                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
                    <span className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-slate-500" />
                      <span className="text-white font-semibold">{violation.member?.name || violation.userId || 'مجهول'}</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <ShieldAlert className="w-3.5 h-3.5 text-slate-500" />
                      <span>{violation.group?.name || 'مجموعة غير معروفة'}</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                      <span>{new Date(violation.createdAt).toLocaleString('ar-SA')}</span>
                    </span>
                    <span className="text-slate-500">
                      مخالفة رقم #{violation.violationCount || 1} للعضو
                    </span>
                  </div>
                </div>

                {/* Right: Detail button */}
                <button
                  onClick={() => setDetailViolation(violation)}
                  className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>تفاصيل</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold transition-colors disabled:opacity-30"
          >
            <ChevronRight className="w-4 h-4" />
            السابق
          </button>
          <span className="text-sm text-slate-400">
            صفحة <strong className="text-white">{page + 1}</strong> من <strong className="text-white">{totalPages}</strong>
            <span className="text-slate-500 mr-2">({total} مخالفة)</span>
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold transition-colors disabled:opacity-30"
          >
            التالي
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Detail Modal */}
      <Modal
        isOpen={!!detailViolation}
        onClose={() => setDetailViolation(null)}
        title="🔍 تفاصيل المخالفة الكاملة"
        maxWidth="max-w-xl"
      >
        {detailViolation && (
          <div className="space-y-4 text-sm">
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-bold ${ACTION_COLOR[detailViolation.actionTaken] || ACTION_COLOR.NONE}`}>
              {ACTION_LABEL[detailViolation.actionTaken] || detailViolation.actionTaken}
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'اسم العضو', value: detailViolation.member?.name || detailViolation.userId || 'مجهول' },
                { label: 'رقم واتساب', value: detailViolation.userId || '-' },
                { label: 'المجموعة', value: detailViolation.group?.name || '-' },
                { label: 'رقم المخالفة', value: `#${detailViolation.violationCount || 1}` },
                { label: 'التصنيف', value: detailViolation.category },
                { label: 'مستوى الخطورة', value: detailViolation.severity },
                { label: 'التاريخ والوقت', value: new Date(detailViolation.createdAt).toLocaleString('ar-SA') },
                { label: 'الكلمة المكتشفة', value: detailViolation.matchedWord || '-' },
              ].map(({ label, value }) => (
                <div key={label} className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                  <p className="text-xs text-slate-400 mb-1">{label}</p>
                  <p className="text-white font-semibold text-xs break-all">{value}</p>
                </div>
              ))}
            </div>

            <div className="p-4 rounded-2xl bg-rose-500/5 border border-rose-500/20">
              <p className="text-xs text-rose-400 font-semibold mb-2">📝 نص الرسالة المحذوفة الكامل:</p>
              <p className="text-white text-sm leading-relaxed whitespace-pre-wrap">{detailViolation.messageText || '(لا يوجد نص محفوظ)'}</p>
            </div>

            {detailViolation.reason && (
              <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/20">
                <p className="text-xs text-amber-400 font-semibold mb-1">سبب الإجراء:</p>
                <p className="text-slate-300 text-xs">{detailViolation.reason}</p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};
