import { describe, it, expect } from 'vitest';
import { AdsDetector } from '../src/moderation/ads-detector.js';

describe('AdsDetector Suite', () => {
  it('should detect promotional and advertisement phrases', () => {
    const text = 'خصم خاص لفترة محدودة على جميع المنتجات للطلب والاستفسار';
    const phrases = AdsDetector.detectAdPhrases(text);
    expect(phrases.length).toBeGreaterThan(0);
    expect(phrases).toContain('خصم خاص');
  });

  it('should extract Saudi and international phone numbers', () => {
    const text = 'للتواصل يرجى الاتصال على 0501234567 أو +966512345678';
    const phones = AdsDetector.extractPhoneNumbers(text);
    expect(phones.length).toBeGreaterThanOrEqual(1);
  });

  it('should flag commercial spam messages when allowAds is false', () => {
    const text = 'فرصة عمل من المنزل وربح يومي مضمون، تواصل واتساب على الرقم 0501234567';
    const result = AdsDetector.checkMessage(text, false);
    expect(result.isAd).toBe(true);
    expect(result.detectedAdPhrases.length).toBeGreaterThan(0);
  });

  it('should allow clean conversational messages', () => {
    const text = 'السلام عليكم يا شباب، متى يبدأ اجتماع العمل اليوم؟';
    const result = AdsDetector.checkMessage(text, false);
    expect(result.isAd).toBe(false);
  });
});
