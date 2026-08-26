import axios from 'axios';
import { config } from '../config/index.js';
import { Category, Severity } from '../types/index.js';
import { logger } from '../utils/logger.js';

export interface AiModerationResponse {
  isViolation: boolean;
  category?: Category;
  severity?: Severity;
  explanation?: string;
  confidence?: number;
}

export class AiModerator {
  private static circuitBreakerFailures = 0;
  private static lastFailureTime = 0;
  private static readonly FAILURE_THRESHOLD = 3;
  private static readonly RESET_TIMEOUT_MS = 60000; // 1 minute
  private static readonly REQUEST_TIMEOUT_MS = 3000; // 3 seconds max

  /**
   * Analyzes contextual text using configured AI provider (OpenAI / Gemini)
   */
  public static async analyzeText(text: string): Promise<AiModerationResponse | null> {
    if (!config.AI_MODERATION_ENABLED || !config.AI_API_KEY) {
      return null;
    }

    // Check circuit breaker
    const now = Date.now();
    if (this.circuitBreakerFailures >= this.FAILURE_THRESHOLD) {
      if (now - this.lastFailureTime < this.RESET_TIMEOUT_MS) {
        logger.warn('AI Moderation Circuit Breaker is OPEN. Skipping AI check.');
        return null;
      } else {
        // Half-open attempt reset
        this.circuitBreakerFailures = 0;
      }
    }

    try {
      if (config.AI_PROVIDER === 'openai') {
        return await this.callOpenAi(text);
      } else if (config.AI_PROVIDER === 'gemini') {
        return await this.callGemini(text);
      }
      return null;
    } catch (error) {
      this.circuitBreakerFailures++;
      this.lastFailureTime = Date.now();
      logger.error('AI Moderation API call failed (circuit breaker incremented):', { error });
      return null;
    }
  }

  private static async callOpenAi(text: string): Promise<AiModerationResponse | null> {
    const prompt = `You are a WhatsApp Group Safety Moderator for Arabic & English communities.
Analyze this message for toxicity, insults, profanity, harassment, or severe spam.

Message: "${text}"

Respond ONLY with valid JSON in this exact structure:
{
  "isViolation": boolean,
  "category": "SPAM" | "INSULT" | "ADVERTISEMENT" | "PROFANITY" | "HARASSMENT" | "CUSTOM",
  "severity": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
  "explanation": "Short Arabic explanation of why it violates rules, or empty if clean",
  "confidence": number between 0.0 and 1.0
}`;

    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: config.AI_MODEL || 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        temperature: 0.1,
      },
      {
        headers: {
          Authorization: `Bearer ${config.AI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: this.REQUEST_TIMEOUT_MS,
      }
    );

    const content = response.data?.choices?.[0]?.message?.content;
    if (!content) return null;

    const parsed = JSON.parse(content);
    return {
      isViolation: Boolean(parsed.isViolation),
      category: parsed.category as Category,
      severity: parsed.severity as Severity,
      explanation: parsed.explanation,
      confidence: parsed.confidence,
    };
  }

  private static async callGemini(text: string): Promise<AiModerationResponse | null> {
    const prompt = `You are a WhatsApp Group Safety Moderator. Analyze this message: "${text}".
Return JSON:
{
  "isViolation": boolean,
  "category": "SPAM" | "INSULT" | "ADVERTISEMENT" | "PROFANITY" | "HARASSMENT" | "CUSTOM",
  "severity": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
  "explanation": "Short Arabic reason",
  "confidence": number
}`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${config.AI_MODEL || 'gemini-1.5-flash'}:generateContent?key=${config.AI_API_KEY}`;
    const response = await axios.post(
      url,
      {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: 'application/json', temperature: 0.1 },
      },
      { timeout: this.REQUEST_TIMEOUT_MS }
    );

    const content = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!content) return null;

    const parsed = JSON.parse(content);
    return {
      isViolation: Boolean(parsed.isViolation),
      category: parsed.category as Category,
      severity: parsed.severity as Severity,
      explanation: parsed.explanation,
      confidence: parsed.confidence,
    };
  }
}
