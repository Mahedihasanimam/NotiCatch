import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  Share,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppIcon } from '@/components/AppIcon';
import { Avatar } from '@/components/Avatar';
import { promptNotificationPermissionIfNeeded, showAppToast } from '@/components/CustomDialog';
import { PressableBounce } from '@/components/PressableBounce';
import { EmptyState, ErrorState, LoadingState } from '@/components/states';
import { Text } from '@/components/ui';
import {
  getConversationMessages,
  openNotification,
  playAudio,
  playPreviewTone,
  queryNotifications,
  sendReply,
  setArchived,
  stopAudio,
} from '@/data/repository';
import { useLiveQuery } from '@/hooks/useLiveQuery';
import { cleanChatTitle } from '@/lib/chat';
import type { NotificationRecord } from '@/lib/types';
import { useDataVersion } from '@/store/dataVersion';
import { useSettings } from '@/store/settings';
import { radius, space } from '@/theme';

function formatChatTime(timestamp: number): string {
  const d = new Date(timestamp);
  let h = d.getHours();
  const m = d.getMinutes().toString().padStart(2, '0');
  const ampm = h >= 12 ? 'pm' : 'am';
  h = h % 12;
  h = h ? h : 12;
  return `${ampm} ${h}:${m}`;
}

function formatThreadDateHeader(timestamp: number): string {
  const d = new Date(timestamp);
  const weekday = d.toLocaleDateString('en-US', { weekday: 'short' });
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const year = d.getFullYear();
  return `${weekday}, ${month} ${day}, ${year}`;
}

function parseSenderAndBody(rawText: string | null | undefined, fallbackTitle: string) {
  if (!rawText) return { sender: fallbackTitle, body: '' };
  // Check for "~ Sender : Message" pattern or "Sender: Message"
  const match = rawText.match(/^([~]?\s*[^:\n]+)\s*:\s*([\s\S]+)$/);
  if (match && match[1] && match[2]) {
    return {
      sender: match[1].trim(),
      body: match[2].trim(),
    };
  }
  return {
    sender: fallbackTitle,
    body: rawText,
  };
}

function isVoiceMessage(item: NotificationRecord, bodyText: string) {
  if (item.mediaType === 'audio') return true;
  const lower = (bodyText || '').toLowerCase();
  return (
    lower.includes('🎤') ||
    lower.includes('audio message') ||
    lower.includes('voice message') ||
    lower.includes('voice note') ||
    lower.includes('ভয়েস') ||
    lower.includes('অডিও')
  );
}

function isPhotoMessage(item: NotificationRecord, bodyText: string) {
  if (item.mediaType === 'image') return true;
  const lower = (bodyText || '').toLowerCase();
  return (
    lower.includes('📷') ||
    lower.includes('sent a photo') ||
    lower.includes('photo') ||
    lower.includes('image') ||
    lower.includes('picture') ||
    lower.includes('ছবি')
  );
}

const WAVE_BARS = [5, 9, 15, 22, 12, 7, 18, 24, 16, 11, 7, 13, 21, 15, 9, 17, 23, 13, 8, 14, 19, 10];

interface VoiceNotePlayerProps {
  item: NotificationRecord;
  isPlaying: boolean;
  progress: number;
  elapsedSeconds: number;
  onTogglePlay: () => void;
}

