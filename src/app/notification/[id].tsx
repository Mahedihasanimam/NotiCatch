import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Share,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppIcon } from '@/components/AppIcon';
import { Avatar } from '@/components/Avatar';
import { promptNotificationPermissionIfNeeded, showAppConfirm, showAppToast } from '@/components/CustomDialog';
import { PressableBounce } from '@/components/PressableBounce';
import { EmptyState, ErrorState, LoadingState } from '@/components/states';
import { Text } from '@/components/ui';
import {
  canReply,
  deleteNotifications,
  getNotification,
  sendReply,
  setArchived,
  setFavorite,
} from '@/data/repository';
import { useLiveQuery } from '@/hooks/useLiveQuery';
import { formatDateTime, formatTime } from '@/lib/time';
import { useDataVersion } from '@/store/dataVersion';
import { radius, space } from '@/theme';

export default function NotificationDetail() {
  const { top, bottom } = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const nid = Number(id);
  const bump = useDataVersion((s) => s.bump);
  const { data: n, loading, error, reload } = useLiveQuery(() => getNotification(nid), [nid]);

  const [replyText, setReplyText] = useState('');
  const [replying, setReplying] = useState(false);
  const [replyAvailable, setReplyAvailable] = useState(false);

  useEffect(() => {
    if (n) {
      const chatKey = n.title ? `${n.packageName}:${n.title}` : null;
      void canReply(n.sbnKey, chatKey).then(setReplyAvailable);
    }
  }, [n]);

  if (loading) {
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
        <LoadingState />
      </SafeAreaView>
    );
  }

  if (error || !n) {
    return (
      <SafeAreaView
        edges={[]}
        style={[
          { flex: 1, backgroundColor: '#232630', padding: 20 },
          {
            paddingTop: top,
            paddingBottom: bottom,
          },
        ]}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
          <PressableBounce hitSlop={10} onPress={() => router.back()} scaleTo={0.9}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </PressableBounce>
        </View>
        <EmptyState
          icon="trash-outline"
          title="Notification not found"
          message={error || 'This notification may have been removed or deleted.'}
          actionLabel="Go Back"
          onAction={() => router.back()}
        />
      </SafeAreaView>
    );
  }

  const mutate = async (fn: () => Promise<unknown>, toastMsg: string) => {
    try {
      await fn();
      bump();
      showAppToast(toastMsg);
    } catch {
      showAppToast('Action failed', 'error');
    }
  };

  const share = () => {
    const text = [n.title, n.bigText ?? n.text].filter(Boolean).join('\n');
    void Share.share({ message: text, title: n.appName });
  };

  const handleSendReply = async () => {
    if (!replyText.trim()) return;
    if (!promptNotificationPermissionIfNeeded()) return;
    setReplying(true);
    try {
      const chatKey = n.title ? `${n.packageName}:${n.title}` : null;
      const success = await sendReply(n.sbnKey, chatKey, replyText.trim());
      if (success) {
        showAppToast(`Reply sent to ${n.title ?? n.appName}!`);
        setReplyText('');
        bump();
      } else {
        showAppToast('Notification reply is no longer active in tray', 'error');
      }
    } catch {
      showAppToast('Reply delivery failed', 'error');
    } finally {
      setReplying(false);
    }
  };

  const handleDelete = () => {
    showAppConfirm(
      'Delete this notification?',
      'It will be removed permanently from your saved history.',
      async () => {
        await deleteNotifications([n.id]);
        bump();
        showAppToast('Notification deleted');
        router.back();
      },
      true,
      'Delete',
    );
  };

  const imageUri = n.mediaPath
    ? n.mediaPath.startsWith('file://')
      ? n.mediaPath
      : `file://${n.mediaPath}`
    : null;

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
      {/* 1. Header: Back + App Icon + App Name + Share + Delete */}
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

          <AppIcon packageName={n.packageName} name={n.appName} size={28} shape="squircle" />

          <Text
            numberOfLines={1}
            style={{
              fontSize: 18,
              fontFamily: 'Manrope_700Bold',
              color: '#FFFFFF',
              flex: 1,
            }}
          >
            {n.appName}
          </Text>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
          {/* Favorite toggle */}
          <PressableBounce
            scaleTo={0.9}
            hitSlop={8}
            onPress={() =>
              void mutate(
                () => setFavorite([n.id], !n.isFavorite),
                n.isFavorite ? 'Removed from favorites' : 'Saved to favorites',
              )
            }
          >
            <Ionicons
              name={n.isFavorite ? 'star' : 'star-outline'}
              size={22}
              color={n.isFavorite ? '#FFC107' : '#7C8494'}
            />
          </PressableBounce>

          {/* Share */}
          <PressableBounce scaleTo={0.9} hitSlop={8} onPress={share}>
            <Ionicons name="share-outline" size={22} color="#FFFFFF" />
          </PressableBounce>

          {/* Delete */}
          <PressableBounce scaleTo={0.9} hitSlop={8} onPress={handleDelete}>
            <Ionicons name="trash-outline" size={22} color="#EF4444" />
          </PressableBounce>
        </View>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        >
          {/* 2. Sender Card */}
          <View
            style={{
              backgroundColor: '#2E323F',
              borderRadius: 16,
              padding: 16,
              marginBottom: 14,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 14,
            }}
          >
            <Avatar
              name={n.title ?? n.appName}
              packageName={n.packageName}
              appName={n.appName}
              size={50}
              showAppBadge={false}
            />

            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: 17,
                  fontFamily: 'Manrope_700Bold',
                  color: '#FFFFFF',
                  marginBottom: 2,
                }}
              >
                {n.title ?? n.appName}
              </Text>
              <Text style={{ fontSize: 13, color: '#7C8494' }}>
                {formatDateTime(n.postedAt)}
              </Text>
            </View>
          </View>

          {/* 3. Deleted Message Notice Banner (if message was deleted by sender) */}
          {n.isDeleted ? (
            <View
              style={{
                backgroundColor: '#4A2228',
                borderRadius: 14,
                padding: 14,
                marginBottom: 14,
                borderWidth: 1,
                borderColor: '#EF4444',
                flexDirection: 'row',
                alignItems: 'center',
                gap: 10,
              }}
            >
              <Ionicons name="trash" size={22} color="#EF4444" />
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: 'Manrope_700Bold', color: '#EF4444', fontSize: 14 }}>
                  DELETED BY SENDER
                </Text>
                <Text style={{ color: '#FCA5A5', fontSize: 12.5, marginTop: 2 }}>
                  The sender deleted this message from {n.appName}, but it was captured and saved here.
                  {n.deletedAt ? ` (Detected at ${formatTime(n.deletedAt)})` : ''}
                </Text>
              </View>
            </View>
          ) : null}

          {/* 4. Message Content Body Card */}
          <View
            style={{
              backgroundColor: '#2E323F',
              borderRadius: 16,
              padding: 18,
              marginBottom: 14,
            }}
          >
            <Text
              style={{
                fontSize: 12,
                fontFamily: 'Manrope_700Bold',
                color: '#7C8494',
                letterSpacing: 0.8,
                marginBottom: 10,
              }}
            >
              MESSAGE CONTENT
            </Text>

            {n.text ? (
              <Text
                selectable
                style={{
                  fontSize: 16,
                  color: '#FFFFFF',
                  lineHeight: 24,
                  fontFamily: 'Manrope_400Regular',
                }}
              >
                {n.text}
              </Text>
            ) : null}

            {n.bigText && n.bigText !== n.text ? (
              <Text
                selectable
                style={{
                  fontSize: 15,
                  color: '#D1D5DB',
                  lineHeight: 22,
                  marginTop: 10,
                }}
              >
                {n.bigText}
              </Text>
            ) : null}

            {n.subText ? (
              <Text style={{ fontSize: 13, color: '#7C8494', marginTop: 10 }}>
                {n.subText}
              </Text>
            ) : null}

            {!n.text && !n.bigText ? (
              <Text style={{ color: '#7C8494', fontStyle: 'italic' }}>
                No textual content was included with this notification.
              </Text>
            ) : null}

            {/* Attached Image if media path present */}
            {imageUri ? (
              <View style={{ marginTop: 16 }}>
                <Image
                  source={{ uri: imageUri }}
                  style={{
                    width: '100%',
                    height: 220,
                    borderRadius: radius.md,
                    backgroundColor: '#343846',
                  }}
                  resizeMode="contain"
                />
              </View>
            ) : null}
          </View>

          {/* 5. Direct Reply Card */}
          <View
            style={{
              backgroundColor: '#2E323F',
              borderRadius: 16,
              padding: 16,
              marginBottom: 14,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <Ionicons name="arrow-undo" size={18} color="#0A6C74" />
              <Text style={{ fontFamily: 'Manrope_700Bold', fontSize: 14.5, color: '#FFFFFF' }}>
                Direct Reply
              </Text>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <TextInput
                placeholder={`Reply to ${n.title ?? n.appName}...`}
                placeholderTextColor="#7C8494"
                value={replyText}
                onChangeText={setReplyText}
                style={{
                  flex: 1,
                  height: 44,
                  backgroundColor: '#363A49',
                  borderRadius: 10,
                  paddingHorizontal: 14,
                  color: '#FFFFFF',
                  fontSize: 14.5,
                }}
              />

              <PressableBounce
                disabled={replying || !replyText.trim()}
                onPress={() => void handleSendReply()}
                scaleTo={0.9}
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 10,
                  backgroundColor: replyText.trim() ? '#0A6C74' : '#363A49',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons
                  name="paper-plane"
                  size={20}
                  color={replyText.trim() ? '#FFFFFF' : '#7C8494'}
                />
              </PressableBounce>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
