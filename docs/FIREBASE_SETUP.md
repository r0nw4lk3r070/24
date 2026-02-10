# Firebase & Development Build Setup Guide

## 🔥 Firebase Cloud Messaging Setup

### Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add Project"
3. Name it "Nalid24" (or your preferred name)
4. **Disable Google Analytics** (for privacy)
5. Create project

### Step 2: Add Android App to Firebase

1. In Firebase Console, click "Add app" → Android icon
2. **Android package name**: `com.nalid24` (must match `app.json`)
3. **App nickname**: Nalid24
4. **Debug signing certificate** (optional for now)
5. Click "Register app"

### Step 3: Download google-services.json

1. Download `google-services.json` file
2. Place it in project root: `e:\Nalid24\google-services.json`
3. **Important**: Already in `.gitignore` - don't commit to Git

⚠️ **Note**: Firebase console may suggest different integration methods - use the Android native approach with `google-services.json`. We're building native APKs with EAS Build.

### Step 4: Enable Cloud Messaging

1. In Firebase Console, go to **Build** → **Cloud Messaging**
2. Cloud Messaging API should be enabled automatically
3. Note: You'll need the **Server Key** later for sending notifications

---

## 📱 Development Build Setup

⚠️ **IMPORTANT**: We build native APKs locally with Gradle, not cloud builds.

### What This Gives You:
- ✅ Push notifications (FCM)
- ✅ APK sharing capability
- ✅ Full native features
- ✅ Hot reload while developing in VSCode
- ✅ Build locally on your PC

### Prerequisites

1. **Android device** in Developer Mode (your Xiaomi)
2. **USB cable** or **WiFi debugging** enabled
3. **Second device** (your tablet) for testing APK sharing

### Step 1: Install Dependencies

```bash
npm install
```

This installs:
- Firebase packages
- Expo notifications
- File system & sharing
- Dev client

### Step 2: Generate Native Android Project

```bash
npx expo prebuild
```

This creates the `android/` folder with Gradle build files.

### Step 3: Build and Install on Xiaomi

**Connect your Xiaomi via USB** (Developer Mode + USB debugging enabled)

```bash
npm run android
```

**What happens:**
- Gradle builds APK locally on your PC
- Installs directly to Xiaomi via USB/WiFi
- App launches automatically
- Metro bundler starts

```bash
npm start
```

On your Xiaomi:
- Open the Nalid24 development app
- It will prompt to connect to dev server
- Enter the URL shown in terminal or scan QR

### Step 7: Development Workflow

**You develop in VSCode, changes appear on your phone!**

```
VSCode (PC)          Metro Bundler           Xiaomi (Dev Mode)
    │                      │                         │
    │   Edit code          │                         │
    ├──────────────────────>│                         │
    │                      │   Hot reload            │
    │                      ├────────────────────────>│
    │                      │                    App updates!
```

**How it works:**
1. Edit files in VSCode on your PC
2. Save the file
### Step 4: Start Development

```bash
npm start
```

On your Xiaomi:
- The Nalid24 app is already installed and running
- It connects to Metro bundler automatically
- Edit code in VSCode, see changes instantly

### Step 5: Build Release APK (for Tablet)

When ready to test on second device:

```bash
npm run android:release
```

APK will be at: `android/app/build/outputs/apk/release/app-release.apk`

Share this from Xiaomi to Tablet using in-app APK sharing feature.

### Step 6: Development Workflow

### Device 1: Xiaomi (Development Mode)
- Has development build installed
- Connected to Metro bundler
- Use for active development

### Device 2: Tablet (Normal Mode)
- Will receive production/preview APK
- Shared via APK sharing feature
- Test real user experience

### Build for Testing (Preview Build)

```bash
npm run build:preview
```

This creates a standalone APK without dev tools.

---

## 🔐 Privacy & Encryption Flow

### How Messages Stay Private with FCM:

1. **User A** types message: "Hello!"
2. **App encrypts** message locally: `"x8j3k2..."` (encrypted)
3. **Send to FCM** via your backend:
   ```json
   {
     "to": "userB_fcm_token",
     "data": {
       "encryptedMessage": "x8j3k2..."
     }
   }
   ```
4. **Google FCM** sees only:
   - User A sent something to User B
   - Timestamp
   - **NOT the message content**
5. **User B** receives encrypted data
6. **App decrypts** locally: "Hello!"
7. **Shows notification**: "New Message" (generic)

**What Google knows:** User A messaged User B at X time  
**What Google doesn't know:** Message content, subject, context

---

## 🚀 Quick Start Commands

```bash
# Install everything
npm install

# Login to Expo
npx eas login

# Initialize project
npx eas init

# Build development APK (first time)
npm run build:dev

# Build preview APK (for sharing)
npm run build:preview

# Start development server
npm start

# Run on connected Android device
npm run android
```

---

## 📋 Files Checklist

- [x] `google-services.json` in project root
- [x] `eas.json` configured
- [x] `app.json` has Android package name
- [x] Firebase project created
- [x] Encryption service ready
- [x] Notification service ready
- [x] APK sharing service ready

---

## 🔧 Troubleshooting

### "google-services.json not found"
- Download from Firebase Console
- Place in `e:\Nalid24\google-services.json`
- Rebuild

### "Build failed"
- Check EAS dashboard for errors
- Ensure package name matches
- Verify Firebase setup

### "Notifications not working"
- Check Android permissions granted
- Verify FCM token is generated
- Test on physical device (not emulator)

### "Can't connect to dev server"
- Ensure phone and PC on same WiFi
- Check firewall settings
- Try Metro bundler URL manually

---

## 📝 Next Steps

1. ✅ Install dependencies: `npm install`
2. ✅ Setup Firebase project
3. ✅ Download `google-services.json`
4. ✅ Login to Expo: `npx eas login`
5. ✅ Build first APK: `npm run build:dev`
6. 📱 Install on Xiaomi and test
7. 🔨 Start implementing screens
8. 🧪 Build preview APK for tablet testing

---

## 🎯 Key Features Ready

- ✅ **FCM Integration** - Push notifications
- ✅ **Client-side Encryption** - Privacy protection  
- ✅ **APK Sharing** - Self-distribution
- ✅ **Development Builds** - Full native features
- ✅ **24h Message Cleanup** - Auto-deletion

**Ready to build!** 🚀
