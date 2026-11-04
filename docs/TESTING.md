# Real-device test plan

Use a physical Android 10+ phone (also try Android 13+ sideloaded for restricted settings). Install the `preview` APK.

## Post test notifications without other apps
```bash
adb shell cmd notification post -S bigtext -t "Ana" Tag1 "Lunch at 1?"       # posts as shell
adb shell cmd notification post -t "Same key" Tag1 "Updated text"             # update same tag
adb logcat -s KeepsakeListener                                                 # service logs
adb shell dumpsys notification | grep -A3 keepsake                             # listener state
adb shell cmd notification allow_listener com.mehedi.noticatch.app/expo.modules.keepsake.KeepsakeListenerService   # grant w/o UI (debug)
adb shell cmd notification disallow_listener com.mehedi.noticatch.app/expo.modules.keepsake.KeepsakeListenerService # revoke
```

## Checklist
1. **Capture after granting:** onboarding → enable access → post a test notification → appears in History within a second.
2. **Removal keeps history:** dismiss the notification → entry stays, shows "Dismissed on device".
3. **WhatsApp / Messenger:** send yourself a message from another device; text is saved only if the app exposes it (not when hidden by lock-screen privacy / redaction). Note results.
4. **App filtering:** Apps tab → toggle an app off → new notifications from it are not saved; old ones remain. Select all / Deselect all on a searched subset.
5. **Search & date filter:** search title and body; Date chip → presets and custom range; App chip multi-select.
6. **Favorites & archive:** star, archive (disappears from History, visible in Archive), restore; Dashboard counts update.
7. **Automatic cleanup:** Settings → Automatic cleanup → 7 days; insert old rows via restore of a backup with old `postedAt`; "Run cleanup now"; favorites/archived survive per toggles.
8. **Reboot:** reboot phone, don't open the app, post notifications, open app → they were captured (`onListenerConnected` also imports active notifications).
9. **Permission revocation:** revoke in system settings → open app → red banner; re-grant → capture resumes (use `requestRebind` on process start).
10. **PIN & biometrics:** set PIN, background the app → locks; wrong PIN ×5 → delay; biometric prompt does not cause a lock loop; back button doesn't bypass lock; remove PIN.
11. **Force-stop persistence:** Settings → Apps → NotiCatch → Force stop; reopen: history intact; service rebinds after next notification/boot.
12. **Export & restore:** export CSV (open in a spreadsheet; cells starting with `=` are prefixed `'`), JSON; create backup, clear all history, restore; try a corrupted/edited backup → rejected with message, nothing imported.
13. **Release sanity:** `adb shell dumpsys package com.mehedi.noticatch.app | grep permission` shows no INTERNET; airplane-mode irrelevant.

## Kotlin unit tests
After `npx expo prebuild --platform android`: `cd android && ./gradlew :keepsake-notifications:testDebugUnitTest`.
