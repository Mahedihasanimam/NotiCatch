import { NativeModule, requireNativeModule } from 'expo';

export type NativeChangeType =
  | 'posted'
  | 'removed'
  | 'updated'
  | 'cleanup'
  | 'connected'
  | 'disconnected';

type Events = { onChange: (event: { type: NativeChangeType }) => void };

/**
 * Raw bridge to the Kotlin module. All structured values cross the bridge as JSON strings;
 * the typed wrapper in `src/data/native.ts` parses them.
 */
declare class KeepsakeNotificationsModule extends NativeModule<Events> {
  isAccessGranted(): Promise<boolean>;
  postTestNotification(): Promise<boolean>;
  updateStatusNotification(): Promise<void>;
  requestNotificationPermission(): Promise<void>;
  openAccessSettings(): Promise<void>;
  openAppSettings(): Promise<void>;
  requestRebind(): Promise<void>;
  configure(json: string): Promise<void>;
  query(json: string): Promise<string>;
  count(json: string): Promise<number>;
  getByIds(idsJson: string): Promise<string>;
  getAppSummaries(): Promise<string>;
  getConversations(): Promise<string>;
  getConversationMessages(packageName: string, title: string): Promise<string>;
  getStats(dayStartsJson: string, dayEnd: number): Promise<string>;
  canReply(sbnKey: string | null, chatKey: string | null): Promise<boolean>;
  sendReply(sbnKey: string | null, chatKey: string | null, text: string): Promise<boolean>;
  openNotification(sbnKey: string | null, chatKey: string | null, packageName: string | null): Promise<boolean>;
  setFavorite(idsJson: string, value: boolean): Promise<number>;
  setArchived(idsJson: string, value: boolean): Promise<number>;
  deleteByIds(idsJson: string): Promise<number>;
  clearAll(keepFavorites: boolean): Promise<number>;
  runCleanup(days: number, keepFavorites: boolean, keepArchived: boolean): Promise<number>;
  importRecords(json: string): Promise<string>;
  getInstalledApps(): Promise<string>;
  getAppIcon(packageName: string): Promise<string | null>;
  playAudio(filePath: string): Promise<boolean>;
  stopAudio(): Promise<boolean>;
  playPreviewTone(): Promise<boolean>;
}

export type KeepsakeNativeModule = KeepsakeNotificationsModule;

export default requireNativeModule<KeepsakeNotificationsModule>('KeepsakeNotifications');
