# Your Nalid24 Setup - Quick Reference

## ✅ What You Have

- **Firebase Project**: `nalid24-a7401`
- **Package Name**: `com.nalid24`
- **App Name**: Nalid24 (logo: 24)
- **Development Device**: Xiaomi (Developer Mode)
- **Testing Device**: Tablet (Normal Mode)

## 🔧 Development Setup

### Your Workflow (VSCode + Connected Phone)

```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│   VSCode    │         │    Metro     │         │   Xiaomi    │
│   (PC)      │────────>│   Bundler    │────────>│ (Dev Mode)  │
│             │  USB/   │   (PC)       │  USB/   │             │
└─────────────┘  WiFi   └──────────────┘  WiFi   └─────────────┘
      │                                                  │
      │  1. Edit code in VSCode                         │
      │  2. Save file                                   │
      │  3. Metro detects change ──────────────────────>│
      │                                    4. App updates instantly!
```

**Local Gradle Builds!**
- ✅ Build APK locally with Gradle
- ✅ Install on Xiaomi via USB/WiFinpm run android
- ✅ Then develop in VSCode
- ✅ Changes appear instantly on phone

## 📋 Setup Checklist

### Firebase Setup (One Time)
- [x] Firebase project created: `nalid24-a7401`
- [ ] Download `google-services.json`
- [ ] Place in `e:\Nalid24\google-services.json`
- [ ] Verify package name is `com.nalid24` in Firebase

### First Build (One Time, ~5-10 min)
```bash
# 1. Install dependencies
npm install

# 2. Generate Android native project
npx expo prebuild

# 3. Build and install on connected Xiaomi
npm run android
```

**What happens:**
- Expo generates native Android project in `android/` folder
- Gradle builds the APK locally on your PC
- Installs directly to connected Xiaomi via USB/WiFi
- App opens automatically

### Daily Development
```bash
# Start Metro bundler
npm start

# On Xiaomi: Open Nalid24 app
# It connects to Metro on your PC
# Now you can edit in VSCode!
```

### Build Release APK (for Tablet)
```bash
# Build release APK
npm run android:release

# APK will be in:
# android/app/build/outputs/apk/release/app-release.apk

# Share this APK from Xiaomi to Tablet via in-app sharing
```

## 📱 Two Devices Setup

### Xiaomi (Development)
- **Purpose**: Active development
- **What's on it**: Development APK (from Gradle)
- **Connected to**: VSCode via Metro bundler + USB
- **Used for**: Coding, testing, debugging

### Tablet (Testing)
- **Purpose**: Real user testing
- **What's on it**: Release APK
- **How it gets the app**: Shared from Xiaomi via in-app APK sharing
- **Used for**: Testing messaging between 2 devices

## 🚀 Quick Commands

```bash
# Daily work
npm start              # Start dev server

# Building APKs
npm run android        # Build & install debug APK
npm run android:release # Build release APK
npx expo prebuild      # Regenerate native project

# Code quality
npm run type-check     # Check TypeScript
npm run lint           # Check code style
```

## 🔐 Privacy Architecture

```
User types message: "Hello"
         ↓
[Encrypt on device] → "x8k2j3..."
         ↓
[Send via FCM] → Google sees only encrypted blob
         ↓
[Receive on other device] → "x8k2j3..."
         ↓
[Decrypt on device] → "Hello"
         ↓
[Show to user & auto-delete in 24h]
```

**Google knows**: User A sent something to User B  
**Google doesn't know**: What was sent

## 📝 Important Notes

### Package Name
- `com.nalid24` (not com.nalid24.messenger)
- Must match in Firebase and app.json

### Firebase Console
- Firebase project: `nalid24-a7401`
- Package name: `com.nalid24`
- Download `google-services.json` and place in project root

## 🎯 Next Steps

1. [ ] Download `google-services.json` from Firebase
2. [ ] Place in project root
3. [ ] Run `npm install`
4. [ ] Run `npx expo prebuild`
5. [ ] Connect Xiaomi via USB (Developer Mode on)
6. [ ] Run `npm run android`
7. [ ] Run `npm start`
8. [ ] Start coding in VSCode!

---

**Ready to code!** Your setup: VSCode (PC) → Gradle → USB → Xiaomi 🚀
