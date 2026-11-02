# NotiCatch — private notification history for Android

NotiCatch saves the notifications your Android phone shows so you can search, favorite, archive and export them later. All data stays on the device: no accounts, no servers, and the **release build does not even hold the INTERNET permission**.

- **Stack:** Expo SDK 58 · React Native 0.88 · React 19.3 · TypeScript (strict) · Expo Router · Zustand
- **Native:** Kotlin Expo module (`modules/keepsake-notifications`) with a `NotificationListenerService` and a SQLite database (versioned migrations)
- **Android levels:** `compileSdk 37`, `buildTools 37.0.0`, `targetSdk 36`, `minSdk 29` (Android 10+). Configured in `app.config.ts`.
- This is an original app (name, icon, UI). It is not affiliated with Notisave.

> **Targeting API 37:** `targetSdkVersion` is 36, the level React Native 0.88 itself is tested against. To target 37, change it in `app.config.ts` and re-test on an Android 17 device (new behavior changes apply when you raise the target).

## Features

Dashboard (totals, today, 7-day chart, top apps, recent, quick search/favorites/archive, clear all with confirmation) · history grouped by date or app · search · filter by app and date range (calendar) · favorite / archive / restore / delete · multi-select with bulk actions and export · app include/exclude with select-all · PIN lock, biometrics, auto-lock, optional screenshot blocking · retention (7/15/30/90 days/never, keep favorites/archived) · CSV/JSON export, validated backup & restore · light/dark/system theme · permission onboarding · privacy policy.

## Project layout

```
src/app/            Expo Router screens (tabs, onboarding, detail, settings/*)
src/components/     UI building blocks
src/data/           repository (typed native access), exporter, lifecycle wiring
src/lib/            pure logic: time, grouping, csv, backup validation, pin, retention
src/store/          zustand: settings (persisted), security, access, dataVersion
src/theme/          palette, type scale, ThemeProvider
modules/keepsake-notifications/
  android/…/NotificationDb.kt          single DB owner, migrations, serialized writes
  android/…/KeepsakeListenerService.kt capture, update de-dup, removal tracking, rebind
  android/…/KeepsakeNotificationsModule.kt  JS bridge
  android/src/test/…                    JVM unit tests (query builder, hashing)
docs/               privacy policy, device test plan
```

## Setup

Requirements: Node 20+, JDK 17+, Android SDK (for local builds) or an Expo account (EAS). **Expo Go is not supported** — a custom dev build is required.

```bash
npm install
npm run typecheck && npm test      # 47 tests
npx expo-doctor                    # run online
```

### Production & testing builds
```bash
npx eas-cli login && npx eas-cli init       # sets EAS project id
npm run build:prod                          # production AAB (Google Play)
npm run build:preview                       # standalone test APK
npm run build:local                         # local test APK via EAS
npx expo prebuild --platform android && npm run android   # local run, needs Android SDK
```

### Release builds (no Metro needed — JS is bundled as Hermes bytecode)
```bash
npm run build:preview   # signed APK for sideloading/testing  (APP_VARIANT=preview)
npm run build:prod      # AAB for Play Store                  (APP_VARIANT=production)
npm run build:local     # same preview build on your machine
```
`preview` and `production` strip `INTERNET`, `SYSTEM_ALERT_WINDOW` and external-storage permissions and disable `allowBackup`. Set `EAS_PROJECT_ID` (or run `eas init`) and let EAS manage the signing keystore.

## Granting access (important)

1. Open the app, follow onboarding, tap **Open notification access**, enable NotiCatch.
2. **Sideloaded APKs on Android 13+:** the switch can be greyed out. Open *App info → ⋮ → Allow restricted settings*, then retry. The app links to App info for this.
3. Revoking access: Android stops delivering notifications; NotiCatch detects it on resume and shows a banner. History is kept.

## Android limitations (and what the app does about them)

- Only what Android exposes to listeners can be saved. Redacted ("sensitive content hidden") or empty notifications are skipped; anything posted while access was off cannot be recovered. WhatsApp/Messenger text is saved only when those apps include it in the notification.
- Group summaries are skipped by default (setting) to avoid duplicates; ongoing/foreground-service notifications are off by default (setting).
- Re-posts of an unchanged, still-showing notification are de-duplicated; changed content (new message) is a new entry. Removal (dismissed / opened / cancelled by app) is recorded on the entry, never deleted.
- App list uses a launcher-intent `<queries>` entry instead of `QUERY_ALL_PACKAGES`; apps without a launcher icon are still captured (shown by package name).
- Some OEMs kill background services; the service rebinds itself (`requestRebind`) and the app asks for a rebind after process start. Exempt NotiCatch from battery optimization on aggressive ROMs.

## Security model

PIN: 4–8 digits, salted and iterated SHA-256, stored in Android Keystore-backed `expo-secure-store`; failed-attempt backoff (5 free tries, then 30 s doubling to 15 min). Locks when leaving the app (configurable delay), blocks the back button, hides content from accessibility while locked. Biometrics are a shortcut with PIN fallback. The notification database itself is **not encrypted at rest** (it relies on Android's app sandbox and device encryption); say so in store listings.

## Testing

```bash
npm test                 # unit + integration (repository with mocked native module, security store, components)
npm run test:ci          # with coverage
npm run test:native      # Kotlin JVM tests; run after `expo prebuild` (needs Android SDK)
```
Real-device checklist and `adb` commands: [`docs/TESTING.md`](docs/TESTING.md).

## Verified vs. not verified in this delivery

Verified in the build environment: strict TypeScript, 47 Jest tests, Android release JS bundle (`expo export`), `expo prebuild` output (manifest, SDK levels, autolinking of the native module), the pure-Kotlin query/hash logic executed, and the DB/service/app-catalog Kotlin compiled against `android.jar` (API 34).
**Not verifiable there (no Android SDK/device):** the Gradle build, the APK/AAB, the thin `KeepsakeNotificationsModule.kt` bridge compile, and on-device behavior. Run `npm run build:preview` and the checklist in `docs/TESTING.md` before shipping; fix anything the first Gradle build reports.

## Privacy policy

Draft in [`docs/PRIVACY_POLICY.md`](docs/PRIVACY_POLICY.md); the same text ships in-app (`src/lib/privacyPolicy.ts`). Add a contact email and have it reviewed before publishing. For Google Play, `BIND_NOTIFICATION_LISTENER_SERVICE` apps need a prominent in-app disclosure (onboarding step 2) and a Data Safety form stating no data collected/shared.
