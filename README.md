# Nalid24 Messenger

## Overview
Nalid24 is a **privacy-focused P2P messenger** built with React Native and Expo. Messages are **encrypted end-to-end** and automatically deleted after **24 hours**. The app distributes itself via **APK sharing** - no app stores needed.

## 🔐 Privacy Features
- **End-to-end encryption** - Messages encrypted on device before sending
- **24-hour retention** - All messages auto-delete after 24h
- **No cloud storage** - Everything stored locally on devices
- **FCM for delivery only** - Google sees encrypted payload, not content
- **Self-distribution** - Share APK directly from the app

## 🚀 Key Features
- **Text & Emoji Messaging** - Send messages and emojis
- **Push Notifications** - Get notified of new messages (via FCM)
- **QR Code Sharing** - Share contacts and app via QR codes
- **User-to-User & Group Chats** - One-on-one and group conversations
- **APK Self-Distribution** - Share the app from within the app
- **No Servers** - Peer-to-peer architecture 

## Technology Stack
- **Framework**: React Native 0.73 + Expo SDK 50
- **Language**: TypeScript (strict mode)
- **Messaging**: Firebase Cloud Messaging (FCM)
- **Encryption**: Expo Crypto (AES-256)
- **Storage**: AsyncStorage (local only)
- **Navigation**: React Navigation 6
- **Build**: Local Gradle builds (not cloud builds)

## 🏗️ Architecture
- **P2P Messaging** - Device-to-device over internet
- **FCM Relay** - Notifications via Firebase (encrypted payload)
- **Local Storage** - All data on device, 24h auto-cleanup
- **APK Distribution** - Self-contained, shareable from app

## 📱 Development Setup

### Prerequisites
- Node.js 18+
- Android device in Developer Mode (USB debugging enabled)
- Firebase project (free)

### Quick Start

1. **Clone and install**
   ```bash
   git clone <repository-url>
   cd Nalid24
   npm install
   ```

2. **Setup Firebase**
   - Follow [docs/FIREBASE_SETUP.md](docs/FIREBASE_SETUP.md)
   - Package name: `com.nalid24`
   - Place `google-services.json` in project root

3. **Generate native Android project**
   ```bash
   npx expo prebuild
   ```

4. **Build and install on connected device**
   ```bash
   npm run android
   ```
   (Connect Xiaomi via USB first)

5. **Start development**
   ```bash
   npm start
   ```

## 📚 Documentation
- **[FIREBASE_SETUP.md](docs/FIREBASE_SETUP.md)** - Complete Firebase & build guide
- **[DEVELOPMENT.md](docs/DEVELOPMENT.md)** - Development workflow
- **[ARCHITECTURE.md](docs/ARCHITECTURE.md)** - System architecture
- **[QUICKSTART.md](docs/QUICKSTART.md)** - Quick reference

## 🔧 Available Commands

```bash
npm start              # Start dev server (with dev client)
npm run android        # Build & install debug APK on device
npm run android:release # Build release APK
npm run prebuild       # Generate native Android project
npm run lint          # Check code quality
npm run type-check    # TypeScript validation
```
```
expo-messenger-app
├── src
│   ├── components
│   │   ├── ChatBubble.tsx
│   │   ├── EmojiPicker.tsx
│   │   ├── QRCodeScanner.tsx
│   │   └── QRCodeDisplay.tsx
│   ├── screens
│   │   ├── AuthScreen.tsx
│   │   ├── ChatScreen.tsx
│   │   ├── GroupChatScreen.tsx
│   │   ├── ContactsScreen.tsx
│   │   ├── ProfileScreen.tsx
│   │   └── InviteScreen.tsx
│   ├── navigation
│   │   └── AppNavigator.tsx
│   ├── services
│   │   ├── messageService.ts
│   │   ├── authService.ts
│   │   └── storageService.ts
│   ├── hooks
│   │   ├── useMessages.ts
│   │   └── useAuth.ts
│   ├── utils
│   │   ├── qrCodeGenerator.ts
│   │   └── messageCleanup.ts
│   └── types
│       └── index.ts
├── App.tsx
├── app.json
├── package.json
├── tsconfig.json
└── README.md
```

## Setup Instructions
1. **Clone the Repository**: 
   ```
   git clone <repository-url>
   cd Nalid24
   ```

2. **Install Dependencies**: 
   ```
   npm install
   ```

3. **Setup Firebase**: 
   ```
   # See docs/FIREBASE_SETUP.md for detailed steps
   ```

4. **Build APK**: 
   ```
   npm run build:dev
   ```

5. **Install on Device**: Scan QR code and install

## Usage
- **Creating an Account**: Select a username on first launch
- **Sending Messages**: Navigate to chat screen, messages are encrypted automatically
- **Group Chats**: Create or join group chats
- **Sharing the App**: Use in-app APK sharing feature
- **Privacy**: All messages auto-delete after 24 hours 

## Contributing
Contributions are welcome! Please open an issue or submit a pull request for any enhancements or bug fixes.

## License
This project is licensed under the MIT License. See the LICENSE file for details.