# Nalid24 Architecture

## Overview

Nalid24 is a privacy-focused messenger app built with React Native and Expo, featuring 24-hour message retention and QR-code based user connection.

## Technology Stack

- **Framework**: React Native 0.73.0
- **Build Tool**: Expo SDK 50
- **Language**: TypeScript 5.3
- **Navigation**: React Navigation 6
- **Storage**: AsyncStorage
- **State Management**: React Context API

## Core Concepts

### 1. Privacy-First Design
- Messages auto-delete after 24 hours
- Local storage only (no cloud storage)
- Encryption planned for future
- User IDs are UUIDs

### 2. Offline-First Architecture
- All data stored locally in AsyncStorage
- No server dependency for basic functionality
- Peer-to-peer communication (planned)

### 3. QR Code Ecosystem
- User identification via QR codes
- App distribution via QR codes
- Contact sharing via QR codes
- Update mechanism via QR codes

## Data Flow

### Authentication Flow
```
User opens app
    ↓
Check AsyncStorage for user
    ↓
[No User] → AuthScreen → Create user → Store in AsyncStorage
    ↓
[Has User] → Navigate to Contacts
```

### Message Flow
```
User types message
    ↓
messageService.sendMessage()
    ↓
Store in AsyncStorage with timestamp
    ↓
Trigger cleanup check
    ↓
Update UI via MessageProvider
```

### Cleanup Flow
```
Every 60 seconds (interval)
    ↓
messageService.cleanupOldMessages()
    ↓
Load all messages from AsyncStorage
    ↓
Filter messages older than 24 hours
    ↓
Save filtered messages back
    ↓
Notify listeners to refresh
```

## Service Layer

### authService
- User creation with UUID
- User retrieval from storage
- Authentication state management
- User data clearing (logout)

### messageService
- Message creation and storage
- Message retrieval with filtering
- 24-hour cleanup logic
- Message deletion

### storageService (planned)
- Abstraction layer over AsyncStorage
- Migration utilities
- Backup/restore functionality

## State Management

### Context Providers

**AuthProvider**
- Global user state
- Login/logout methods
- Loading state for async operations

**MessageProvider**
- Global message state
- Send/delete message methods
- Auto-refresh messages
- Cleanup interval management

## Navigation Structure

```
App
 └─ AuthProvider
     └─ MessageProvider
         └─ NavigationContainer
             └─ StackNavigator
                 ├─ AuthScreen (no header)
                 ├─ ContactsScreen
                 ├─ ChatScreen
                 ├─ GroupChatScreen
                 ├─ ProfileScreen
                 └─ InviteScreen
```

## Type System

### Core Types

```typescript
User {
  id: string (UUID)
  username: string
  uniqueId: string
  createdAt: Date
}

Message {
  id: string
  content: string
  senderId: string
  timestamp: Date
  isEmoji: boolean
}

GroupChat {
  id: string
  name: string
  members: User[]
  messages: Message[]
}
```

## Storage Schema

### AsyncStorage Keys
- `@Nalid24:User` - Current user object
- `@Nalid24:Messages` - Array of messages
- `@Nalid24:Contacts` (planned) - Array of contacts
- `@Nalid24:Groups` (planned) - Array of group chats

## Security Considerations

### Current
- Local-only storage
- UUID-based user identification
- No external API calls

### Planned
- End-to-end encryption
- Secure key exchange
- Message signing
- Encrypted backups

## Performance Optimizations

### Current
- Cleanup runs every 60s (not on every render)
- Messages filtered in service layer
- Context providers prevent prop drilling

### Planned
- Message pagination
- Virtual list for long chat histories
- Debounced message sending
- Optimistic UI updates

## Development Port Configuration

**Port 1505** is used instead of Expo's default:
- Configured in `metro.config.js`
- Specified in all npm scripts
- Set in `.env` file

## Future Architecture Plans

### Phase 1: Enhanced Local Features
- Group chat functionality
- Contact management
- Profile customization
- Emoji/sticker support

### Phase 2: Peer-to-Peer
- WebRTC for direct messaging
- Local network discovery
- QR-based connection establishment

### Phase 3: Optional Cloud Sync
- Encrypted cloud backup
- Multi-device support
- Message history sync

## Testing Strategy

### Unit Tests
- Service layer functions
- Utility functions
- Custom hooks

### Integration Tests
- Provider interactions
- Navigation flows
- Storage operations

### E2E Tests
- Complete user journeys
- Multi-device scenarios
- Offline functionality

## Deployment

### Development
- Expo Go for testing
- Hot reload enabled
- Debug mode active

### Production
- Build standalone APK/IPA
- Distribute via QR code
- Over-the-air updates via QR code

## Code Organization Principles

1. **Separation of Concerns**
   - UI components don't contain business logic
   - Services handle data operations
   - Hooks bridge services and UI

2. **Single Responsibility**
   - Each file has one clear purpose
   - Services are focused and testable
   - Components are presentational or container

3. **Dependency Injection**
   - Services don't depend on UI
   - Components receive data via props/context
   - Easy to test and mock

4. **Type Safety**
   - Strict TypeScript mode
   - Explicit types everywhere
   - No `any` types allowed
