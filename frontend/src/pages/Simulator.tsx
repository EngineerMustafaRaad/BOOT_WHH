import React, { useState, useEffect } from 'react';
import { PlaySquare, Send, Sparkles, AlertTriangle, ShieldCheck, Trash2, ArrowRight, CheckCircle2 } from 'lucide-react';
import { api } from '../services/api.js';
import { CategoryBadge, SeverityBadge } from '../components/Badge.js';
import { SimulatorLog } from '../types/index.js';

export const Simulator: React.FC = () => {
  const [inputText, setInputText] = useState('السلام عليكم، هل يوجد سبام_تجريبي هنا؟');
  const [senderName, setSenderName] = useState('سارة أحمد');
  const [senderPhone, setSenderPhone] = useState('+966500000002');
  const [isAdmin, setIsAdmin] = useState(false);
  const [testing, setTesting] = useState(false);

  const [evaluationResult, setEvaluationResult] = useState<any>(null);
  const [logs, setLogs] = useState<SimulatorLog[]>([]);

  const fetchLogs = async () => {
    try {
      const res = await api.get('/simulator/logs');
      if (res.data.success) {
        setLogs(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch simulator logs', err);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleSimulate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    try {
      setTesting(true);
      const res = await api.post('/simulator/message', {
        text: inputText,
        senderName,
        senderPhone,
        isAdmin,
      });

      setEvaluationResult(res.data);
      await fetchLogs();
    } catch (err) {
      console.error('Simulation error', err);
    } finally {
      setTesting(false);
    }
  };

  const handleClearLogs = async () => {
    try {
      await api.delete('/simulator/logs');
      setLogs([]);
    } catch (err) {
      console.error('Failed to clear logs', err);
    }
  };

  const samplePresets = [
    { title: 'رسالة عادية ونظيفة', text: 'السلام عليكم ورحمة الله وبركاته، ما هي مواعيد الدورة القادمة؟', admin: false },
    { title: 'كلمة ممنوعة مع تشكيل وتطويل', text: 'أهلاً بك، تجربة سَبــــام_تجريبِي مع حركات وتطويل', admin: false },
    { title: 'رابط غير مسموح به', text: 'انضموا لقناتنا على الرابط التالي https://fake-scam-channel.xyz/join', admin: false },
    { title: 'إعلان تجاري ورقم هاتف', text: 'عرض حصري وخصومات هائلة لفترة محدودة، تواصل واتساب على 0501234567 للطلب', admin: false },
    { title: 'أمر إداري: عرض القوانين', text: '!rules', admin: true },
    { title: 'أمر إداري: فحص الحالة', text: '!status', admin: true },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div>
        <h2 className="text-xl font-bold text-white">محاكي الرسائل الحي (Interactive Simulator)</h2>
        <p className="text-sm text-slate-400 mt-1">
          اختبر دقة محرك القواعد وتطبيع النصوص العربية وردود الأفعال الآلية للرسائل والأوامر بشكل حي
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Form & Presets */}
        <div className="lg:col-span-7 space-y-6">
          <div className="glass-panel rounded-3xl p-6 border border-slate-800">
            <h3 className="font-bold text-white text-base mb-4 flex items-center gap-2">
              <PlaySquare className="w-5 h-5 text-emerald-400" />
              <span>إرسال رسالة تجريبية إلى المجموعة</span>
            </h3>

            <form onSubmit={handleSimulate} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">نص الرسالة</label>
                <textarea
                  rows={3}
                  required
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="اكتب أي نص أو عبارة أو أمر إداري لاختباره..."
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-2xl p-4 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-2">اسم المرسل</label>
                  <input
                    type="text"
                    value={senderName}
                    onChange={(e) => setSenderName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-2">رقم هاتف المرسل</label>
                  <input
                    type="text"
                    value={senderPhone}
                    onChange={(e) => setSenderPhone(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white font-mono text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isAdmin}
                    onChange={(e) => setIsAdmin(e.target.checked)}
                    className="w-4 h-4 accent-emerald-500 rounded"
                  />
                  <span className="text-white text-xs font-semibold">محاكاة إرسال الرسالة من مشرف (Admin)</span>
                </label>

                <button
                  type="submit"
                  disabled={testing}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold text-sm shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  {testing ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>اختبار الرسالة</span>
                      <Send className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Quick Presets */}
            <div className="mt-6 pt-6 border-t border-slate-800">
              <p className="text-xs font-bold text-slate-400 mb-3">نماذج اختبار سريعة:</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {samplePresets.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setInputText(preset.text);
                      setIsAdmin(preset.admin);
                    }}
                    className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-emerald-500/40 text-right text-xs transition-colors group"
                  >
                    <p className="font-semibold text-slate-200 group-hover:text-emerald-400">{preset.title}</p>
                    <p className="text-[11px] text-slate-400 truncate mt-0.5">{preset.text}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Real-Time Arabic Normalization & Evaluation Breakdown */}
          {evaluationResult && (
            <div className="glass-panel rounded-3xl p-6 border border-slate-800 space-y-4 animate-in fade-in zoom-in-95 duration-200">
              <h4 className="font-bold text-white text-sm flex items-center gap-2 pb-3 border-b border-slate-800">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <span>نتيجة تحليل ومعالجة الرسالة الفورية:</span>
              </h4>

              <div className="space-y-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-slate-400 block mb-1">النص بعد معالجة وتطبيع اللغة العربية (Normalized):</span>
                  <span className="text-emerald-300 font-mono font-semibold">{evaluationResult.normalizedText}</span>
                </div>

                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">حالة الرسالة:</span>
                    <span
                      className={`px-3 py-1 rounded-full font-bold text-xs ${
                        evaluationResult.evaluation?.isViolation
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      }`}
                    >
                      {evaluationResult.evaluation?.isViolation ? '🚨 تم رصد مخالفة' : '✅ رسالة نظيفة ومصرح بها'}
                    </span>
                  </div>

                  {evaluationResult.evaluation?.isViolation && (
                    <>
                      <div className="flex justify-between items-center pt-2">
                        <span className="text-slate-400">القاعدة المتطابقة:</span>
                        <span className="text-amber-400 font-bold">{evaluationResult.evaluation.ruleMatched}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">التصنيف والخطورة:</span>
                        <div className="flex gap-2">
                          <CategoryBadge category={evaluationResult.evaluation.category} />
                          <SeverityBadge severity={evaluationResult.evaluation.severity} />
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">الإجراء المطلوب:</span>
                        <span className="text-rose-400 font-bold">{evaluationResult.evaluation.actionRequired}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">المصدر:</span>
                        <span className="text-slate-300 font-mono">{evaluationResult.evaluation.source}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Live Simulated WhatsApp Activity Stream */}
        <div className="lg:col-span-5 space-y-4">
          <div className="glass-panel rounded-3xl p-6 border border-slate-800 h-[650px] flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div>
                <h3 className="font-bold text-white text-base">سجل أحداث المحاكي الحي</h3>
                <p className="text-xs text-slate-400">عرض الرسائل، الحذف، والتحذيرات الصادرة</p>
              </div>
              <button
                onClick={handleClearLogs}
                title="مسح السجل"
                className="p-2 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-rose-500/10 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-3">
              {logs.length > 0 ? (
                logs.map((log) => {
                  const isIncoming = log.type === 'INCOMING';
                  const isDeleted = log.type === 'DELETED';
                  const isKicked = log.type === 'KICKED';

                  return (
                    <div
                      key={log.id}
                      className={`p-3.5 rounded-2xl border text-xs leading-relaxed transition-all ${
                        isIncoming
                          ? 'bg-slate-950/70 border-slate-800 text-slate-200'
                          : isDeleted
                          ? 'bg-rose-950/40 border-rose-500/30 text-rose-300'
                          : isKicked
                          ? 'bg-red-950/60 border-red-500/40 text-red-300'
                          : 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5 opacity-75 text-[10px]">
                        <span className="font-bold tracking-wide">
                          {isIncoming ? '📥 رسالة واردة' : isDeleted ? '🗑️ إجراء حذف' : isKicked ? '🚫 طرد عضو' : '🤖 رد آلي من البوت'}
                        </span>
                        <span className="font-mono">
                          {new Date(log.timestamp).toLocaleTimeString('ar-EG', {
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                          })}
                        </span>
                      </div>
                      <p className="font-mono whitespace-pre-wrap">{log.content}</p>
                    </div>
                  );
                })
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center text-slate-500 py-12">
                  <PlaySquare className="w-12 h-12 stroke-1 mb-2 opacity-40" />
                  <p className="text-sm">لا توجد رسائل مسجلة في المحاكي بعد.</p>
                  <p className="text-xs text-slate-400 mt-1">اكتب رسالة تجريبية واضغط على زر الاختبار.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
