# Quick Start Guide

## Installation & First Run

### Step 1: Install Dependencies
```bash
npm install
```

This will install all required packages including:
- Expo SDK 50
- React Native 0.73
- React Navigation
- TypeScript
- ESLint & Prettier
- And more...

### Step 2: Start Development Server
```bash
npm start
```

**Important**: The app runs on port **1505** (not Expo's default port).

You'll see a QR code in your terminal. Keep this terminal window open.

### Step 3: Install Expo Go on Your Phone

- **iOS**: Download from App Store
- **Android**: Download from Google Play Store

### Step 4: Connect Your Phone

**Option A: Same WiFi Network (Recommended)**
1. Ensure phone and computer are on the same WiFi
2. Open Expo Go app
3. Scan the QR code from terminal
4. App will load on your phone

**Option B: Tunnel Mode (If WiFi doesn't work)**
```bash
npm run tunnel
```
This creates a tunnel through Expo's servers. Slower but works anywhere.

### Step 5: Development

- Shake your phone to open developer menu
- Enable "Fast Refresh" for instant updates
- Errors will show on screen and in terminal

## What You Have Now

✅ **Configured Project**
- TypeScript with strict mode
- ESLint & Prettier configured
- Port 1505 set up
- Navigation structure ready
- Auth & Message services implemented

⚠️ **Still Need Implementation**
- Screen UIs (they exist but are basic)
- Components (ChatBubble, EmojiPicker, etc.)
- QR code functionality
- Styling & design

## Next Development Steps

### 1. Test Current Setup
```bash
npm run type-check  # Should pass with no errors
npm run lint        # Check for linting issues
```

### 2. Implement First Screen
Start with AuthScreen - the entry point:
```
src/screens/AuthScreen.tsx
```

### 3. Add Basic Components
Start with simple components like ChatBubble:
```
src/components/ChatBubble.tsx
```

### 4. Test on Device
After each component, test on your phone with Expo Go.

## Useful Commands

```bash
# Development
npm start              # Start on port 1505
npm run android        # Open on Android
npm run ios            # Open on iOS simulator (Mac only)
npm run tunnel         # Use tunnel mode

# Code Quality
npm run type-check     # Check TypeScript types
npm run lint           # Check for errors
npm run lint:fix       # Fix auto-fixable errors
npm run format         # Format all files with Prettier

# Troubleshooting
# Clear Expo cache
npx expo start -c

# Reset Metro bundler
npx expo start --reset-cache
```

## Common Issues & Solutions

### "Port 1505 is already in use"
```bash
# Windows
netstat -ano | findstr :1505
taskkill /PID <process_id> /F

# Mac/Linux
lsof -ti:1505 | xargs kill -9
```

### "Cannot connect to Metro"
1. Check firewall settings
2. Try tunnel mode: `npm run tunnel`
3. Restart the dev server

### "TypeScript errors"
```bash
npm run type-check
```
Fix errors one by one. The strict mode catches issues early.

### "Module not found"
```bash
rm -rf node_modules
npm install
```

## Development Workflow

1. **Start dev server**: `npm start`
2. **Open on phone**: Scan QR code
3. **Make changes**: Edit files in `src/`
4. **See updates**: Automatic reload
5. **Check for errors**: Watch terminal and phone screen
6. **Before commit**: Run `npm run lint` and `npm run type-check`

## Project Structure Quick Reference

```
src/
├── screens/      # Pages/screens of the app
├── components/   # Reusable UI components
├── navigation/   # Navigation configuration
├── services/     # Business logic (auth, messages)
├── hooks/        # Custom React hooks (useAuth, useMessages)
├── utils/        # Helper functions
└── types/        # TypeScript type definitions
```

## Read the Docs

- `docs/DEVELOPMENT.md` - Complete development guide
- `docs/ARCHITECTURE.md` - How everything works
- `docs/CONTRIBUTING.md` - How to contribute
- `README.md` - Project overview

## Getting Help

1. Check error messages in terminal
2. Check error messages on phone screen
3. Look at Expo documentation: https://docs.expo.dev
4. Check React Navigation docs: https://reactnavigation.org

## What's Already Done ✅

- [x] Project structure set up
- [x] Dependencies configured
- [x] TypeScript strict mode enabled
- [x] ESLint & Prettier configured
- [x] Port 1505 configured
- [x] Auth service implemented
- [x] Message service implemented
- [x] Navigation structure ready
- [x] Context providers (Auth & Messages)
- [x] Type definitions

## What's Next 🚀

- [ ] Implement screen UIs
- [ ] Create UI components
- [ ] Add QR code functionality
- [ ] Implement styling/design
- [ ] Add encryption
- [ ] Add tests
- [ ] Create documentation
- [ ] Build APK for distribution

---

**Ready to code!** Start by running `npm install` and then `npm start`.
