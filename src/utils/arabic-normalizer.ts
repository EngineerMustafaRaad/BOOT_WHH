/**
 * Arabic Text Normalization Utility
 * Handles complex Arabic orthography variations, diacritics, tatweel, and zero-width characters.
 */

export interface NormalizationOptions {
  removeTashkeel?: boolean;
  removeTatweel?: boolean;
  normalizeAlef?: boolean;
  normalizeTaMarbuta?: boolean;
  normalizeYa?: boolean;
  normalizeWaw?: boolean;
  reduceRepetitions?: boolean;
  removeZeroWidth?: boolean;
  removePunctuation?: boolean;
}

const DEFAULT_OPTIONS: NormalizationOptions = {
  removeTashkeel: true,
  removeTatweel: true,
  normalizeAlef: true,
  normalizeTaMarbuta: true,
  normalizeYa: true,
  normalizeWaw: true,
  reduceRepetitions: true,
  removeZeroWidth: true,
  removePunctuation: false,
};

// Regex patterns
const TASHKEEL_REGEX = /[\u0617-\u061A\u064B-\u065F\u0670\u06D6-\u06ED]/g;
const TATWEEL_REGEX = /\u0640/g;
const ZERO_WIDTH_REGEX = /[\u200B-\u200F\uFEFF\u202A-\u202E]/g;
const ALEF_REGEX = /[أإآٱٲٳ]/g;
const TA_MARBUTA_REGEX = /[ةۃ]/g;
const YA_REGEX = /[ىيئءے]/g;
const WAW_REGEX = /[ؤ]/g;
const REPEATED_CHARS_REGEX = /(.)\1{2,}/gu;
const PUNCTUATION_REGEX = /[!"#$%&'()*+,-./:;<=>?@[\\\]^_`{|}~،؛؟«»""'']/g;
const WHITESPACE_REGEX = /\s+/g;

export class ArabicNormalizer {
  /**
   * Normalizes an input string according to configurable options.
   */
  public static normalize(text: string, options: NormalizationOptions = DEFAULT_OPTIONS): string {
    if (!text || typeof text !== 'string') return '';

    const opts = { ...DEFAULT_OPTIONS, ...options };
    let result = text;

    // 1. Remove zero-width & directional markers
    if (opts.removeZeroWidth) {
      result = result.replace(ZERO_WIDTH_REGEX, '');
    }

    // 2. Remove Tashkeel (Harakat)
    if (opts.removeTashkeel) {
      result = result.replace(TASHKEEL_REGEX, '');
    }

    // 3. Remove Tatweel (Kashida ـ)
    if (opts.removeTatweel) {
      result = result.replace(TATWEEL_REGEX, '');
    }

    // 4. Normalize Alef forms (أ, إ, آ, ٱ -> ا)
    if (opts.normalizeAlef) {
      result = result.replace(ALEF_REGEX, 'ا');
    }

    // 5. Normalize Ta Marbuta (ة -> ه)
    if (opts.normalizeTaMarbuta) {
      result = result.replace(TA_MARBUTA_REGEX, 'ه');
    }

    // 6. Normalize Ya forms (ى, ي, ئ -> ي)
    if (opts.normalizeYa) {
      result = result.replace(YA_REGEX, 'ي');
    }

    // 7. Normalize Waw with Hamza (ؤ -> و)
    if (opts.normalizeWaw) {
      result = result.replace(WAW_REGEX, 'و');
    }

    // 8. Reduce excess consecutive repeated characters (e.g., ههههههه -> هه, رااااائع -> رائع)
    if (opts.reduceRepetitions) {
      result = result.replace(REPEATED_CHARS_REGEX, '$1$1');
    }

    // 9. Remove punctuation if requested
    if (opts.removePunctuation) {
      result = result.replace(PUNCTUATION_REGEX, ' ');
    }

    // 10. Normalize spaces
    result = result.replace(WHITESPACE_REGEX, ' ').trim().toLowerCase();

    return result;
  }

  /**
   * Extracts clean tokens (words) from normalized text.
   */
  public static tokenize(text: string): string[] {
    const normalized = this.normalize(text, { removePunctuation: true });
    return normalized.split(' ').filter((token) => token.length > 0);
  }

  /**
   * Checks if normalized subPhrase exists in normalized fullText with word-boundary awareness.
   */
  public static containsPhrase(fullText: string, targetPhrase: string): boolean {
    const normFull = this.normalize(fullText);
    const normTarget = this.normalize(targetPhrase);

    if (!normFull || !normTarget) return false;

    // Direct substring check
    if (normFull.includes(normTarget)) {
      return true;
    }

    // Tokenized inclusion check
    const targetTokens = normTarget.split(' ');
    const fullTokens = normFull.split(' ');

    if (targetTokens.length === 1) {
      return fullTokens.includes(targetTokens[0]);
    }

    // Check consecutive matching sequence of tokens
    for (let i = 0; i <= fullTokens.length - targetTokens.length; i++) {
      let match = true;
      for (let j = 0; j < targetTokens.length; j++) {
        if (fullTokens[i + j] !== targetTokens[j]) {
          match = false;
          break;
        }
      }
      if (match) return true;
    }

    return false;
  }
}
