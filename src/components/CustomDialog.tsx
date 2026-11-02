import { Ionicons } from '@expo/vector-icons';
import { create } from 'zustand';
import {
  Animated,
  Modal,
  Pressable,
  View,
} from 'react-native';
import { useEffect, useRef } from 'react';
import { Text } from './ui';
import { openAccessSettings } from '@/data/repository';
import { useAccess } from '@/store/access';
import { radius, space } from '@/theme';

interface DialogOptions {
  title: string;
  message?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  confirmText?: string;
  cancelText?: string;
  destructive?: boolean;
  onConfirm?: () => void | Promise<void>;
  onCancel?: () => void;
}

interface ToastOptions {
  message: string;
  type?: 'success' | 'info' | 'error';
  durationMs?: number;
}

interface DialogState {
  dialog: DialogOptions | null;
  toast: ToastOptions | null;
  showDialog: (opts: DialogOptions) => void;
  hideDialog: () => void;
  showToast: (opts: ToastOptions | string) => void;
  hideToast: () => void;
}

export const useDialog = create<DialogState>((set) => ({
  dialog: null,
  toast: null,
  showDialog: (opts) => set({ dialog: opts }),
  hideDialog: () => set({ dialog: null }),
  showToast: (opts) => {
    const toastOpts: ToastOptions = typeof opts === 'string' ? { message: opts, type: 'success' } : opts;
    set({ toast: toastOpts });
  },
  hideToast: () => set({ toast: null }),
}));

export function showAppAlert(
  title: string,
  message?: string,
  onConfirm?: () => void,
  confirmText = 'OK',
) {
  useDialog.getState().showDialog({
    title,
    message,
    confirmText,
    onConfirm,
  });
}

export function showAppConfirm(
  title: string,
  message: string,
  onConfirm: () => void | Promise<void>,
  destructive = false,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
) {
  useDialog.getState().showDialog({
    title,
    message,
    confirmText,
    cancelText,
    destructive,
    onConfirm,
  });
}

export function showAppToast(message: string, type: 'success' | 'info' | 'error' = 'success') {
  useDialog.getState().showToast({ message, type });
}

export function promptNotificationPermissionIfNeeded(): boolean {
  const { granted, nativeAvailable } = useAccess.getState();
  if (granted || !nativeAvailable) return true;

  useDialog.getState().showDialog({
    title: 'Notification Access Required',
    message:
      'NotiCatch needs Notification Access to automatically save incoming notifications and recover deleted messages. Would you like to enable it in Settings now?',
    confirmText: 'Open Settings',
    cancelText: 'Not Now',
    icon: 'notifications',
    iconColor: '#0D9488',
    onConfirm: () => {
      void openAccessSettings();
    },
  });
  return false;
}

export function GlobalDialogOverlay() {
  const dialog = useDialog((s) => s.dialog);
  const hideDialog = useDialog((s) => s.hideDialog);
  const toast = useDialog((s) => s.toast);
  const hideToast = useDialog((s) => s.hideToast);

  // Toast auto-hide
  const toastOpacity = useRef(new Animated.Value(0)).current;
  const toastTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (toast) {
      Animated.timing(toastOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();

      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
      toastTimerRef.current = setTimeout(() => {
        Animated.timing(toastOpacity, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }).start(() => hideToast());
      }, toast.durationMs ?? 2400);
    }
  }, [toast, hideToast, toastOpacity]);

  return (
    <>
      {/* 1. In-App Toast Pill */}
      {toast ? (
        <Animated.View
          style={{
            position: 'absolute',
            top: 50,
            left: 20,
            right: 20,
            zIndex: 999999,
            alignItems: 'center',
            opacity: toastOpacity,
            pointerEvents: 'none',
          }}
        >
          <View
            style={{
              backgroundColor: '#2E323F',
              borderRadius: radius.pill,
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.12)',
              paddingVertical: 10,
              paddingHorizontal: 18,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.4,
              shadowRadius: 6,
              elevation: 10,
            }}
          >
            <Ionicons
              name={
                toast.type === 'error'
                  ? 'alert-circle'
                  : toast.type === 'info'
                    ? 'information-circle'
                    : 'checkmark-circle'
              }
              size={18}
              color={
                toast.type === 'error'
                  ? '#EF4444'
                  : toast.type === 'info'
                    ? '#38BDF8'
                    : '#10B981'
              }
            />
            <Text
              style={{
                color: '#FFFFFF',
                fontFamily: 'Manrope_600SemiBold',
                fontSize: 14,
              }}
            >
              {toast.message}
            </Text>
          </View>
        </Animated.View>
      ) : null}

      {/* 2. Custom Sleek Modal Dialog (Replaces native Alert) */}
      <Modal
        visible={dialog !== null}
        transparent
        animationType="fade"
        onRequestClose={hideDialog}
      >
        <Pressable
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.65)',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
          }}
          onPress={() => {
            dialog?.onCancel?.();
            hideDialog();
          }}
        >
          <Pressable
            style={{
              width: '100%',
              maxWidth: 340,
              backgroundColor: '#2E323F',
              borderRadius: 20,
              padding: 22,
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.08)',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.4,
              shadowRadius: 12,
              elevation: 12,
            }}
            onPress={(e) => e.stopPropagation()}
          >
            {/* Header Icon if available */}
            {dialog?.icon ? (
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  backgroundColor: dialog.destructive ? '#4A2228' : '#363A49',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 14,
                }}
              >
                <Ionicons
                  name={dialog.icon}
                  size={24}
                  color={dialog.iconColor ?? (dialog.destructive ? '#EF4444' : '#0A6C74')}
                />
              </View>
            ) : null}

            {/* Title */}
            <Text
              style={{
                fontFamily: 'Manrope_700Bold',
                fontSize: 18,
                color: '#FFFFFF',
                marginBottom: dialog?.message ? 8 : 16,
              }}
            >
              {dialog?.title}
            </Text>

            {/* Message Body */}
            {dialog?.message ? (
              <Text
                style={{
                  fontFamily: 'Manrope_400Regular',
                  fontSize: 14.5,
                  lineHeight: 21,
                  color: '#9CA3AF',
                  marginBottom: 20,
                }}
              >
                {dialog.message}
              </Text>
            ) : null}

            {/* Action Buttons */}
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 10 }}>
              {dialog?.cancelText ? (
                <Pressable
                  onPress={() => {
                    dialog.onCancel?.();
                    hideDialog();
                  }}
                  style={{
                    paddingVertical: 10,
                    paddingHorizontal: 16,
                    borderRadius: 10,
                    backgroundColor: 'rgba(255,255,255,0.06)',
                  }}
                >
                  <Text
                    style={{
                      fontFamily: 'Manrope_600SemiBold',
                      fontSize: 14,
                      color: '#9CA3AF',
                    }}
                  >
                    {dialog.cancelText}
                  </Text>
                </Pressable>
              ) : null}

              <Pressable
                onPress={async () => {
                  const cb = dialog?.onConfirm;
                  hideDialog();
                  if (cb) await cb();
                }}
                style={{
                  paddingVertical: 10,
                  paddingHorizontal: 18,
                  borderRadius: 10,
                  backgroundColor: dialog?.destructive ? '#EF4444' : '#0A6C74',
                }}
              >
                <Text
                  style={{
                    fontFamily: 'Manrope_700Bold',
                    fontSize: 14,
                    color: '#FFFFFF',
                  }}
                >
                  {dialog?.confirmText ?? 'OK'}
                </Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}
