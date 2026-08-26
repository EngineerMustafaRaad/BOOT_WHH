import { describe, it, expect } from 'vitest';
import { ArabicNormalizer } from '../src/utils/arabic-normalizer.js';

describe('ArabicNormalizer Suite', () => {
  it('should normalize Alef variations (أ, إ, آ, ٱ -> ا)', () => {
    expect(ArabicNormalizer.normalize('أحمد')).toBe('احمد');
    expect(ArabicNormalizer.normalize('إبراهيم')).toBe('ابراهيم');
    expect(ArabicNormalizer.normalize('آدم')).toBe('ادم');
    expect(ArabicNormalizer.normalize('ٱستغفار')).toBe('استغفار');
  });

  it('should normalize Ta Marbuta and Haa (ة -> ه)', () => {
    expect(ArabicNormalizer.normalize('مدرسة')).toBe('مدرسه');
    expect(ArabicNormalizer.normalize('فتاة')).toBe('فتاه');
  });

  it('should normalize Ya and Alef Maksura (ى, ئ -> ي)', () => {
    expect(ArabicNormalizer.normalize('مستشفى')).toBe('مستشفي');
    expect(ArabicNormalizer.normalize('شاطئ')).toBe('شاطي');
  });

  it('should strip Tashkeel and Harakat completely', () => {
    const input = 'مُحَمَّدٌ رَسُولُ اللَّهِ';
    const output = ArabicNormalizer.normalize(input);
    expect(output).toBe('محمد رسول الله');
  });

  it('should strip Tatweel (Kashida ـ)', () => {
    const input = 'ســـــبـــــام';
    const output = ArabicNormalizer.normalize(input);
    expect(output).toBe('سبام');
  });

  it('should remove zero-width and invisible characters', () => {
    const input = 'س\u200Bب\u200Cا\u200Dم';
    const output = ArabicNormalizer.normalize(input);
    expect(output).toBe('سبام');
  });

  it('should reduce excess character repetitions', () => {
    expect(ArabicNormalizer.normalize('هههههههههههه')).toBe('هه');
    expect(ArabicNormalizer.normalize('وااااااو')).toBe('وااو');
  });

  it('should match forbidden phrases with boundary awareness', () => {
    const text = 'السلام عليكم ورحمة الله، هذا سبام_تجريبي واضح للجميع';
    expect(ArabicNormalizer.containsPhrase(text, 'سبام_تجريبي')).toBe(true);
    expect(ArabicNormalizer.containsPhrase(text, 'كلمة_غير_موجودة')).toBe(false);
  });
});
