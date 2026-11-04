/** Single source for the in-app policy and docs/PRIVACY_POLICY.md. */
export const PRIVACY_POLICY = {
  title: 'NotiCatch Privacy Policy',
  updated: '4 November 2026',
  sections: [
    { heading: '1. Summary', body: 'NotiCatch by Team Risk Made is an offline notification history and deleted message recovery utility. Everything stays strictly on your device. The release app requests NO internet permission and operates zero servers, advertising, or tracking SDKs.' },
    { heading: '2. Data Accessed', body: 'When you enable Notification Access in Android settings, NotiCatch reads incoming notification titles, message bodies, sender labels, and media attachments. It only reads what Android exposes to the notification listener. Hidden or redacted notifications cannot be saved.' },
    { heading: '3. Purpose of Processing', body: 'Collected notification data is used solely to provide searchable notification archives, conversation groupings, and deleted message recovery for your personal viewing and reference.' },
    { heading: '4. Storage & Security', body: 'Notifications are stored in a private SQLite database inside NotiCatch’s internal sandboxed storage. Android cloud and device-transfer auto-backup is disabled (allowBackup=false). PIN codes are stored as salted hashes in the Android Keystore, and biometric authentication uses Android’s official BiometricPrompt API.' },
    { heading: '5. Data Sharing', body: 'Zero personal data is transmitted, uploaded, or shared by NotiCatch. Exported or backed-up files are handed directly to Android’s share sheet under your explicit control.' },
    { heading: '6. Your Controls & Data Deletion', body: 'You can exclude apps, pause capture, delete single or all notifications, set automatic retention cleanup (7/15/30/90 days), and revoke Notification Access at any time in Android settings. Uninstalling the app permanently erases all saved records.' },
    { heading: '7. Children’s Privacy', body: 'NotiCatch is not directed at children under the age of 13, and does not knowingly collect data from children.' },
    { heading: '8. Contact Information', body: 'Developed by Team Risk Made. For questions, support, or privacy inquiries, contact: teamriskmade@gmail.com.' },
  ],
} as const;