function VoiceNotePlayer({
  isPlaying,
  progress,
  elapsedSeconds,
  onTogglePlay,
}: VoiceNotePlayerProps) {
  const activeCount = Math.floor(progress * WAVE_BARS.length);
  const totalSeconds = 15;
  const currentSec = isPlaying ? elapsedSeconds : totalSeconds;
  const displayTime = `0:${currentSec.toString().padStart(2, '0')}`;

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingVertical: 4,
        paddingHorizontal: 2,
        minWidth: 220,
      }}
    >
      <PressableBounce
        scaleTo={0.92}
        hitSlop={6}
        onPress={onTogglePlay}
        style={{
          width: 38,
          height: 38,
          borderRadius: 19,
          backgroundColor: '#0A6C74',
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: 1,
          borderColor: 'rgba(0, 229, 255, 0.4)',
        }}
      >
        <Ionicons
          name={isPlaying ? 'pause' : 'play'}
          size={18}
          color="#FFFFFF"
          style={{ marginLeft: isPlaying ? 0 : 2 }}
        />
      </PressableBounce>

      {/* Waveform Bars */}
      <View
        style={{
          flex: 1,
          flexDirection: 'row',
          alignItems: 'center',
          height: 28,
          justifyContent: 'space-between',
        }}
      >
        {WAVE_BARS.map((height, i) => {
          const isActive = isPlaying ? i <= activeCount : false;
          return (
            <View
              key={i}
              style={{
                width: 3,
                height,
                borderRadius: 2,
                backgroundColor: isActive ? '#00E5FF' : '#555C6E',
              }}
            />
          );
        })}
      </View>

      {/* Timer & Mic Icon */}
      <View style={{ alignItems: 'flex-end', marginLeft: 4 }}>
        <Text
          style={{
            fontSize: 11,
            color: isPlaying ? '#00E5FF' : '#8E94A5',
            fontFamily: 'Manrope_600SemiBold',
          }}
        >
          {displayTime}
        </Text>
        <Ionicons
          name="mic"
          size={12}
          color={isPlaying ? '#00E5FF' : '#8E94A5'}
          style={{ marginTop: 2 }}
        />
      </View>
    </View>
  );
}

interface PhotoPlaceholderCardProps {
  caption?: string | null;
  appName?: string;
}

