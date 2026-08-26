import React, { useEffect, useState } from 'react';
import { UserX, Search, RotateCcw, AlertTriangle, Check } from 'lucide-react';
import { api } from '../services/api.js';
import { Member } from '../types/index.js';

export const Members: React.FC = () => {
  const [members, setMembers] = useState<Member[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchMembers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/violations/members', {
        params: { search: search || undefined },
      });
      if (res.data.success) {
        setMembers(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch members', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, [search]);

  const handleResetViolations = async (member: Member) => {
    if (!window.confirm(`هل أنت متأكد من تصفير سجل مخالفات العضو ${member.name}؟`)) return;
    try {
      await api.post(`/violations/members/${member.id}/reset`);
      await fetchMembers();
    } catch (err) {
      console.error('Failed to reset member violations', err);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white">سجل الأعضاء والمخالفات</h2>
          <p className="text-sm text-slate-400 mt-1">
            متابعة إجمالي مخالفات كل عضو في المجموعات مع إمكانية إعادة ضبط وتصفير السجل
          </p>
        </div>

        <div className="relative w-full sm:w-72">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="بحث بالاسم أو الرقم..."
            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 pr-10 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
          <Search className="w-4 h-4 text-slate-500 absolute top-3.5 right-3.5" />
        </div>
      </div>

      <div className="glass-panel rounded-3xl p-6 border border-slate-800">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-sm">
            <thead>
              <tr className="text-xs font-semibold text-slate-400 border-b border-slate-800">
                <th className="pb-3 pr-2">اسم العضو</th>
                <th className="pb-3">رقم الهاتف / المعرف</th>
                <th className="pb-3">إجمالي المخالفات</th>
                <th className="pb-3">آخر مخالفة</th>
                <th className="pb-3 pl-2 text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {members.length > 0 ? (
                members.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="py-3.5 pr-2 font-bold text-white flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-xs text-emerald-400">
                        {m.name.charAt(0)}
                      </div>
                      <span>{m.name}</span>
                    </td>
                    <td className="py-3.5 text-slate-400 font-mono text-xs">{m.phoneNumber || m.userJid}</td>
                    <td className="py-3.5">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                          m.totalViolations > 2
                            ? 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                            : m.totalViolations > 0
                            ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                            : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                        }`}
                      >
                        {m.totalViolations} مخالفات
                      </span>
                    </td>
                    <td className="py-3.5 text-xs text-slate-400">
                      {m.lastViolationAt ? new Date(m.lastViolationAt).toLocaleDateString('ar-EG') : 'لا يوجد'}
                    </td>
                    <td className="py-3.5 pl-2 text-center">
                      <button
                        onClick={() => handleResetViolations(m)}
                        disabled={m.totalViolations === 0}
                        title="تصفير المخالفات"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <RotateCcw className="w-3.5 h-3.5 text-emerald-400" />
                        <span>تصفير</span>
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-slate-500">
                    {loading ? 'جاري التحميل...' : 'لا يوجد أعضاء مسجلين.'}
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
