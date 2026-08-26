export type Role = 'SUPER_ADMIN' | 'ADMIN' | 'MODERATOR';

export type Category = 'SPAM' | 'INSULT' | 'ADVERTISEMENT' | 'PROFANITY' | 'HARASSMENT' | 'CUSTOM';

export type Severity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type AutoAction = 'NONE' | 'WARN' | 'MUTE' | 'KICK';

export interface User {
  userId: string;
  email: string;
  name: string;
  role: Role;
}

export interface GroupSettings {
  id: string;
  groupId: string;
  moderationEnabled: boolean;
  deleteMessages: boolean;
  warnUsers: boolean;
  notifyAdmin: boolean;
  maxViolations: number;
  autoAction: AutoAction;
  allowLinks: boolean;
  allowedDomains: string;
  allowAds: boolean;
  allowMentions: boolean;
  aiModeration: boolean;
  updatedAt: string;
}

export interface Group {
  id: string;
  groupJid: string;
  name: string;
  isActive: boolean;
  participantCount: number;
  createdAt: string;
  updatedAt: string;
  settings?: GroupSettings;
  _count?: {
    violations: number;
  };
}

export interface ForbiddenWord {
  id: string;
  word: string;
  normalizedWord: string;
  category: Category;
  severity: Severity;
  enabled: boolean;
  isRegex: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface WordException {
  id: string;
  word: string;
  normalizedWord: string;
  reason?: string;
  createdAt: string;
}

export interface Member {
  id: string;
  userJid: string;
  phoneNumber?: string;
  name: string;
  totalViolations: number;
  isBlocked: boolean;
  lastViolationAt?: string;
  createdAt: string;
  _count?: {
    violations: number;
  };
}

export interface Violation {
  id: string;
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
  createdAt: string;
  group?: { name: string; groupJid: string };
  member?: { name: string; phoneNumber?: string; userJid: string; totalViolations: number };
}

export interface DashboardStats {
  overview: {
    botStatus: { connected: boolean; provider: string; details?: string };
    totalGroups: number;
    activeGroups: number;
    totalMembers: number;
    totalRules: number;
    totalViolations: number;
    todayViolations: number;
    deletedMessages: number;
    warningsSent: number;
  };
  topViolators: Array<{
    id: string;
    name: string;
    phoneNumber?: string;
    userJid: string;
    totalViolations: number;
    lastViolationAt?: string;
  }>;
  topRules: Array<{
    rule: string;
    category: Category;
    count: number;
  }>;
  recentViolations: Violation[];
}

export interface SimulatorLog {
  id: string;
  type: 'INCOMING' | 'OUTGOING' | 'DELETED' | 'KICKED';
  target: string;
  content: string;
  timestamp: string;
}
