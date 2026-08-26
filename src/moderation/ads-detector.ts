import { ArabicNormalizer } from '../utils/arabic-normalizer.js';

export interface AdsCheckResult {
  isAd: boolean;
  detectedPhoneNumbers: string[];
  detectedAdPhrases: string[];
  reason?: string;
}

// Common Arabic and English promotional phrases (normalized)
const AD_PHRASES = [
  'تواصل واتساب',
  'تواصل خاص',
  'للطلب والاستفسار',
  'للطلب خاص',
  'خصم خاص',
  'خصومات هائله',
  'عرض خاص',
  'عرض حصري',
  'لفتره محدوده',
  'اربح معنا',
  'فرصه عمل من المنزل',
  'ربح يومي مضمون',
  'زياده متابعين',
  'رشق متابعين',
  'خدمات تسويقيه',
  'سعر مغري',
  'اسعار لا تقبل المنافسه',
  'شحن مجاني',
  'دفع عند الاستلام',
  'dm for promo',
  'click the link in bio',
  'join my telegram channel',
  'earn daily income',
  'crypto signals',
  'free followers',
];

// Phone number regex patterns (International, Gulf, Egypt, Levant)
const PHONE_NUMBER_PATTERN = /(?:\+?[\d\s-]{10,16}|\b05\d{8}\b|\b01[0125]\d{8}\b|\b\+?9665\d{8}\b|\b\+?201[0125]\d{8}\b|\b\+?9715\d{8}\b|\b\+?965\d{8}\b)/g;

export class AdsDetector {
  /**
   * Extracts phone numbers found in the text
   */
  public static extractPhoneNumbers(text: string): string[] {
    if (!text) return [];
    // Normalize Eastern Arabic numerals (٠-٩) to standard ASCII digits (0-9)
    const normalizedDigits = text.replace(/[\u0660-\u0669]/g, (d) =>
      (d.charCodeAt(0) - 0x0660).toString()
    );

    const matches = normalizedDigits.match(PHONE_NUMBER_PATTERN);
    if (!matches) return [];

    // Filter out short sequences that aren't phone numbers
    return Array.from(
      new Set(
        matches
          .map((p) => p.replace(/[\s-]/g, ''))
          .filter((p) => p.length >= 9 && p.length <= 15)
      )
    );
  }

  /**
   * Detects promotional keywords and phrases
   */
  public static detectAdPhrases(text: string): string[] {
    const normalizedText = ArabicNormalizer.normalize(text);
    const matched: string[] = [];

    for (const phrase of AD_PHRASES) {
      const normalizedPhrase = ArabicNormalizer.normalize(phrase);
      if (normalizedText.includes(normalizedPhrase)) {
        matched.push(phrase);
      }
    }

    return matched;
  }

  /**
   * Evaluates if a message is an advertisement
   */
  public static checkMessage(text: string, allowAds: boolean): AdsCheckResult {
    if (allowAds) {
      return {
        isAd: false,
        detectedPhoneNumbers: [],
        detectedAdPhrases: [],
      };
    }

    const phones = this.extractPhoneNumbers(text);
    const phrases = this.detectAdPhrases(text);

    // Heuristics:
    // 1. If it contains ad phrases AND a phone number -> high confidence Ad
    // 2. If it contains known spam/marketing phrases -> Ad
    // 3. If multiple phone numbers are posted with commercial terms -> Ad
    const hasMarketingPhrases = phrases.length > 0;
    const hasDirectContact = phones.length > 0;

    const isAd = hasMarketingPhrases || (hasDirectContact && (hasMarketingPhrases || text.length > 60));

    let reason: string | undefined;
    if (hasMarketingPhrases && hasDirectContact) {
      reason = `إعلان تجاري صريح يحتوي على عبارات ترويجية (${phrases.join(', ')}) ورقم اتصال (${phones.join(', ')})`;
    } else if (hasMarketingPhrases) {
      reason = `رسالة تسويقية تحتوي على عبارات إعلانية: ${phrases.join(', ')}`;
    } else if (hasDirectContact) {
      reason = `نشر أرقام هواتف للتواصل: ${phones.join(', ')}`;
    }

    return {
      isAd,
      detectedPhoneNumbers: phones,
      detectedAdPhrases: phrases,
      reason,
    };
  }
}
