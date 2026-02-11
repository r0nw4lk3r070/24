# Nalid24 Messenger

Privacy-focused messaging with 24-hour auto-delete. No phone number, no email, no tracking.

## Features

- **End-to-end encryption** — AES-256 with per-chat shared secrets
- **24-hour auto-delete** — messages expire automatically
- **Push notifications** — works even when the app is closed
- **Fingerprint / PIN lock** — biometric or 4-digit PIN on launch
- **QR code contact exchange** — scan to add, no phone numbers
- **Unread indicators** — blue dot for new messages
- **Delivery receipts** — sent ✓, delivered ✓✓, read ✓✓ (blue)
- **Online/offline presence** — see when contacts are active
- **Self-distribution** — share the app via QR code → landing page → APK download

## Download

**[Download APK](https://github.com/r0nw4lk3r070/24/releases/latest/download/app-release.apk)**

Or scan the QR code from someone who already has the app.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React Native 0.73 + Expo ~50 |
| Language | TypeScript |
| Messaging | Firebase Realtime Database (europe-west1) |
| Notifications | FCM v1 API + Cloud Functions |
| Encryption | crypto-js AES-256 + expo-crypto |
| Auth | expo-local-authentication (biometric/PIN) |
| Storage | AsyncStorage (local) |
| Hosting | Firebase Hosting → GitHub Releases |

## Project Structure

```
src/
  components/     ChatBubble, EmojiPicker, QRCodeDisplay, QRCodeScanner
  screens/        AuthScreen, ChatScreen, ContactsScreen, ProfileScreen,
                  InviteScreen, LockScreen
  services/       authService, contactService, contactSyncService,
                  encryptionService, firebaseConfig, firebaseMessageService,
                  messageService, notificationService, presenceService
  navigation/     AppNavigator
  hooks/          useAuth
  types/          index
functions/        Cloud Functions (sendMessageNotification, cleanupOldMessages,
                  updateUserPresence, handleReadReceipt)
public/           Landing page (Firebase Hosting)
```

## Build & Deploy

```bash
# Install dependencies
npm install

# Generate native Android project
npx expo prebuild

# Bundle JS + build release APK
npx react-native bundle --platform android --dev false \
  --entry-file index.js \
  --bundle-output android/app/src/main/assets/index.android.bundle \
  --assets-dest android/app/src/main/res
cd android && ./gradlew assembleRelease && cd ..

# Install on connected device
adb install -r android/app/build/outputs/apk/release/app-release.apk

# Deploy Cloud Functions
firebase deploy --only functions

# Deploy landing page
firebase deploy --only hosting
```

## Documentation

- [Firebase Setup](docs/FIREBASE_SETUP.md) — Database, functions, hosting
- [Session Migration Plan](docs/SESSION_MIGRATION.md) — Future: replace Firebase with Session Network

## License

MIT