import type { NotificationRecord } from '@/lib/types';

export function rec(overrides: Partial<NotificationRecord> = {}): NotificationRecord {
  return {
    id: 1, sbnKey: '0|com.app|1|null|1', packageName: 'com.app', appName: 'App', title: 'Title', text: 'Body',
    bigText: null, subText: null, category: 'msg', channelId: 'ch', groupKey: null, isGroupSummary: false,
    isOngoing: false, postedAt: new Date(2026, 9, 31, 12, 0).getTime(), removedAt: null, removalReason: null,
    isFavorite: false, isArchived: false, isDeleted: false, deletedAt: null,
    mediaPath: null, mediaType: null, ...overrides,
  };
}
