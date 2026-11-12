# NotiCatch — Private Notification History & Deleted Message Recovery for Android

**NotiCatch** (by **Team Risk Made**) is a high-performance, privacy-first Android application designed to automatically capture, organize, and safeguard your incoming notifications. It allows you to search historical notifications, recover sender-deleted messages, view attached media (photos & voice notes), and seamlessly jump directly into original conversations and emails with a single tap.

All captured notifications remain **on your device** in a private local SQLite database and are never uploaded. The app contains no advertising or analytics SDKs. Internet access is used only for subscription verification (Google Play Billing + RevenueCat) and update checks (Google Play In-App Updates, with a version file on GitHub as fallback).

---

## 📱 App Context & Core Highlights

### 1. 💬 Grouped Messages & Smart Conversations
- **Default Messages Landing:** When opening NotiCatch, users land immediately on the **Messages** screen.
- **Unified Contact Conversations:** Messages from chat apps (messengers, team chat, SMS) are neatly grouped by contact/sender (1 row per contact instead of repeating duplicate notifications).
- **Accurate Count Badges:** Displays exact unread and total message counts for each sender.
- **Latest Message Previews:** Always shows the latest message text and formatted timestamps.

### 2. 🗑️ Deleted Message Recovery ("DELETED BY SENDER")
- **Real-time Deletion Detection:** Automatically detects when messages are revoked (e.g., WhatsApp *"This message was deleted"* or Messenger unsent messages).
- **Persistent Archive:** Keeps the original captured text and photo intact, marked with a prominent red **DELETED BY SENDER** banner.

### 3. 🖼️ Genuine Media Capture & Playback
- **Photo Extraction:** Captures full-resolution images from `BigPictureStyle`, `EXTRA_PICTURE_ICON`, and `EXTRA_MESSAGES` payloads.
- **Fullscreen Image Viewer:** Tap photos to view them in high quality without opening third-party messengers.
- **Native Voice Note Player:** Plays recorded voice notes natively with interactive waveforms, duration timers, and playback controls.

### 4. 🚀 Direct Notification Intent Redirection
- **Tap to Open Real App:** Tapping any chat bubble or notification card directly triggers Android's native `PendingIntent` (`openNotification`).
- **Context-Aware Navigation:**
  - Tapping an email opens Gmail/Outlook straight to that specific email message.
  - Tapping a chat message opens WhatsApp/Messenger/Teams directly to that sender's chat thread.
- **Clean UI:** Redundant "Open App" or "Share" buttons have been removed in favor of intuitive direct-touch navigation.

### 5. 🛡️ 100% Local & Privacy-Focused
- **Notification data never leaves the device:** Internet is used only for subscription verification and update checks. No notification content is ever transmitted.
- **PIN & Biometric Security:** Salted and iterated SHA-256 PIN authentication backed by the Android Keystore, with fingerprint/face unlock and auto-lock timers.
- **Notification Exclusions:** Block specific apps from being recorded via the "Block notifications" screen.
- **Retention & Auto-Cleanup:** Automatically delete logs older than 7, 15, 30, or 90 days, with options to protect favorites and archived items.

### 6. ⚙️ More & Settings Management
- **VIP & Pro Banner:** Quick-access modal highlighting features.
- **App Management:** Block notifications per package with easy toggle switches.
- **Help & Support:** Directly compose an email to support (`teamriskmade@gmail.com`).
- **Privacy Policy & About:** Dedicated on-device screens detailing data practices and version specs.

---

## 🏗️ Technology Stack & Architecture

- **Framework:** Expo SDK 58 · React Native 0.88 · React 19 · TypeScript (Strict mode)
- **Routing:** Expo Router v4 (File-based navigation with native modals)
- **State Management:** Zustand (Persisted settings, security lock, and real-time data bus)
- **Native Android Module (`modules/keepsake-notifications`):**
  - **`KeepsakeListenerService.kt`:** Android `NotificationListenerService` capturing incoming notifications, media payloads, and deletion events.
  - **`NotificationDb.kt`:** Thread-safe SQLite engine with schema migrations, conversation grouping, and full-text search.
  - **`ReplyManager.kt`:** Tracks active `PendingIntent` instances for instant redirection and inline quick replies.
  - **`NotificationStatusManager.kt`:** Manages ongoing status bar drawer alert with custom icon silhouette (`ic_stat_noticatch`).
- **Android Target:** `compileSdk 37`, `targetSdk 35/36`, `minSdk 26/29`.

---

## 📂 Project Structure

```
├── android/                             # Android native Gradle project
├── modules/
│   └── keepsake-notifications/          # Custom native Kotlin Expo module
│       ├── android/src/main/java/expo/modules/keepsake/
│       │   ├── KeepsakeListenerService.kt   # Notification capture & media extraction
│       │   ├── NotificationDb.kt            # SQLite database & query engine
│       │   ├── ReplyManager.kt              # PendingIntent routing & quick reply
│       │   └── NotificationStatusManager.kt # Notification drawer status manager
│       └── src/index.ts                 # TypeScript native bridge definitions
├── src/
│   ├── app/                             # Expo Router screens
│   │   ├── (tabs)/                      # Main Tab Pager (Messages, Notifications, More)
│   │   ├── chat/thread.tsx              # Conversation thread with photos & voice notes
│   │   ├── notification/[id].tsx        # Notification detail screen
│   │   ├── app-chats/[package].tsx      # App-specific conversation grouping
│   │   ├── apps.tsx                     # Block notifications / app manager
│   │   ├── settings/                    # Settings, Retention, Security, Privacy, About
│   │   └── onboarding.tsx               # Permission request & onboarding wizard
│   ├── components/                      # Reusable UI components & custom dialogs
│   ├── data/                            # Repository & lifecycle sync
│   ├── lib/                             # Formatting, privacy policy, retention logic
│   └── store/                           # Zustand stores (settings, security, access)
└── docs/                                # Privacy policy & testing documentation
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 20+
- JDK 17+ (Java 17 or Java 21)
- Android SDK (platform-tools, build-tools 37.0.0)

### Installation
```bash
# Clone the repository
git clone https://github.com/teamriskmade/noticatch.git
cd noticatch

# Install dependencies
npm install

# Run static type-checking
npm run typecheck

# Run test suite (60/60 passing tests)
npm test
```

### Local Android Build & Execution
```bash
# Compile native Kotlin module
cd android && ./gradlew :keepsake-notifications:compileReleaseKotlin && cd ..

# Run on connected Android device or emulator
npx expo run:android
```

---

## 🔒 Security & Privacy Commitments

1. **Local Isolation:** Notifications are saved only to internal SQLite application storage (`context.getDatabasePath(...)`). Android cloud backups and transfer backups are disabled (`android:allowBackup="false"`).
2. **Zero Network Transmission:** Release builds completely omit network permissions. No analytics, tracking tokens, or ads exist.
3. **Contact & Legal:** Developed and maintained by **Team Risk Made**. For questions or feedback, reach out to `teamriskmade@gmail.com`.