function PhotoPlaceholderCard({ caption, appName }: PhotoPlaceholderCardProps) {
  const displayCaption =
    caption && !caption.includes('📷') && !caption.toLowerCase().includes('sent a photo')
      ? caption
      : 'Sent a photo to you';

  return (
    <View
      style={{
        backgroundColor: 'rgba(255, 255, 255, 0.04)',
        borderRadius: 14,
        padding: 12,
        minWidth: 220,
        maxWidth: 270,
        borderWidth: 1,
        borderColor: 'rgba(0, 229, 255, 0.25)',
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        <View
          style={{
            width: 38,
            height: 38,
            borderRadius: 10,
            backgroundColor: 'rgba(10, 108, 116, 0.35)',
            borderWidth: 1,
            borderColor: 'rgba(0, 229, 255, 0.4)',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name="camera" size={20} color="#00E5FF" />
        </View>
        <View style={{ flex: 1 }}>
          <Text
            style={{
              color: '#FFFFFF',
              fontSize: 14,
              fontFamily: 'Manrope_700Bold',
            }}
          >
            Photo
          </Text>
          <Text
            style={{
              color: '#94A3B8',
              fontSize: 12,
              fontFamily: 'Manrope_500Medium',
            }}
            numberOfLines={1}
          >
            {displayCaption}
          </Text>
        </View>
      </View>

      {/* Tap hint to open real app */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 5,
          paddingTop: 6,
          borderTopWidth: 1,
          borderTopColor: 'rgba(255, 255, 255, 0.06)',
        }}
      >
        <Ionicons name="open-outline" size={13} color="#2DD4BF" />
        <Text
          style={{
            fontSize: 11.5,
            fontFamily: 'Manrope_600SemiBold',
            color: '#2DD4BF',
          }}
        >
          Tap to view photo in {appName || 'App'}
        </Text>
      </View>
    </View>
  );
}

export default function ChatThread() {
  const { top, bottom } = useSafeAreaInsets();
  const { packageName, title, appName, notificationId } = useLocalSearchParams<{
    packageName: string;
    title: string;
    appName?: string;
    notificationId?: string;
  }>();

  const bump = useDataVersion((s) => s.bump);
  const isPro = useSettings((s) => s.isPro);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const flatListRef = useRef<FlatList<NotificationRecord>>(null);

  const [playingAudioId, setPlayingAudioId] = useState<number | string | null>(null);
  const [playingProgress, setPlayingProgress] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const playbackTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopCurrentAudio = useCallback(async () => {
    if (playbackTimerRef.current) {
      clearInterval(playbackTimerRef.current);
      playbackTimerRef.current = null;
    }
    setPlayingAudioId(null);
    setPlayingProgress(0);
    setElapsedSeconds(0);
    try {
      await stopAudio();
    } catch (_: unknown) {}
  }, []);

  const handleTogglePlayAudio = useCallback(
    async (item: NotificationRecord) => {
      const id = item.id || item.sbnKey;
      if (playingAudioId === id) {
        await stopCurrentAudio();
        return;
      }

      await stopCurrentAudio();
      setPlayingAudioId(id);
      setPlayingProgress(0);
      setElapsedSeconds(0);

      const isAudioFile =
        Boolean(item.mediaPath) &&
        (item.mediaPath!.endsWith('.m4a') ||
          item.mediaPath!.endsWith('.mp3') ||
          item.mediaPath!.endsWith('.ogg') ||
          item.mediaPath!.endsWith('.amr') ||
          item.mediaPath!.endsWith('.aac') ||
          item.mediaPath!.endsWith('.wav'));

      if (isAudioFile && item.mediaPath) {
        try {
          await playAudio(item.mediaPath);
        } catch (_: unknown) {}
      } else {
        try {
          await playPreviewTone();
        } catch (_: unknown) {}
        showAppToast('Playing voice message preview');
      }

      const totalDuration = 15;
      const startTime = Date.now();
      playbackTimerRef.current = setInterval(() => {
        const elapsed = (Date.now() - startTime) / 1000;
        if (elapsed >= totalDuration) {
          void stopCurrentAudio();
        } else {
          setElapsedSeconds(Math.floor(elapsed));
          setPlayingProgress(Math.min(1, elapsed / totalDuration));
        }
      }, 100);
    },
    [playingAudioId, stopCurrentAudio],
  );

  useEffect(() => {
    return () => {
      if (playbackTimerRef.current) {
        clearInterval(playbackTimerRef.current);
      }
      void stopAudio();
    };
  }, []);

  const isWhatsApp = (packageName || '').toLowerCase().includes('whatsapp');
  const isChatApp =
    isWhatsApp ||
    (packageName || '').toLowerCase().includes('messaging') ||
    (packageName || '').toLowerCase().includes('orca') ||
    (packageName || '').toLowerCase().includes('telegram');
  const isGroup = (title || '').includes('(B)') || (title || '').toLowerCase().includes('group');

  const fetchMessages = useCallback(async () => {
    if (!packageName) return [];
    if (title) {
      const list = await getConversationMessages(packageName, title);
      if (list && list.length > 0) return list;
    }
    // Fallback: search in notifications
    const all = await queryNotifications({ packages: [packageName], archived: 'include', limit: 500 });
    if (notificationId) {
      const specific = all.filter((n) => String(n.id) === String(notificationId));
      if (specific.length > 0) return specific;
    }
    if (title) {
      const cleanTarget = cleanChatTitle(title).toLowerCase();
      const matched = all.filter((n) => {
        const cleanItemTitle = cleanChatTitle(n.title).toLowerCase();
        return (
          cleanItemTitle === cleanTarget ||
          cleanItemTitle.includes(cleanTarget) ||
          cleanTarget.includes(cleanItemTitle) ||
          (n.subText && n.subText.toLowerCase().includes(cleanTarget))
        );
      });
      if (matched.length > 0) return matched;
    }
    return all;
  }, [packageName, title, notificationId]);

  const { data: rawMessages, loading, error, reload } = useLiveQuery(fetchMessages, [
    packageName,
    title,
    notificationId,
  ]);

  // Mark unread messages in this thread as read
  useEffect(() => {
    if (rawMessages && rawMessages.length > 0) {
      const unreadIds = rawMessages.filter((m) => !m.isArchived).map((m) => m.id);
      if (unreadIds.length > 0) {
        void setArchived(unreadIds, true).then(() => bump());
      }
    }
  }, [rawMessages]);

  // Sort messages chronologically and de-duplicate repeated voice notes or duplicate alerts
  const messages = useMemo(() => {
    if (!rawMessages) return [];
    const sorted = [...rawMessages].sort((a, b) => a.postedAt - b.postedAt);

    // De-duplicate consecutive identical messages (e.g. repeated voice note notifications or duplicate alerts within 2 minutes)
    const deduplicated: NotificationRecord[] = [];
    for (const msg of sorted) {
      const prev = deduplicated[deduplicated.length - 1];
      if (prev) {
        const rawCurrent = (msg.text ?? msg.bigText ?? '').trim().toLowerCase();
        const rawPrev = (prev.text ?? prev.bigText ?? '').trim().toLowerCase();
        const isVoiceCurrent = isVoiceMessage(msg, rawCurrent);
        const isVoicePrev = isVoiceMessage(prev, rawPrev);
        const isPhotoCurrent = isPhotoMessage(msg, rawCurrent);
        const isPhotoPrev = isPhotoMessage(prev, rawPrev);

        const closeInTime = Math.abs(msg.postedAt - prev.postedAt) < 120000; // within 2 minutes
        const sameSender = (msg.title || '') === (prev.title || '');

        // 1. If both are voice messages from same sender within 2 min -> duplicate!
        if (isVoiceCurrent && isVoicePrev && sameSender && closeInTime) {
          continue;
        }

        // 2. If both are photo placeholders without media from same sender within 2 min -> duplicate!
        if (isPhotoCurrent && isPhotoPrev && !msg.mediaPath && !prev.mediaPath && sameSender && closeInTime) {
          continue;
        }

        // 3. If exact same text from same sender within 2 min -> duplicate!
        if (rawCurrent && rawCurrent === rawPrev && sameSender && closeInTime) {
          continue;
        }
      }
      deduplicated.push(msg);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      return deduplicated.filter(
        (m) =>
          (m.text && m.text.toLowerCase().includes(q)) ||
          (m.title && m.title.toLowerCase().includes(q)),
      );
    }
    return deduplicated;
  }, [rawMessages, searchQuery]);

  const handleSend = async () => {
    if (!inputText.trim()) return;
    if (!promptNotificationPermissionIfNeeded()) return;
    const textToSend = inputText.trim();
    setSending(true);

    try {
      const chatKey = `${packageName}:${title}`;
      const lastKey = messages.length > 0 ? messages[messages.length - 1]?.sbnKey : null;
      const success = await sendReply(lastKey ?? null, chatKey, textToSend);

      if (success) {
        showAppToast(`Reply sent to ${title}!`);
        setInputText('');
        bump();
      } else {
        showAppToast(`Reply action queued for ${title}`);
        setInputText('');
      }
    } catch {
      showAppToast('Could not deliver reply', 'error');
    } finally {
      setSending(false);
    }
  };

  const shareMessage = (item: NotificationRecord) => {
    const text = [item.title, item.bigText ?? item.text].filter(Boolean).join('\n');
    void Share.share({ message: text, title: item.title ?? 'Message' });
  };

  return (
    <SafeAreaView
      edges={[]}
      style={[
        { flex: 1, backgroundColor: '#232630' },
        {
          paddingTop: top,
          paddingBottom: bottom,
        },
      ]}
    >
      {/* 1. Header: Exact match with Image 2 (← SenderAvatar Title 🔍) */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 16,
          paddingVertical: 12,
          borderBottomWidth: 1,
          borderBottomColor: 'rgba(255,255,255,0.06)',
          backgroundColor: '#232630',
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
          <PressableBounce hitSlop={10} onPress={() => router.back()} scaleTo={0.9}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </PressableBounce>

          <Avatar
            name={title || appName || 'User'}
            packageName={packageName}
            appName={appName}
            size={34}
            showAppBadge={false}
          />

          {isGroup ? (
            <View
              style={{
                width: 12,
                height: 12,
                borderRadius: 2,
                backgroundColor: '#9C27B0',
              }}
            />
          ) : null}

          <Text
            numberOfLines={1}
            style={{
              fontSize: 17,
              fontFamily: 'Manrope_700Bold',
              color: '#FFFFFF',
              flex: 1,
            }}
          >
            {title || appName}
          </Text>
        </View>

        <PressableBounce
          scaleTo={0.9}
          hitSlop={10}
          onPress={() => {
            if (showSearch) setSearchQuery('');
            setShowSearch((v) => !v);
          }}
          style={{ padding: 4 }}
        >
          <Ionicons name={showSearch ? 'close' : 'search'} size={22} color="#FFFFFF" />
        </PressableBounce>
      </View>

      {/* Expandable Search within Thread */}
      {showSearch ? (
        <View style={{ paddingHorizontal: 16, paddingVertical: 8, backgroundColor: '#2A2E3B' }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: '#343846',
              borderRadius: radius.md,
              paddingHorizontal: 12,
              height: 38,
              gap: 8,
            }}
          >
            <Ionicons name="search" size={16} color="#7C8494" />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Filter messages in this chat..."
              placeholderTextColor="#7C8494"
              autoFocus
              style={{ flex: 1, fontSize: 13.5, color: '#FFFFFF' }}
            />
            {searchQuery.length > 0 ? (
              <Pressable onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={16} color="#7C8494" />
              </Pressable>
            ) : null}
          </View>
        </View>
      ) : null}

      {/* 2. Messages List: Pixel match with Image 2 */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 12 : 0}
        style={{ flex: 1 }}
      >
        {loading ? (
          <LoadingState />
        ) : error ? (
          <ErrorState message={error} onRetry={reload} />
        ) : messages.length === 0 ? (
          <EmptyState
            icon="chatbubble-ellipses-outline"
            title="No messages found"
            message={`No saved messages found for "${title}".`}
          />
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(m) => String(m.id || m.sbnKey)}
            contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 14, paddingBottom: 20 }}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
            renderItem={({ item, index }) => {
              const raw = item.text ?? item.bigText ?? '';
              const { sender, body } = parseSenderAndBody(raw, item.title ?? 'Sender');
              const prevItem = index > 0 ? messages[index - 1] : null;
              const prevRaw = prevItem ? prevItem.text ?? prevItem.bigText ?? '' : '';
              const prevParsed = parseSenderAndBody(prevRaw, prevItem?.title ?? '');
              const showSenderHeader = index === 0 || prevParsed.sender !== sender;

              const showDateDivider =
                index === 0 ||
                new Date(item.postedAt).toDateString() !==
                  new Date(messages[index - 1]!.postedAt).toDateString();

              const isVoice = isVoiceMessage(item, body);
              const isPhoto = isPhotoMessage(item, body);

              const validImageUri =
                item.mediaPath && item.mediaType !== 'audio'
                  ? item.mediaPath.startsWith('file://')
                    ? item.mediaPath
                    : `file://${item.mediaPath}`
                  : null;

              const hasRealImage = Boolean(validImageUri);
              const itemId = item.id || item.sbnKey;
              const isAudioPlaying = playingAudioId === itemId;

              return (
                <View style={{ marginBottom: 14 }}>
                  {/* Date Divider (matching Image 2) */}
                  {showDateDivider ? (
                    <View style={{ alignItems: 'center', marginVertical: 14 }}>
                      <Text
                        style={{
                          fontSize: 12.5,
                          fontFamily: 'Manrope_600SemiBold',
                          color: '#7C8494',
                        }}
                      >
                        {formatThreadDateHeader(item.postedAt)}
                      </Text>
                    </View>
                  ) : null}

                  <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
                    {/* Left Sender Avatar (circular image matching Image 2) */}
                    <View style={{ width: 32, alignItems: 'center', paddingTop: 2 }}>
                      {showSenderHeader ? (
                        <Avatar
                          name={sender}
                          packageName={packageName}
                          appName={appName}
                          size={32}
                          showAppBadge={false}
                        />
                      ) : (
                        <View style={{ width: 32 }} />
                      )}
                    </View>

                    {/* Sender Name + Message Bubble */}
                    <View style={{ flex: 1, maxWidth: '88%' }}>
                      {showSenderHeader ? (
                        <Text
                          style={{
                            fontSize: 13,
                            fontFamily: 'Manrope_600SemiBold',
                            color: '#8E94A5',
                            marginBottom: 5,
                          }}
                        >
                          {sender}
                        </Text>
                      ) : null}

                      {/* Bubble Container matching Image 2 (#2E323F) */}
                      <PressableBounce
                        scaleTo={0.98}
                        onPress={() => {
                          void openNotification(item.sbnKey, `${packageName}:${title}`, packageName);
                        }}
                        style={{
                          backgroundColor: '#2E323F',
                          borderRadius: 14,
                          padding: 12,
                          alignSelf: 'flex-start',
                          maxWidth: '100%',
                        }}
                      >
                        {/* Deleted Message Red Badge */}
                        {item.isDeleted ? (
                          <View
                            style={{
                              flexDirection: 'row',
                              alignItems: 'center',
                              gap: 4,
                              marginBottom: 6,
                              paddingBottom: 4,
                              borderBottomWidth: 1,
                              borderBottomColor: '#EF4444',
                            }}
                          >
                            <Ionicons name="trash" size={12} color="#EF4444" />
                            <Text
                              style={{
                                color: '#EF4444',
                                fontSize: 11,
                                fontFamily: 'Manrope_700Bold',
                              }}
                            >
                              DELETED BY SENDER
                            </Text>
                          </View>
                        ) : null}

                        {/* 1. Voice Note Message */}
                        {isVoice ? (
                          <VoiceNotePlayer
                            item={item}
                            isPlaying={isAudioPlaying}
                            progress={isAudioPlaying ? playingProgress : 0}
                            elapsedSeconds={isAudioPlaying ? elapsedSeconds : 0}
                            onTogglePlay={() => void handleTogglePlayAudio(item)}
                          />
                        ) : hasRealImage && validImageUri ? (
                          /* 2. Genuine Sent Photo */
                          <View>
                            {body && !isPhoto ? (
                              <Text
                                selectable
                                style={{
                                  color: '#FFFFFF',
                                  fontSize: 15,
                                  lineHeight: 21,
                                  fontFamily: 'Manrope_500Medium',
                                  marginBottom: 6,
                                }}
                              >
                                {body}
                              </Text>
                            ) : null}
                            <Pressable
                              onPress={() => setPreviewImage(validImageUri)}
                              style={{
                                borderRadius: 12,
                                overflow: 'hidden',
                              }}
                            >
                              <Image
                                source={{ uri: validImageUri }}
                                style={{
                                  width: 240,
                                  height: 175,
                                  borderRadius: 12,
                                  backgroundColor: '#1C1F27',
                                }}
                                resizeMode="cover"
                              />
                            </Pressable>
                          </View>
                        ) : isPhoto ? (
                          /* 3. Photo Message Card (Placeholder when payload not embedded - never shows avatar!) */
                          <PhotoPlaceholderCard caption={body} appName={appName} />
                        ) : body ? (
                          /* 4. Normal Text Message */
                          <Text
                            selectable
                            style={{
                              color: '#FFFFFF',
                              fontSize: 15,
                              lineHeight: 21,
                              fontFamily: 'Manrope_500Medium',
                            }}
                          >
                            {body}
                          </Text>
                        ) : null}

                        {/* Timestamp (e.g. pm 3:02, pm 3:20) */}
                        <Text
                          style={{
                            color: '#7C8494',
                            fontSize: 11,
                            alignSelf: 'flex-end',
                            marginTop: 6,
                          }}
                        >
                          {formatChatTime(item.postedAt)}
                        </Text>
                      </PressableBounce>
                    </View>
                  </View>
                </View>
              );
            }}
          />
        )}

        {/* 3. Bottom Bar: Smart Quick Reply */}
        {isChatApp ? (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: '#20232C',
              borderTopWidth: 1,
              borderTopColor: 'rgba(255,255,255,0.06)',
              paddingHorizontal: 12,
              paddingVertical: 8,
              gap: 10,
            }}
          >
            <TextInput
              placeholder="Please enter keywords"
              placeholderTextColor="#7C8494"
              value={inputText}
              onChangeText={setInputText}
              onSubmitEditing={() => void handleSend()}
              returnKeyType="send"
              style={{
                flex: 1,
                height: 44,
                fontSize: 15,
                color: '#FFFFFF',
                paddingHorizontal: 10,
              }}
            />

            <PressableBounce
              disabled={sending}
              onPress={() => void handleSend()}
              scaleTo={0.88}
              hitSlop={8}
              style={{
                width: 40,
                height: 40,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="paper-plane" size={22} color="#FFFFFF" />
            </PressableBounce>
          </View>
        ) : null}
      </KeyboardAvoidingView>
      {/* Fullscreen Image Preview Modal */}
      <Modal
        visible={previewImage !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setPreviewImage(null)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', justifyContent: 'center', alignItems: 'center' }}>
          <Pressable
            onPress={() => setPreviewImage(null)}
            style={{
              position: 'absolute',
              top: top + 16,
              right: 20,
              zIndex: 10,
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: 'rgba(255,255,255,0.2)',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name="close" size={26} color="#FFFFFF" />
          </Pressable>

          {previewImage ? (
            <Image
              source={{ uri: previewImage }}
              style={{ width: '100%', height: '80%' }}
              resizeMode="contain"
            />
          ) : null}
        </View>
      </Modal>
    </SafeAreaView>
  );
}
