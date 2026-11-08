export interface NotificationRecord {
  id: number;
  sbnKey: string;
  packageName: string;
  appName: string;
  title: string | null;
  text: string | null;
  bigText: string | null;
  subText: string | null;
  category: string | null;
  channelId: string | null;
  groupKey: string | null;
  isGroupSummary: boolean;
  isOngoing: boolean;
  postedAt: number;
  removedAt: number | null;
  removalReason: number | null;
  isFavorite: boolean;
  isArchived: boolean;
  isDeleted: boolean;
  deletedAt: number | null;
  mediaPath: string | null;
  mediaType: string | null;
  avatarPath?: string | null;
}

/** A record as stored in a backup file (no local row id). */
export type BackupRecord = Omit<NotificationRecord, 'id'>;

export type ArchiveMode = 'exclude' | 'only' | 'include';

export interface QueryFilter {
  search?: string;
  packages?: string[];
  from?: number | null;
  to?: number | null;
  favoritesOnly?: boolean;
  deletedOnly?: boolean;
  archived?: ArchiveMode;
  limit?: number;
  offset?: number;
}

export interface Stats {
  total: number;
  today: number;
  favorites: number;
  archived: number;
  deleted: number;
  /** Counts for the last N days, oldest first, last entry = today. */
  daily: number[];
}

export interface Conversation {
  packageName: string;
  appName: string;
  title: string;
  lastMessage: string | null;
  lastPostedAt: number;
  count: number;
  deletedCount: number;
  mediaPath: string | null;
  avatarPath?: string | null;
  sbnKey: string | null;
  unreadCount?: number;
}

export interface AppSummary {
  packageName: string;
  appName: string;
  count: number;
  lastPostedAt: number;
}

export interface InstalledApp {
  packageName: string;
  label: string;
}

export type ThemePreference = 'system' | 'light' | 'dark';
export type GroupMode = 'date' | 'app';
