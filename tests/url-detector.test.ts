import { describe, it, expect } from 'vitest';
import { UrlDetector } from '../src/moderation/url-detector.js';

describe('UrlDetector Suite', () => {
  it('should extract standard HTTP/HTTPS and www URLs', () => {
    const text = 'يرجى مراجعة الرابط https://youtube.com/watch?v=123 وأيضاً www.example.org';
    const urls = UrlDetector.extractUrls(text);
    expect(urls).toContain('https://youtube.com/watch?v=123');
    expect(urls).toContain('www.example.org');
  });

  it('should extract bare domains with common TLDs', () => {
    const text = 'انضم إلى قناتنا على telegram.me/test أو zump.xyz/offer';
    const urls = UrlDetector.extractUrls(text);
    expect(urls.length).toBeGreaterThanOrEqual(2);
  });

  it('should correctly allow whitelisted domains', () => {
    const allowed = ['youtube.com', 'facebook.com', 'github.com'];

    expect(UrlDetector.isDomainAllowed('youtube.com', allowed)).toBe(true);
    expect(UrlDetector.isDomainAllowed('m.youtube.com', allowed)).toBe(true);
    expect(UrlDetector.isDomainAllowed('music.youtube.com', allowed)).toBe(true);
    expect(UrlDetector.isDomainAllowed('github.com', allowed)).toBe(true);
    expect(UrlDetector.isDomainAllowed('malicious-site.xyz', allowed)).toBe(false);
  });

  it('should flag unauthorized links when allowLinks is false', () => {
    const text = 'شاهد هذا الرابط https://scam-giveaway.top/free';
    const result = UrlDetector.checkMessage(text, false, ['youtube.com']);

    expect(result.hasUrls).toBe(true);
    expect(result.isViolating).toBe(true);
    expect(result.unauthorizedUrls.length).toBe(1);
  });

  it('should not flag allowed links when allowLinks is false but host is whitelisted', () => {
    const text = 'شاهد هذا الفيديو التعليمي: https://www.youtube.com/watch?v=abc';
    const result = UrlDetector.checkMessage(text, false, ['youtube.com', 'github.com']);

    expect(result.hasUrls).toBe(true);
    expect(result.isViolating).toBe(false);
    expect(result.unauthorizedUrls.length).toBe(0);
  });
});
