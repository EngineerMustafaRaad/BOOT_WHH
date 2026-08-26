import React, { useEffect, useState, useRef } from 'react';
import { ShieldAlert, Plus, Search, Trash2, Edit2, CheckCircle, XCircle, ShieldCheck, Upload, FileText, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { api } from '../services/api.js';
import { ForbiddenWord, WordException, Category, Severity } from '../types/index.js';
import { Modal } from '../components/Modal.js';
import { CategoryBadge, SeverityBadge } from '../components/Badge.js';

export const ForbiddenWords: React.FC = () => {
  const [words, setWords] = useState<ForbiddenWord[]>([]);
  const [exceptions, setExceptions] = useState<WordException[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [activeSubTab, setActiveSubTab] = useState<'words' | 'exceptions'>('words');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingWord, setEditingWord] = useState<ForbiddenWord | null>(null);
  const [formData, setFormData] = useState({
    word: '',
    category: 'CUSTOM' as Category,
    severity: 'MEDIUM' as Severity,
    enabled: true,
    isRegex: false,
  });

  // Exception Modal State
  const [isExcModalOpen, setIsExcModalOpen] = useState(false);
  const [excFormData, setExcFormData] = useState({ word: '', reason: '' });

  // File Import State
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importAction, setImportAction] = useState<'WARN' | 'DELETE' | 'KICK'>('WARN');
  const [importCategory, setImportCategory] = useState<Category>('CUSTOM');
  const [importLoading, setImportLoading] = useState(false);
  const [importResult, setImportResult] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchWords = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (search) params.search = search;
      if (selectedCategory) params.category = selectedCategory;

      const [wordsRes, excRes] = await Promise.all([
        api.get('/words', { params }),
        api.get('/words/exceptions/list'),
      ]);

      if (wordsRes.data.success) setWords(wordsRes.data.data);
      if (excRes.data.success) setExceptions(excRes.data.data);
    } catch (err) {
      console.error('Failed to fetch words', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWords();
  }, [search, selectedCategory]);

  const handleOpenAddModal = () => {
    setEditingWord(null);
    setFormData({
      word: '',
      category: 'CUSTOM',
      severity: 'MEDIUM',
      enabled: true,
      isRegex: false,
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (word: ForbiddenWord) => {
    setEditingWord(word);
    setFormData({
      word: word.word,
      category: word.category,
      severity: word.severity,
      enabled: word.enabled,
      isRegex: word.isRegex,
    });
    setIsModalOpen(true);
  };

  const handleSaveWord = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingWord) {
        await api.put(`/words/${editingWord.id}`, formData);
      } else {
        await api.post('/words', formData);
      }
      setIsModalOpen(false);
      await fetchWords();
    } catch (err) {
      console.error('Failed to save word', err);
    }
  };

  const handleDeleteWord = async (id: string) => {
    if (!window.confirm('هل أنت متأكد من رغبتك في حذف هذه الكلمة؟')) return;
    try {
      await api.delete(`/words/${id}`);
      await fetchWords();
    } catch (err) {
      console.error('Failed to delete word', err);
    }
  };

  const handleToggleEnabled = async (word: ForbiddenWord) => {
    try {
      await api.put(`/words/${word.id}`, { enabled: !word.enabled });
      await fetchWords();
    } catch (err) {
      console.error('Failed to toggle word status', err);
    }
  };

  const handleSaveException = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/words/exceptions', excFormData);
      setIsExcModalOpen(false);
      setExcFormData({ word: '', reason: '' });
      await fetchWords();
    } catch (err) {
      console.error('Failed to save exception', err);
    }
  };

  // ── File Import Handler ────────────────────────────────────────────────────
  const handleImportFile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importFile) return;
    try {
      setImportLoading(true);
      setImportResult(null);
      const formData = new FormData();
      formData.append('file', importFile);
      formData.append('action', importAction);
      formData.append('category', importCategory);
      const res = await api.post('/words/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setImportResult({ type: 'success', message: res.data.message });
      setImportFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      await fetchWords();
      setTimeout(() => { setIsImportModalOpen(false); setImportResult(null); }, 2500);
    } catch (err: any) {
      setImportResult({ type: 'error', message: err.response?.data?.message || 'فشل رفع الملف، تأكد من صحة الصيغة' });
    } finally {
      setImportLoading(false);
    }
  };

  const handleDeleteException = async (id: string) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا الاستثناء؟')) return;
    try {
      await api.delete(`/words/exceptions/${id}`);
      await fetchWords();
    } catch (err) {
      console.error('Failed to delete exception', err);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white">قائمة الكلمات والعبارات الممنوعة</h2>
          <p className="text-sm text-slate-400 mt-1">
            إدارة الكلمات المحظورة، تصنيفاتها، مستويات الخطورة، والاستثناءات المعتمدة
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsExcModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold transition-colors"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>إضافة استثناء</span>
          </button>
          <button
            onClick={() => { setImportFile(null); setImportResult(null); setIsImportModalOpen(true); }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-violet-500/20 hover:bg-violet-500/30 border border-violet-500/30 text-violet-300 text-sm font-bold transition-all"
          >
            <Upload className="w-4 h-4" />
            <span>استيراد ملف</span>
          </button>
          <button
            onClick={handleOpenAddModal}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-bold shadow-lg shadow-emerald-500/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة كلمة ممنوعة</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-4 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveSubTab('words')}
          className={`pb-2 px-3 font-semibold text-sm transition-colors relative ${
            activeSubTab === 'words' ? 'text-emerald-400 border-b-2 border-emerald-400' : 'text-slate-400 hover:text-white'
          }`}
        >
          الكلمات الممنوعة ({words.length})
        </button>
        <button
          onClick={() => setActiveSubTab('exceptions')}
          className={`pb-2 px-3 font-semibold text-sm transition-colors relative ${
            activeSubTab === 'exceptions' ? 'text-emerald-400 border-b-2 border-emerald-400' : 'text-slate-400 hover:text-white'
          }`}
        >
          الاستثناءات المصرح بها ({exceptions.length})
        </button>
      </div>

      {activeSubTab === 'words' ? (
        <>
          {/* Filters Bar */}
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="relative flex-1 w-full">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="بحث في الكلمات الممنوعة..."
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 pr-10 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
              <Search className="w-4 h-4 text-slate-500 absolute top-3.5 right-3.5" />
            </div>

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full sm:w-56 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
            >
              <option value="">جميع التصنيفات</option>
              <option value="SPAM">سبام / احتيال</option>
              <option value="INSULT">شتائم وسب</option>
              <option value="ADVERTISEMENT">إعلانات تجارية</option>
              <option value="PROFANITY">ألفاظ خادشة</option>
              <option value="HARASSMENT">تحرش وتنمر</option>
              <option value="CUSTOM">مخصص</option>
            </select>
          </div>

          {/* Words Table */}
          <div className="glass-panel rounded-3xl p-6 border border-slate-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-sm">
                <thead>
                  <tr className="text-xs font-semibold text-slate-400 border-b border-slate-800">
                    <th className="pb-3 pr-2">الكلمة / العبارة</th>
                    <th className="pb-3">النص بعد التطبيع (Normalized)</th>
                    <th className="pb-3">التصنيف</th>
                    <th className="pb-3">الخطورة</th>
                    <th className="pb-3">الحالة</th>
                    <th className="pb-3 pl-2 text-center">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {words.length > 0 ? (
                    words.map((word) => (
                      <tr key={word.id} className="hover:bg-slate-900/40 transition-colors">
                        <td className="py-3.5 pr-2 font-bold text-white">{word.word}</td>
                        <td className="py-3.5 text-slate-400 font-mono text-xs">{word.normalizedWord}</td>
                        <td className="py-3.5">
                          <CategoryBadge category={word.category} />
                        </td>
                        <td className="py-3.5">
                          <SeverityBadge severity={word.severity} />
                        </td>
                        <td className="py-3.5">
                          <button
                            onClick={() => handleToggleEnabled(word)}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition-colors ${
                              word.enabled
                                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20'
                                : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-750'
                            }`}
                          >
                            {word.enabled ? <CheckCircle className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                            <span>{word.enabled ? 'مفعّلة' : 'معطّلة'}</span>
                          </button>
                        </td>
                        <td className="py-3.5 pl-2 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleOpenEditModal(word)}
                              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteWord(word.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-rose-500/10 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-500">
                        {loading ? 'جاري التحميل...' : 'لا توجد كلمات مطابقة للبحث.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        /* Exceptions List */
        <div className="glass-panel rounded-3xl p-6 border border-slate-800">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead>
                <tr className="text-xs font-semibold text-slate-400 border-b border-slate-800">
                  <th className="pb-3 pr-2">العبارة المستثناة المصرح بها</th>
                  <th className="pb-3">السبب / الملاحظة</th>
                  <th className="pb-3 pl-2 text-center">حذف</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {exceptions.length > 0 ? (
                  exceptions.map((exc) => (
                    <tr key={exc.id} className="hover:bg-slate-900/40 transition-colors">
                      <td className="py-3.5 pr-2 font-bold text-white">{exc.word}</td>
                      <td className="py-3.5 text-slate-400">{exc.reason || 'لا يوجد سبب محدد'}</td>
                      <td className="py-3.5 pl-2 text-center">
                        <button
                          onClick={() => handleDeleteException(exc.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-rose-500/10 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="py-8 text-center text-slate-500">
                      لا توجد استثناءات مضافة بعد.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Word Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingWord ? 'تعديل كلمة ممنوعة' : 'إضافة كلمة أو عبارة ممنوعة'}
      >
        <form onSubmit={handleSaveWord} className="space-y-4 text-sm">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">الكلمة أو العبارة</label>
            <input
              type="text"
              required
              value={formData.word}
              onChange={(e) => setFormData({ ...formData, word: e.target.value })}
              placeholder="اكتب الكلمة أو العبارة هنا..."
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">التصنيف (Category)</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value as Category })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="SPAM">سبام / احتيال (SPAM)</option>
                <option value="INSULT">شتائم وسب (INSULT)</option>
                <option value="ADVERTISEMENT">إعلانات تجارية (ADVERTISEMENT)</option>
                <option value="PROFANITY">ألفاظ خادشة (PROFANITY)</option>
                <option value="HARASSMENT">تحرش وتنمر (HARASSMENT)</option>
                <option value="CUSTOM">مخصص (CUSTOM)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">مستوى الخطورة (Severity)</label>
              <select
                value={formData.severity}
                onChange={(e) => setFormData({ ...formData, severity: e.target.value as Severity })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="LOW">منخفض (تحذير فقط)</option>
                <option value="MEDIUM">متوسط (حذف + تحذير)</option>
                <option value="HIGH">عالي (حذف فوري)</option>
                <option value="CRITICAL">شديد الخطورة (حذف + طرد)</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-6 pt-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.enabled}
                onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
                className="w-4 h-4 accent-emerald-500 rounded"
              />
              <span className="text-white text-xs font-semibold">تفعيل الكلمة فوراً</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isRegex}
                onChange={(e) => setFormData({ ...formData, isRegex: e.target.checked })}
                className="w-4 h-4 accent-emerald-500 rounded"
              />
              <span className="text-white text-xs font-semibold">تعبير نمطي (Regex)</span>
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold transition-colors"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-bold shadow-lg shadow-emerald-500/20 transition-all"
            >
              {editingWord ? 'تحديث الكلمة' : 'إضافة إلى القائمة'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Add Exception Modal */}
      <Modal
        isOpen={isExcModalOpen}
        onClose={() => setIsExcModalOpen(false)}
        title="إضافة عبارة مستثناة مصرح بها"
      >
        <form onSubmit={handleSaveException} className="space-y-4 text-sm">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">العبارة المستثناة</label>
            <input
              type="text"
              required
              value={excFormData.word}
              onChange={(e) => setExcFormData({ ...excFormData, word: e.target.value })}
              placeholder="مثال: إعلان رسمي من الإدارة"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">سبب الاستثناء (اختياري)</label>
            <input
              type="text"
              value={excFormData.reason}
              onChange={(e) => setExcFormData({ ...excFormData, reason: e.target.value })}
              placeholder="مثال: بيانات الإدارة الرسمية"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsExcModalOpen(false)}
              className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold transition-colors"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-bold shadow-lg shadow-emerald-500/20 transition-all"
            >
              حفظ الاستثناء
            </button>
          </div>
        </form>
      </Modal>

      {/* ── Import File Modal ── */}
      <Modal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        title="📂 استيراد قائمة كلمات ممنوعة من ملف"
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleImportFile} className="space-y-5 text-sm">

          {/* Info */}
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 text-xs text-slate-400 space-y-1.5">
            <p className="font-semibold text-slate-200 text-sm">📋 تعليمات الملف:</p>
            <p>• ملف <strong>.txt</strong>: ضع كل كلمة في سطر منفصل</p>
            <p>• ملف <strong>.csv</strong>: ضع الكلمات مفصولة بفاصلة أو كل كلمة في سطر</p>
            <p>• الكلمات المكررة يتم تخطيها تلقائياً</p>
            <p>• الحد الأقصى لحجم الملف: <strong>2MB</strong></p>
          </div>

          {/* File Picker */}
          <div>
            <label className="block text-xs font-bold text-slate-200 mb-2">اختر الملف:</label>
            <label className={`flex flex-col items-center justify-center gap-2 p-6 rounded-2xl border-2 border-dashed cursor-pointer transition-all ${
              importFile ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-slate-700 bg-slate-900/50 hover:border-violet-500/50 hover:bg-violet-500/5'
            }`}>
              <input
                ref={fileInputRef}
                type="file"
                accept=".txt,.csv"
                className="hidden"
                onChange={(e) => setImportFile(e.target.files?.[0] || null)}
              />
              {importFile ? (
                <>
                  <FileText className="w-8 h-8 text-emerald-400" />
                  <span className="text-emerald-300 font-bold text-sm">{importFile.name}</span>
                  <span className="text-slate-400 text-xs">{(importFile.size / 1024).toFixed(1)} KB</span>
                </>
              ) : (
                <>
                  <Upload className="w-8 h-8 text-slate-500" />
                  <span className="text-slate-400 text-sm">اسحب الملف هنا أو اضغط للاختيار</span>
                  <span className="text-slate-600 text-xs">.txt أو .csv فقط</span>
                </>
              )}
            </label>
          </div>

          {/* Action Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-200 mb-3">الإجراء عند الاكتشاف:</label>
            <div className="grid grid-cols-3 gap-3">
              {([
                { value: 'WARN', label: 'تحذير', icon: '⚠️', desc: 'يرسل تحذير للعضو', color: 'amber' },
                { value: 'DELETE', label: 'حذف', icon: '🗑️', desc: 'يحذف الرسالة فوراً', color: 'rose' },
                { value: 'KICK', label: 'طرد', icon: '🚫', desc: 'يطرد العضو تلقائياً', color: 'red' },
              ] as const).map((opt) => (
                <label key={opt.value} className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition-all text-center ${
                  importAction === opt.value
                    ? opt.color === 'amber' ? 'border-amber-500/60 bg-amber-500/10'
                      : opt.color === 'rose' ? 'border-rose-500/60 bg-rose-500/10'
                      : 'border-red-600/60 bg-red-600/10'
                    : 'border-slate-800 bg-slate-900/50 hover:border-slate-700'
                }`}>
                  <input
                    type="radio"
                    name="importAction"
                    value={opt.value}
                    checked={importAction === opt.value}
                    onChange={() => setImportAction(opt.value)}
                    className="sr-only"
                  />
                  <span className="text-2xl">{opt.icon}</span>
                  <span className={`font-bold text-sm ${
                    importAction === opt.value
                      ? opt.color === 'amber' ? 'text-amber-300' : opt.color === 'rose' ? 'text-rose-300' : 'text-red-300'
                      : 'text-white'
                  }`}>{opt.label}</span>
                  <span className="text-slate-400 text-[10px] leading-tight">{opt.desc}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Category Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-200 mb-2">تصنيف الكلمات:</label>
            <select
              value={importCategory}
              onChange={(e) => setImportCategory(e.target.value as Category)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-violet-500"
            >
              <option value="CUSTOM">مخصص (CUSTOM)</option>
              <option value="SPAM">سبام (SPAM)</option>
              <option value="INSULT">إهانة (INSULT)</option>
              <option value="ADVERTISEMENT">إعلانات (ADVERTISEMENT)</option>
              <option value="PROFANITY">ألفاظ نابية (PROFANITY)</option>
              <option value="HARASSMENT">تحرش / مضايقة (HARASSMENT)</option>
            </select>
          </div>

          {/* Result */}
          {importResult && (
            <div className={`p-3.5 rounded-xl border text-xs flex items-start gap-2 ${
              importResult.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
            }`}>
              {importResult.type === 'success'
                ? <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
                : <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />}
              <span>{importResult.message}</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <button type="button" onClick={() => setIsImportModalOpen(false)}
              className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold transition-colors">
              إلغاء
            </button>
            <button
              type="submit"
              disabled={!importFile || importLoading}
              className="px-6 py-2.5 rounded-xl bg-violet-500 hover:bg-violet-600 text-white text-sm font-bold shadow-lg shadow-violet-500/20 transition-all flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {importLoading
                ? <><Loader2 className="w-4 h-4 animate-spin" /><span>جاري الاستيراد...</span></>
                : <><Upload className="w-4 h-4" /><span>استيراد الكلمات</span></>}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
