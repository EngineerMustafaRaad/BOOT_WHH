import React, { useEffect, useState, useCallback } from 'react';
import {
  Users,
  Settings2,
  Check,
  X,
  RefreshCw,
  Megaphone,
  Send,
  CheckCircle2,
  MessageSquare,
  Wifi,
  WifiOff,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { api } from '../services/api.js';
import { Group, GroupSettings } from '../types/index.js';
import { Modal } from '../components/Modal.js';

interface LiveGroup {
  jid: string;
  name: string;
  participantsCount: number;
}

export const Groups: React.FC = () => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);

  // Broadcast Modal State
  const [isBroadcastModalOpen, setIsBroadcastModalOpen] = useState(false);
  const [liveGroups, setLiveGroups] = useState<LiveGroup[]>([]);
  const [liveGroupsLoading, setLiveGroupsLoading] = useState(false);
  const [botConnected, setBotConnected] = useState(false);
  const [botProvider, setBotProvider] = useState('');
  const [selectedJids, setSelectedJids] = useState<Set<string>>(new Set());
  const [broadcastText, setBroadcastText] = useState('');
  const [sendingBroadcast, setSendingBroadcast] = useState(false);
  const [broadcastStatus, setBroadcastStatus] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [formSettings, setFormSettings] = useState<Partial<GroupSettings>>({});

  const fetchGroups = async () => {
    try {
      setLoading(true);
      const res = await api.get('/groups');
      if (res.data.success) setGroups(res.data.data);
    } catch (err) {
      console.error('Failed to fetch groups', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch live WhatsApp groups from bot adapter
  const fetchLiveGroups = useCallback(async () => {
    try {
      setLiveGroupsLoading(true);
      const res = await api.get('/groups/live-groups');
      if (res.data.success) {
        setLiveGroups(res.data.data || []);
        setBotConnected(res.data.connected);
        setBotProvider(res.data.provider || '');
      }
    } catch (err) {
      console.error('Failed to fetch live groups', err);
      setLiveGroups([]);
      setBotConnected(false);
    } finally {
      setLiveGroupsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGroups();
  }, []);

  const handleOpenBroadcast = (preSelectJid?: string) => {
    setBroadcastText('');
    setBroadcastStatus(null);
    const preselect = new Set<string>();
    if (preSelectJid) preselect.add(preSelectJid);
    setSelectedJids(preselect);
    setIsBroadcastModalOpen(true);
    fetchLiveGroups();
  };

  const toggleJid = (jid: string) => {
    setSelectedJids((prev) => {
      const next = new Set(prev);
      if (next.has(jid)) next.delete(jid);
      else next.add(jid);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedJids.size === liveGroups.length) {
      setSelectedJids(new Set());
    } else {
      setSelectedJids(new Set(liveGroups.map((g) => g.jid)));
    }
  };

  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastText.trim() || selectedJids.size === 0) return;

    try {
      setSendingBroadcast(true);
      setBroadcastStatus(null);

      const jids = Array.from(selectedJids);
      let totalSent = 0;

      // Send to each selected group individually (targeted)
      for (const jid of jids) {
        try {
          const res = await api.post('/groups/broadcast', {
            message: broadcastText,
            targetJid: jid,
          });
          if (res.data.success) totalSent += res.data.sentCount;
        } catch {
          // continue to next
        }
      }

      setBroadcastStatus({
        type: 'success',
        text: `✅ تم إرسال الرسالة بنجاح إلى ${totalSent} مجموعة من أصل ${jids.length} مجموعة محددة.`,
      });
      setBroadcastText('');
      setSelectedJids(new Set());

      setTimeout(() => {
        setIsBroadcastModalOpen(false);
        setBroadcastStatus(null);
      }, 2500);
    } catch (err: any) {
      setBroadcastStatus({
        type: 'error',
        text: 'حدث خطأ أثناء إرسال الرسالة: ' + (err.response?.data?.message || err.message),
      });
    } finally {
      setSendingBroadcast(false);
    }
  };

  const handleOpenSettings = (group: Group) => {
    setSelectedGroup(group);
    setFormSettings(
      group.settings || {
        moderationEnabled: true, deleteMessages: true, warnUsers: true, notifyAdmin: true,
        maxViolations: 3, autoAction: 'WARN', allowLinks: false,
        allowedDomains: 'youtube.com,facebook.com,instagram.com,twitter.com,x.com,github.com',
        allowAds: false, allowMentions: true, aiModeration: false,
      }
    );
    setIsModalOpen(true);
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGroup) return;
    try {
      setSavingSettings(true);
      await api.put(`/groups/${selectedGroup.id}/settings`, formSettings);
      setIsModalOpen(false);
      await fetchGroups();
    } catch (err) {
      console.error(err);
    } finally {
      setSavingSettings(false);
    }
  };

  const handleToggleGroup = async (group: Group) => {
    try {
      await api.patch(`/groups/${group.id}/status`, { isActive: !group.isActive });
      await fetchGroups();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white">إدارة مجموعات واتساب</h2>
          <p className="text-sm text-slate-400 mt-1">تخصيص سياسات المراقبة وإرسال رسائل وإعلانات لمجموعاتك</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => handleOpenBroadcast()}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white text-sm font-bold shadow-lg shadow-emerald-500/20 transition-all"
          >
            <Megaphone className="w-4 h-4" />
            <span>إرسال رسالة / إعلان</span>
          </button>
          <button
            onClick={fetchGroups}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors text-sm font-semibold"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {groups.map((group) => {
            const isModActive = group.settings?.moderationEnabled && group.isActive;
            return (
              <div key={group.id} className="glass-panel rounded-3xl p-6 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-slate-800 border border-slate-700/80 flex items-center justify-center text-emerald-400">
                        <Users className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="font-bold text-white text-base truncate max-w-[180px]" title={group.name}>{group.name}</h3>
                        <p className="text-xs text-slate-400 font-mono mt-0.5">{group.participantCount} عضو مراقب</p>
                      </div>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${isModActive ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-400'}`}>
                      {isModActive ? 'المراقبة نشطة' : 'متوقفة'}
                    </span>
                  </div>
                  <div className="mt-6 space-y-2 text-xs text-slate-400 border-t border-slate-800/80 pt-4">
                    <div className="flex justify-between"><span>حذف الرسائل المخالفة:</span><span className={group.settings?.deleteMessages ? 'text-emerald-400 font-semibold' : 'text-slate-500'}>{group.settings?.deleteMessages ? 'مفعّل' : 'معطّل'}</span></div>
                    <div className="flex justify-between"><span>السماح بالروابط:</span><span className={group.settings?.allowLinks ? 'text-emerald-400 font-semibold' : 'text-rose-400'}>{group.settings?.allowLinks ? 'مسموح' : 'ممنوع'}</span></div>
                    <div className="flex justify-between"><span>الحد الأقصى للمخالفات:</span><span className="text-white font-bold">{group.settings?.maxViolations || 3} مخالفات</span></div>
                    <div className="flex justify-between"><span>الإجراء التلقائي:</span><span className="text-amber-400 font-semibold">{group.settings?.autoAction || 'WARN'}</span></div>
                    <div className="flex justify-between"><span>إجمالي المخالفات:</span><span className="text-white font-bold">{group._count?.violations || 0}</span></div>
                  </div>
                </div>
                <div className="mt-6 pt-4 border-t border-slate-800/80 space-y-2">
                  <button onClick={() => handleOpenBroadcast(group.groupJid)} className="w-full py-2.5 px-4 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-xs font-bold transition-all flex items-center justify-center gap-2">
                    <MessageSquare className="w-4 h-4" />
                    <span>📩 إرسال رسالة مخصصة لهذا الكروب</span>
                  </button>
                  <div className="flex items-center gap-2">
                    <button onClick={() => handleOpenSettings(group)} className="flex-1 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700/80 text-white text-xs font-semibold transition-colors flex items-center justify-center gap-1.5">
                      <Settings2 className="w-3.5 h-3.5" /><span>الإعدادات</span>
                    </button>
                    <button onClick={() => handleToggleGroup(group)} className={`p-2 rounded-xl border transition-colors ${group.isActive ? 'bg-rose-500/10 border-rose-500/20 text-rose-400 hover:bg-rose-500/20' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20'}`}>
                      {group.isActive ? <X className="w-3.5 h-3.5" /> : <Check className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Broadcast Modal with Live Group Picker ── */}
      <Modal isOpen={isBroadcastModalOpen} onClose={() => setIsBroadcastModalOpen(false)} title="📩 إرسال رسالة إلى مجموعات واتساب" maxWidth="max-w-2xl">
        <form onSubmit={handleSendBroadcast} className="space-y-5 text-sm">

          {/* Connection status */}
          <div className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold border ${botConnected ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-amber-500/10 border-amber-500/20 text-amber-400'}`}>
            {botConnected ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
            <span>{botConnected ? `✅ البوت متصل عبر: ${botProvider}` : '⚠️ البوت غير متصل بواتساب حالياً — سيتم الإرسال إلى مجموعات قاعدة البيانات فقط'}</span>
          </div>

          {/* Live Group Picker */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-200">
                اختر المجموعات التي تريد الإرسال إليها:
              </label>
              <div className="flex items-center gap-2">
                <button type="button" onClick={fetchLiveGroups} className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-colors">
                  <RefreshCw className={`w-3 h-3 ${liveGroupsLoading ? 'animate-spin' : ''}`} />
                  <span>تحديث</span>
                </button>
                {liveGroups.length > 0 && (
                  <button type="button" onClick={toggleAll} className="px-2 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 text-xs font-bold transition-colors">
                    {selectedJids.size === liveGroups.length ? 'إلغاء الكل' : 'تحديد الكل'}
                  </button>
                )}
              </div>
            </div>

            <div className="max-h-52 overflow-y-auto space-y-2 p-1">
              {liveGroupsLoading ? (
                <div className="flex items-center justify-center py-8 gap-2 text-slate-400">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-xs">جاري جلب المجموعات من واتساب...</span>
                </div>
              ) : liveGroups.length === 0 ? (
                <div className="flex items-center gap-2 text-slate-400 py-6 justify-center text-xs">
                  <AlertCircle className="w-4 h-4" />
                  <span>لم يتم العثور على مجموعات. تأكد من أن البوت متصل ومضاف للكروبات.</span>
                </div>
              ) : (
                liveGroups.map((group) => {
                  const isSelected = selectedJids.has(group.jid);
                  return (
                    <label key={group.jid} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${isSelected ? 'bg-emerald-500/15 border-emerald-500/40' : 'bg-slate-900 border-slate-800 hover:border-slate-700'}`}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleJid(group.jid)}
                        className="w-4 h-4 accent-emerald-500 rounded flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className={`font-bold text-sm truncate ${isSelected ? 'text-emerald-300' : 'text-white'}`}>{group.name}</p>
                        <p className="text-xs text-slate-400">{group.participantsCount} عضو • {group.jid.split('@')[0]}</p>
                      </div>
                      {isSelected && <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />}
                    </label>
                  );
                })
              )}
            </div>

            {selectedJids.size > 0 && (
              <div className="mt-2 text-xs text-emerald-400 font-semibold">
                ✅ تم تحديد {selectedJids.size} مجموعة للإرسال
              </div>
            )}
          </div>

          {/* Message Text */}
          <div>
            <label className="block text-xs font-bold text-slate-200 mb-2">نص الرسالة:</label>
            <textarea
              rows={4}
              required
              value={broadcastText}
              onChange={(e) => setBroadcastText(e.target.value)}
              placeholder="اكتب هنا نص الرسالة أو الإعلان الذي تريد أن يرسله البوت إلى الكروبات المحددة..."
              className="w-full bg-slate-950 border border-slate-700 rounded-2xl p-4 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors leading-relaxed"
            />
          </div>

          {/* Status */}
          {broadcastStatus && (
            <div className={`p-3.5 rounded-xl border text-xs flex items-start gap-2 ${broadcastStatus.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-rose-500/10 border-rose-500/30 text-rose-400'}`}>
              {broadcastStatus.type === 'success' ? <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" /> : <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />}
              <span>{broadcastStatus.text}</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <button type="button" onClick={() => setIsBroadcastModalOpen(false)} className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold transition-colors">
              إلغاء
            </button>
            <button
              type="submit"
              disabled={sendingBroadcast || selectedJids.size === 0 || !broadcastText.trim()}
              className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-bold shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {sendingBroadcast ? (
                <><Loader2 className="w-4 h-4 animate-spin" /><span>جاري الإرسال...</span></>
              ) : (
                <><span>إرسال إلى {selectedJids.size > 0 ? `${selectedJids.size} كروب` : '...'}</span><Send className="w-4 h-4" /></>
              )}
            </button>
          </div>
        </form>
      </Modal>

      {/* Group Settings Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={`إعدادات المراقبة: ${selectedGroup?.name || ''}`} maxWidth="max-w-2xl">
        <form onSubmit={handleSaveSettings} className="space-y-6 text-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { label: 'تفعيل نظام المراقبة', key: 'moderationEnabled' },
              { label: 'حذف الرسائل المخالفة تلقائياً', key: 'deleteMessages' },
              { label: 'إرسال تحذير للعضو المخالف', key: 'warnUsers' },
              { label: 'إرسال تنبيه فوري للأدمن', key: 'notifyAdmin' },
              { label: 'السماح بنشر الروابط العامة', key: 'allowLinks' },
              { label: 'السماح بالإعلانات التجارية', key: 'allowAds' },
              { label: 'فحص الذكاء الاصطناعي (AI)', key: 'aiModeration' },
            ].map(({ label, key }) => (
              <label key={key} className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 cursor-pointer">
                <span className="font-semibold text-white">{label}</span>
                <input
                  type="checkbox"
                  checked={(formSettings as any)[key] || false}
                  onChange={(e) => setFormSettings({ ...formSettings, [key]: e.target.checked })}
                  className="w-4 h-4 accent-emerald-500 rounded"
                />
              </label>
            ))}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">الحد الأقصى للمخالفات</label>
              <input type="number" min={1} max={10} value={formSettings.maxViolations || 3}
                onChange={(e) => setFormSettings({ ...formSettings, maxViolations: parseInt(e.target.value, 10) })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">الإجراء التلقائي عند تجاوز الحد</label>
              <select value={formSettings.autoAction || 'WARN'}
                onChange={(e) => setFormSettings({ ...formSettings, autoAction: e.target.value as any })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500">
                <option value="WARN">تحذير نهائي (WARN)</option>
                <option value="MUTE">كتم العضو (MUTE)</option>
                <option value="KICK">طرد العضو (KICK)</option>
                <option value="NONE">لا شيء (NONE)</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">النطاقات المسموح بها (مفصولة بفاصلة)</label>
            <textarea rows={2} value={formSettings.allowedDomains || ''}
              onChange={(e) => setFormSettings({ ...formSettings, allowedDomains: e.target.value })}
              placeholder="youtube.com, facebook.com, instagram.com, github.com"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white font-mono text-xs focus:outline-none focus:border-emerald-500" />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold transition-colors">إلغاء</button>
            <button type="submit" disabled={savingSettings} className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-bold shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50">
              {savingSettings ? 'جاري الحفظ...' : 'حفظ الإعدادات'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
