/** Single source for the in-app policy and docs/PRIVACY_POLICY.md. Replace the contact line before publishing. */
export const PRIVACY_POLICY = {
  title: 'NotiCatch Privacy Policy',
  updated: '2 November 2026',
  sections: [
    { heading: 'Summary', body: 'NotiCatch saves the notifications your Android device shows so you can read them later. Everything stays on your device. The release app does not request internet access and has no servers, analytics or advertising.' },
    { heading: 'What NotiCatch reads', body: 'After you turn on notification access in Android settings, NotiCatch receives the notifications other apps post: app name, title, text, time, category and whether it was later dismissed. Android decides what is exposed. Content that an app hides, or that Android redacts, cannot be saved, and notifications posted while access was off cannot be recovered.' },
    { heading: 'Where it is stored', body: 'Notifications are kept in a private database inside NotiCatch’s app storage. Android’s cloud and device-transfer backup is disabled for the app. Your PIN is stored only as a salted hash in the Android keystore.' },
    { heading: 'What is shared', body: 'Nothing is transmitted by NotiCatch. If you export or back up, the file is handed to the app you choose in Android’s share sheet; from then on that file is governed by the destination you picked.' },
    { heading: 'Your controls', body: 'You can exclude apps, pause capture, delete single items or everything, set automatic deletion, lock the app with a PIN or biometrics, and revoke notification access at any time in Android settings. Uninstalling the app or clearing its data erases the saved history.' },
    { heading: 'Sensitive content', body: 'Notifications can contain private messages, codes and personal details. Use the PIN lock and exclude apps you do not want stored. NotiCatch does not monitor you for anyone else and has no hidden mode.' },
    { heading: 'Children', body: 'NotiCatch is not directed at children under 13.' },
    { heading: 'Changes and contact', body: 'If this policy changes, the updated version ships inside the app. Contact: teamriskmade@gmail.com.' },
  ],
} as const;
