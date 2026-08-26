/**
 * URL and Link Detection Engine with Domain Whitelist Filtering
 */

export interface UrlCheckResult {
  hasUrls: boolean;
  detectedUrls: string[];
  unauthorizedUrls: string[];
  isViolating: boolean;
}

// Regex to capture full URLs and bare domains with paths or common TLDs
const URL_PATTERN = /(?:https?:\/\/|www\.)[^\s/$.?#].[^\s]*|(?:\b[a-zA-Z0-9-]+\.(?:com|net|org|io|ai|me|co|info|biz|app|dev|xyz|online|site|club|vip|link|top|cc|gg|ly|gl|is|ws)\b[^\s]*)/gi;

export class UrlDetector {
  /**
   * Extracts all URLs from the text
   */
  public static extractUrls(text: string): string[] {
    if (!text || typeof text !== 'string') return [];
    const matches = text.match(URL_PATTERN);
    if (!matches) return [];
    // Deduplicate and trim trailing punctuations
    return Array.from(
      new Set(
        matches.map((url) => url.replace(/[.,;!?()]+$/, '').trim())
      )
    );
  }

  /**
   * Normalizes a URL/domain string to its root host (e.g., https://sub.youtube.com/watch?v=123 -> sub.youtube.com)
   */
  public static extractHost(urlString: string): string {
    let normalized = urlString.trim().toLowerCase();
    if (!normalized.startsWith('http://') && !normalized.startsWith('https://')) {
      normalized = 'http://' + normalized;
    }

    try {
      const urlObj = new URL(normalized);
      return urlObj.hostname.replace(/^www\./, '');
    } catch {
      // Fallback manual regex extract
      const hostMatch = urlString.match(/(?:https?:\/\/)?(?:www\.)?([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i);
      return hostMatch ? hostMatch[1].toLowerCase() : urlString.toLowerCase();
    }
  }

  /**
   * Checks if a domain is allowed based on whitelist
   */
  public static isDomainAllowed(host: string, allowedDomains: string[]): boolean {
    if (!allowedDomains || allowedDomains.length === 0) return false;

    const cleanHost = host.toLowerCase().replace(/^www\./, '');

    for (const allowed of allowedDomains) {
      const cleanAllowed = allowed.trim().toLowerCase().replace(/^www\./, '');
      if (!cleanAllowed) continue;

      if (cleanHost === cleanAllowed || cleanHost.endsWith('.' + cleanAllowed)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Checks a message for link policy compliance
   */
  public static checkMessage(
    text: string,
    allowLinks: boolean,
    allowedDomains: string[] = []
  ): UrlCheckResult {
    const urls = this.extractUrls(text);

    if (urls.length === 0) {
      return {
        hasUrls: false,
        detectedUrls: [],
        unauthorizedUrls: [],
        isViolating: false,
      };
    }

    // If all links are permitted in the group, no violation
    if (allowLinks) {
      return {
        hasUrls: true,
        detectedUrls: urls,
        unauthorizedUrls: [],
        isViolating: false,
      };
    }

    // Filter unauthorized URLs against the whitelist
    const unauthorized = urls.filter((url) => {
      const host = this.extractHost(url);
      return !this.isDomainAllowed(host, allowedDomains);
    });

    return {
      hasUrls: true,
      detectedUrls: urls,
      unauthorizedUrls: unauthorized,
      isViolating: unauthorized.length > 0,
    };
  }
}
