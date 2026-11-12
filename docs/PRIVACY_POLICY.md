# NotiCatch Privacy Policy
_Last updated: 12 November 2026 — Effective for NotiCatch by Team Risk Made_

**1. Summary.**
NotiCatch ("we", "our", or "the app"), developed by Team Risk Made, is a notification history and deleted message recovery utility for Android. We respect your privacy: **the notifications and messages NotiCatch captures never leave your device.** They are not uploaded, synced, or sent to us or anyone else. The app shows no advertisements, contains no analytics or tracking SDKs, and we operate no servers of our own. The app does have internet access (`android.permission.INTERNET`), used only for subscription verification and update checks, as described in Section 5.

**2. Data Accessed & Notification Listener Service.**
When you explicitly grant Notification Access (`android.permission.BIND_NOTIFICATION_LISTENER_SERVICE`) in Android settings, NotiCatch receives notification payloads posted by other apps on your device. This includes:
- Application package name and app label
- Notification title, text message content, and timestamp
- Notification category and dismissal state
- Media previews (attached photos or voice notes where provided in notification extras)

NotiCatch only reads data that Android passes to the notification listener. Any data hidden or redacted by Android (e.g., sensitive lock-screen content) is not received.

**3. Purpose of Processing.**
The collected notification data is processed solely for the following user-facing purposes:
- Providing an on-device searchable archive of missed or dismissed notifications
- Grouping conversation messages by contact for easy reading
- Recovering sender-deleted messages for your personal reference
- Allowing single-tap native redirection back to the originating app via Android's `PendingIntent`

**4. Storage and Data Security.**
- All notification records are stored in a private local SQLite database within NotiCatch's sandboxed internal app storage.
- Cloud and device-to-device auto-backups (`android:allowBackup="false"`) are strictly disabled to prevent notification data from leaking to cloud storage.
- PIN codes are hashed using cryptographic salt iterations and secured via the Android Keystore system.
- Biometric authentication (fingerprint/face) utilizes Android's official `BiometricPrompt` API; biometric data is processed entirely by the device hardware and is never accessible to NotiCatch.

**5. Internet Use and Third-Party Services.**
NotiCatch never transmits captured notification content. Internet access is used only for:

- **Subscriptions (VIP).** Payments are processed by **Google Play Billing**. Subscription status is verified through **RevenueCat** (RevenueCat, Inc.), which receives an anonymous app-generated user ID, purchase/receipt details, app version and basic device information (such as OS version, country/store and IP address). RevenueCat never receives notification content. See RevenueCat's privacy policy: https://www.revenuecat.com/privacy
- **Update checks.** The app asks **Google Play** (In-App Updates) whether a newer version exists, and may download a small public version file from **GitHub** (`raw.githubusercontent.com`) containing release notes. No identifiers are sent, but GitHub, like any web server, receives your IP address and standard request information.

We do not sell, rent, or share personal data. If you deliberately use the "Export" or "Backup" features, the resulting file is passed directly to Android's system share sheet, where you control the final destination.

**6. User Rights & Data Deletion.**
You maintain absolute control over your data at all times:
- **Block Apps:** You can exclude specific applications from being captured.
- **Delete Specific or All Data:** You can delete individual notifications, clear entire chat histories, or execute "Clear All Data" directly from within the app.
- **Auto-Cleanup:** You can configure automatic retention rules (e.g., 7, 15, 30, or 90 days).
- **Revoke Permissions:** You can revoke Notification Access at any time via Android System Settings.
- **Complete Erasure:** Uninstalling the app or clearing app storage in Android Settings instantly and permanently deletes all stored notification history.

**7. Children's Privacy.**
NotiCatch is not directed toward children under the age of 13, and we do not knowingly collect information from children.

**8. Changes & Contact Information.**
If this Privacy Policy is updated, the changes will be reflected within the app.
For questions, support, or privacy inquiries, contact us at:
- **Developer:** Team Risk Made
- **Email:** teamriskmade@gmail.com
