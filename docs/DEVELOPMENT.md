# Nalid24 Development Guide

## Getting Started

### Prerequisites
- Node.js 18+ installed
- Expo CLI installed globally: `npm install -g expo-cli`
- Expo Go app on your mobile device
- Git for version control

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Nalid24
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm start
   ```
   The app will start on port **1505** (not the default Expo port).

4. **Open in Expo Go**
   - Scan the QR code with Expo Go app
   - The app will load on your device

## Available Scripts

- `npm start` - Start Expo development server on port 1505
- `npm run android` - Start with Android device/emulator
- `npm run ios` - Start with iOS simulator (macOS only)
- `npm run web` - Start web version
- `npm run tunnel` - Start with Expo tunnel for remote testing
- `npm run lint` - Check code for linting errors
- `npm run lint:fix` - Auto-fix linting errors
- `npm run format` - Format code with Prettier
- `npm run type-check` - Run TypeScript type checking

## Project Structure

```
Nalid24/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── ChatBubble.tsx
│   │   ├── EmojiPicker.tsx
│   │   ├── QRCodeDisplay.tsx
│   │   └── QRCodeScanner.tsx
│   ├── screens/             # Screen components
│   │   ├── AuthScreen.tsx
│   │   ├── ChatScreen.tsx
│   │   ├── ContactsScreen.tsx
│   │   ├── GroupChatScreen.tsx
│   │   ├── InviteScreen.tsx
│   │   └── ProfileScreen.tsx
│   ├── navigation/          # Navigation configuration
│   │   └── AppNavigator.tsx
│   ├── services/            # Business logic & data
│   │   ├── authService.ts
│   │   ├── messageService.ts
│   │   └── storageService.ts
│   ├── hooks/               # Custom React hooks
│   │   ├── useAuth.ts
│   │   └── useMessages.ts
│   ├── utils/               # Utility functions
│   │   ├── messageCleanup.ts
│   │   └── qrCodeGenerator.ts
│   └── types/               # TypeScript type definitions
│       └── index.ts
├── App.tsx                  # Root component
├── app.json                 # Expo configuration
├── package.json             # Dependencies & scripts
├── tsconfig.json            # TypeScript configuration
├── metro.config.js          # Metro bundler config (port 1505)
└── .env                     # Environment variables
```

## Coding Standards

### TypeScript
- **Strict mode enabled** - All files must pass strict type checking
- Use explicit types for function parameters and return values
- Avoid `any` - use `unknown` or proper types
- Use interfaces for object shapes

### ESLint & Prettier
- Code is automatically checked on save
- Run `npm run lint:fix` before committing
- Run `npm run format` to format all files
- Follow React hooks rules strictly

### Naming Conventions
- **Components**: PascalCase (e.g., `ChatBubble.tsx`)
- **Hooks**: camelCase with `use` prefix (e.g., `useAuth.ts`)
- **Services**: camelCase with `Service` suffix (e.g., `authService.ts`)
- **Constants**: UPPER_SNAKE_CASE
- **Variables/Functions**: camelCase

### File Organization
- One component per file
- Keep files under 300 lines
- Co-locate related files
- Use index files for clean imports

## Git Workflow

### Branch Naming
- `feature/description` - New features
- `fix/description` - Bug fixes
- `refactor/description` - Code refactoring
- `docs/description` - Documentation updates

### Commit Messages
Follow conventional commits:
```
type(scope): subject

[optional body]
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

Examples:
- `feat(auth): add QR code login`
- `fix(messages): resolve 24h cleanup timing`
- `docs(readme): update installation steps`

### Before Committing
1. Run `npm run type-check`
2. Run `npm run lint`
3. Test on actual device with Expo Go
4. Write clear commit message

## Testing Strategy

### Manual Testing Checklist
- [ ] Test on both iOS and Android
- [ ] Test message sending/receiving
- [ ] Verify 24-hour message cleanup
- [ ] Test QR code generation/scanning
- [ ] Test auth flow (login/logout)
- [ ] Test navigation between screens

### Future: Automated Testing
- Unit tests with Jest
- Component tests with React Native Testing Library
- E2E tests with Detox

## Key Features Implementation

### 24-Hour Message Retention
- Messages stored in AsyncStorage
- Cleanup runs every 60 seconds
- Timestamp checked on every cleanup
- Located in `messageService.ts`

### User Authentication
- UUID-based user IDs
- Username selection
- QR code for user linking
- Persistent storage with AsyncStorage

### Encryption (Planned)
- End-to-end encryption for messages
- Secure key exchange via QR codes

## Port Configuration

**Important**: This app uses **port 1505** instead of Expo's default port.

Configuration files:
- `package.json` - All scripts use `--port 1505`
- `metro.config.js` - Metro bundler port configuration
- `.env` - Environment variable `EXPO_DEV_SERVER_PORT=1505`

## Environment Variables

Create/edit `.env` file:
```
EXPO_DEVTOOLS_LISTEN_ADDRESS=0.0.0.0
EXPO_DEV_SERVER_PORT=1505
REACT_NATIVE_PACKAGER_HOSTNAME=localhost
APP_NAME=Nalid24 Messenger
MESSAGE_RETENTION_HOURS=24
```

## Troubleshooting

### Port Already in Use
If port 1505 is busy:
```bash
# Windows
netstat -ano | findstr :1505
taskkill /PID <PID> /F

# macOS/Linux
lsof -ti:1505 | xargs kill -9
```

### Expo Go Won't Connect
1. Ensure phone and computer are on same network
2. Check firewall settings
3. Try tunnel mode: `npm run tunnel`

### TypeScript Errors
1. Run `npm run type-check` to see all errors
2. Check `tsconfig.json` for strict settings
3. Ensure all dependencies have type definitions

## Resources

- [Expo Documentation](https://docs.expo.dev/)
- [React Navigation](https://reactnavigation.org/)
- [React Native](https://reactnative.dev/)
- [TypeScript](https://www.typescriptlang.org/)

## Next Steps

1. Install dependencies: `npm install`
2. Start development server: `npm start`
3. Review existing code in `src/`
4. Implement remaining screens
5. Add comprehensive testing
6. Set up CI/CD pipeline
