import React from 'react';
import { Category, Severity } from '../types/index.js';

export const CategoryBadge: React.FC<{ category: Category }> = ({ category }) => {
  const map: Record<Category, { label: string; bg: string; text: string }> = {
    SPAM: { label: 'سبام / احتيال', bg: 'bg-amber-500/10 border-amber-500/20', text: 'text-amber-400' },
    INSULT: { label: 'شتائم / سب', bg: 'bg-rose-500/10 border-rose-500/20', text: 'text-rose-400' },
    ADVERTISEMENT: { label: 'إعلانات تجارية', bg: 'bg-blue-500/10 border-blue-500/20', text: 'text-blue-400' },
    PROFANITY: { label: 'ألفاظ خادشة', bg: 'bg-purple-500/10 border-purple-500/20', text: 'text-purple-400' },
    HARASSMENT: { label: 'تحرش / تنمر', bg: 'bg-red-500/10 border-red-500/20', text: 'text-red-400' },
    CUSTOM: { label: 'مخصص', bg: 'bg-slate-500/10 border-slate-500/20', text: 'text-slate-400' },
  };

  const item = map[category] || map.CUSTOM;

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${item.bg} ${item.text}`}>
      {item.label}
    </span>
  );
};

export const SeverityBadge: React.FC<{ severity: Severity }> = ({ severity }) => {
  const map: Record<Severity, { label: string; bg: string; text: string }> = {
    LOW: { label: 'منخفض', bg: 'bg-emerald-500/10 border-emerald-500/20', text: 'text-emerald-400' },
    MEDIUM: { label: 'متوسط', bg: 'bg-yellow-500/10 border-yellow-500/20', text: 'text-yellow-400' },
    HIGH: { label: 'عالي', bg: 'bg-orange-500/10 border-orange-500/20', text: 'text-orange-400' },
    CRITICAL: { label: 'شديد الخطورة', bg: 'bg-red-600/20 border-red-600/30', text: 'text-red-400 animate-pulse' },
  };

  const item = map[severity] || map.MEDIUM;

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${item.bg} ${item.text}`}>
      {item.label}
    </span>
  );
};
