import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  Image,
  KeyboardAvoidingView,
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
  queryNotifications,
  sendReply,
} from '@/data/repository';
import { useLiveQuery } from '@/hooks/useLiveQuery';
import type { NotificationRecord } from '@/lib/types';
import { useDataVersion } from '@/store/dataVersion';
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

export default function ChatThread() {
  const { top, bottom } = useSafeAreaInsets();
  const { packageName, title, appName, notificationId } = useLocalSearchParams<{
    packageName: string;
    title: string;
    appName?: string;
    notificationId?: string;
  }>();

  const bump = useDataVersion((s) => s.bump);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const flatListRef = useRef<FlatList<NotificationRecord>>(null);

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
    const all = await queryNotifications({ packages: [packageName], limit: 100 });
    if (notificationId) {
      const specific = all.filter((n) => String(n.id) === String(notificationId));
      if (specific.length > 0) return specific;
    }
    if (title) {
      const matched = all.filter(
        (n) =>
          n.title === title ||
          n.subText === title ||
          (n.text && n.text.includes(title)),
      );
      if (matched.length > 0) return matched;
    }
    return all;
  }, [packageName, title, notificationId]);

  const { data: rawMessages, loading, error, reload } = useLiveQuery(fetchMessages, [
    packageName,
    title,
    notificationId,
  ]);

  // Sort messages chronologically (oldest first, newest at bottom)
  const messages = useMemo(() => {
    if (!rawMessages) return [];
    const sorted = [...rawMessages].sort((a, b) => a.postedAt - b.postedAt);
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      return sorted.filter(
        (m) =>
          (m.text && m.text.toLowerCase().includes(q)) ||
          (m.title && m.title.toLowerCase().includes(q)),
      );
    }
    return sorted;
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

              const imageUri = item.mediaPath
                ? item.mediaPath.startsWith('file://')
                  ? item.mediaPath
                  : `file://${item.mediaPath}`
                : null;

              const hasImage = Boolean(imageUri);

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
                        onLongPress={() => shareMessage(item)}
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

                        {body ? (
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

                        {/* Attached Media / Image Card (matching Image 2) */}
                        {hasImage && imageUri ? (
                          <View
                            style={{
                              marginTop: 10,
                              borderRadius: 10,
                              overflow: 'hidden',
                              position: 'relative',
                            }}
                          >
                            <Image
                              source={{ uri: imageUri }}
                              style={{
                                width: 250,
                                height: 165,
                                borderRadius: 10,
                                backgroundColor: '#1C1F27',
                              }}
                              resizeMode="cover"
                            />
                            {/* Floating Share Button in bottom right of image (as seen in Image 2) */}
                            <PressableBounce
                              onPress={() => shareMessage(item)}
                              hitSlop={8}
                              scaleTo={0.9}
                              style={{
                                position: 'absolute',
                                bottom: 8,
                                right: 8,
                                width: 28,
                                height: 28,
                                borderRadius: 14,
                                backgroundColor: 'rgba(0,0,0,0.65)',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              <Ionicons name="share-social-outline" size={16} color="#FFFFFF" />
                            </PressableBounce>
                          </View>
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

        {/* 3. Bottom Bar: Smart Action Bar */}
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
        ) : (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-around',
              backgroundColor: '#20232C',
              borderTopWidth: 1,
              borderTopColor: 'rgba(255,255,255,0.06)',
              paddingHorizontal: 16,
              paddingVertical: 10,
            }}
          >
            <PressableBounce
              onPress={() => {
                if (messages.length > 0) shareMessage(messages[messages.length - 1]!);
              }}
              scaleTo={0.94}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 6 }}
            >
              <Ionicons name="share-outline" size={20} color="#FFFFFF" />
              <Text style={{ fontSize: 13, color: '#FFFFFF', fontFamily: 'Manrope_600SemiBold' }}>
                Share
              </Text>
            </PressableBounce>

            <PressableBounce
              onPress={() => {
                showAppToast(`Opening in ${appName || 'App'}...`);
              }}
              scaleTo={0.94}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 6 }}
            >
              <Ionicons name="open-outline" size={20} color="#FFFFFF" />
              <Text style={{ fontSize: 13, color: '#FFFFFF', fontFamily: 'Manrope_600SemiBold' }}>
                Open App
              </Text>
            </PressableBounce>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
