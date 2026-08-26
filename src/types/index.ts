export type Role = 'SUPER_ADMIN' | 'ADMIN' | 'MODERATOR';

export type Category = 'SPAM' | 'INSULT' | 'ADVERTISEMENT' | 'PROFANITY' | 'HARASSMENT' | 'CUSTOM';

export type Severity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type AutoAction = 'NONE' | 'WARN' | 'MUTE' | 'KICK';

export type WhatsAppProviderType = 'simulator' | 'cloud_api' | 'baileys';

export interface IncomingMessage {
  id: string;
  from: string; // user JID (e.g. 966500000001@s.whatsapp.net)
  senderName?: string;
  groupId: string; // group JID (e.g. 120363012345678901@g.us)
  groupName?: string;
  text: string;
  timestamp: Date;
  isGroup: boolean;
  isAdmin: boolean;
  rawPayload?: unknown;
}

export interface ModerationResult {
  isViolation: boolean;
  ruleMatched?: string;
  category?: Category;
  severity?: Severity;
  actionRequired: 'NONE' | 'WARN' | 'DELETE' | 'MUTE' | 'KICK';
  details?: string;
  source: 'RULES_ENGINE' | 'URL_FILTER' | 'ADS_FILTER' | 'AI_MODERATION';
  normalizedText?: string;
}

export interface ViolationRecord {
  groupId: string;
  groupJid: string;
  groupName: string;
  userId: string;
  userJid: string;
  userName: string;
  messageId: string;
  messageText: string;
  detectedRule: string;
  category: Category;
  severity: Severity;
  actionTaken: string;
}

export interface AdminNotificationPayload {
  groupName: string;
  groupJid: string;
  userName: string;
  userJid: string;
  phoneNumber?: string;
  messageText: string;
  detectedRule: string;
  category: Category;
  severity: Severity;
  actionTaken: string;
  timestamp: Date;
  violationCount: number;
  maxViolations: number;
}

export interface GroupConfig {
  groupId: string;
  groupJid: string;
  groupName: string;
  moderationEnabled: boolean;
  deleteMessages: boolean;
  warnUsers: boolean;
  notifyAdmin: boolean;
  maxViolations: number;
  autoAction: AutoAction;
  allowLinks: boolean;
  allowedDomains: string[];
  allowAds: boolean;
  allowMentions: boolean;
  aiModeration: boolean;
}

export interface CachedRule {
  id: string;
  word: string;
  normalizedWord: string;
  category: Category;
  severity: Severity;
  enabled: boolean;
  isRegex: boolean;
}

export interface CachedException {
  id: string;
  word: string;
  normalizedWord: string;
}
