import { ArabicNormalizer, NormalizationOptions } from '../utils/arabic-normalizer.js';

export { ArabicNormalizer, NormalizationOptions };

export function normalizeMessageText(text: string): string {
  return ArabicNormalizer.normalize(text);
}
