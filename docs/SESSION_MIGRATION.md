# Nalid24 v2 — Firebase → Session Network Migration Plan

## Executive Summary

Replace all Firebase/Google dependencies with the **Session Network** — a decentralized, onion-routed mesh of 1,500+ service nodes. Messages will be stored, relayed, and delivered entirely through Session's swarm infrastructure. No central server, no Google, no metadata leaks.

---

## 1. Architecture Comparison

| Concern | v1 (Firebase) | v2 (Session Network) |
|---------|---------------|----------------------|
| **Message relay** | Firebase RTDB (`chats/{id}/messages`) | Service Node swarms via `store` RPC |
| **Message storage** | Firebase RTDB (persistent until 24h cleanup) | Swarm nodes (14-day TTL, we enforce 24h client-side) |
| **Push notifications** | FCM + Cloud Function | Session Push Notification Server (onion-routed) or local polling |
| **Presence** | Firebase RTDB (`/presence/{userId}`) | Swarm polling or ephemeral store messages |
| **Contact exchange** | Firebase RTDB (`/contactRequests`) | Direct swarm message from sender → recipient's Session ID |
| **User identity** | Random UUID + AsyncStorage | Ed25519 keypair → Session ID (hex pubkey) |
| **Encryption** | AES-256 with deterministic shared secret | X25519 ECDH + XSalsa20-Poly1305 (Session Protocol) |
| **IP protection** | None (direct connections to Google) | 3-hop onion routing through service nodes |
| **Delivery receipts** | Firebase RTDB field updates | Swarm "receipt" messages |
| **Server cost** | Free tier (Firebase) | $0 (uses public service node network) |

---

## 2. Session Network Primitives

### 2.1 Session ID
- Ed25519 keypair generated on-device
- Public key (hex) = Session ID, prefixed with `05`
- Equivalent to Nalid24's current `uniqueId` UUID — but cryptographically derived
- **No signup, no server registration** — same as current Nalid24 approach

### 2.2 Swarms
- Each Session ID is assigned to a **swarm** of ~5-9 service nodes
- Swarm assignment is deterministic (based on pubkey hash)
- Swarm stores messages intended for that Session ID
- `getSwarm(publicKey)` → returns set of nodes

### 2.3 Onion Routing
- Every request is routed through a **3-hop onion path**:
  ```
  Client → Guard Node → Relay Node → Exit Node → Destination Swarm
  ```
- Each hop only knows the previous and next hop
- Destination swarm cannot see the sender's IP
- Uses AES-GCM encryption per hop

### 2.4 Service Node RPC Methods
From the Session Android source (`SnodeAPI.kt`, `Snode.kt`):

| Method | Purpose |
|--------|---------|
| `store` | Store a message in a recipient's swarm |
| `retrieve` | Retrieve messages from your own swarm |
| `get_snodes_for_pubkey` | Get swarm nodes for a Session ID |
| `delete` | Delete specific messages by hash |
| `delete_all` | Delete all stored messages |
| `expire` | Set expiry on messages |
| `get_expiries` | Get expiry times for messages |
| `info` | Get network time from a node |
| `batch` | Batch multiple operations |
| `sequence` | Sequential batch operations |

### 2.5 Push Notifications
Session uses its own push notification server:
- Device registers FCM/APNs token via onion-routed request
- When a message is stored in a swarm, the sender pings the PN server
- PN server sends a wake-up push (no message content)
- App wakes up, retrieves messages from swarm via onion request

---

## 3. Service-by-Service Migration

### 3.1 `firebaseConfig.ts` → `sessionConfig.ts` (NEW)

**Current:** Returns Firebase RTDB instance.

**New:** Initialize Session networking:
```typescript
// sessionConfig.ts
import { generateKeyPair, getSwarm, buildOnionPath } from './sessionCrypto';

// Seed nodes for initial network discovery
const SEED_NODES = [
  'https://seed1.getsession.org:4443',
  'https://seed2.getsession.org:4443',
  'https://seed3.getsession.org:4443',
];

let snodePool: Snode[] = [];
let userKeyPair: { publicKey: string; secretKey: Uint8Array } | null = null;

export async function initializeSession(keyPair) { ... }
export async function getSnodePool(): Promise<Snode[]> { ... }
export async function getSwarmForKey(pubkey: string): Promise<Snode[]> { ... }
```

### 3.2 `authService.ts` → Keypair-based identity

**Current:** `createUser()` generates UUID via `expo-crypto.randomUUID()`.

**New:**
```typescript
import nacl from 'tweetnacl';

export async function createUser(username: string): Promise<User> {
  // Generate Ed25519 keypair
  const keyPair = nacl.sign.keyPair();
  // Derive X25519 keypair for encryption
  const x25519KeyPair = nacl.box.keyPair.fromSecretKey(
    nacl.sign.keyPair.fromSecretKey(keyPair.secretKey).secretKey.slice(0, 32)
  );
  
  const sessionId = '05' + toHex(keyPair.publicKey);
  
  const user: User = {
    uniqueId: sessionId,        // Session ID replaces UUID
    username: username,
    createdAt: new Date(),
    publicKey: toHex(keyPair.publicKey),
    // Secret key stored encrypted in AsyncStorage
  };
  
  await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
  await SecureStore.setItemAsync('SESSION_SECRET_KEY', toHex(keyPair.secretKey));
  
  return user;
}
```

**Dependencies to add:** `tweetnacl` (or `libsodium-wrappers-sumo`), `expo-secure-store`

### 3.3 `encryptionService.ts` → Session Protocol encryption

**Current:** AES-256 with `SHA256(sortedIds)` shared secret.

**New:** X25519 ECDH key exchange + XSalsa20-Poly1305:
```typescript
import nacl from 'tweetnacl';

export function encryptForRecipient(
  message: string,
  recipientX25519PubKey: Uint8Array,
  senderX25519SecretKey: Uint8Array
): { ciphertext: Uint8Array; nonce: Uint8Array } {
  const nonce = nacl.randomBytes(nacl.box.nonceLength);
  const messageBytes = new TextEncoder().encode(message);
  const ciphertext = nacl.box(messageBytes, nonce, recipientX25519PubKey, senderX25519SecretKey);
  return { ciphertext, nonce };
}

export function decryptFromSender(
  ciphertext: Uint8Array,
  nonce: Uint8Array,
  senderX25519PubKey: Uint8Array,
  recipientX25519SecretKey: Uint8Array
): string {
  const decrypted = nacl.box.open(ciphertext, nonce, senderX25519PubKey, recipientX25519SecretKey);
  if (!decrypted) throw new Error('Decryption failed');
  return new TextDecoder().decode(decrypted);
}
```

**Advantage:** True asymmetric encryption — no shared secret derivation from user IDs.

### 3.4 `firebaseMessageService.ts` → `sessionMessageService.ts`

**Current:** Read/write messages to Firebase RTDB paths like `chats/{chatId}/messages/{msgId}`.

**New:** Store/retrieve messages via onion-routed swarm requests:

```typescript
// Send: encrypt → wrap in Session envelope → onion-route to recipient's swarm
export async function sendMessage(
  myKeyPair: KeyPair,
  recipientSessionId: string,
  content: string,
  isEmoji?: boolean
): Promise<void> {
  // 1. Encrypt message for recipient
  const encrypted = encryptForRecipient(content, recipientPubKey, mySecretKey);
  
  // 2. Wrap in protobuf envelope (Session uses protobuf for wire format)
  const envelope = wrapMessage({
    type: 'SESSION_MESSAGE',
    timestamp: Date.now(),
    content: encrypted.ciphertext,
    nonce: encrypted.nonce,
    senderPubKey: myKeyPair.publicKey,
  });
  
  // 3. Get recipient's swarm
  const swarm = await getSwarmForKey(recipientSessionId);
  const targetSnode = pickRandom(swarm);
  
  // 4. Build onion path and send
  const base64Data = base64Encode(envelope);
  const snodeMessage = {
    pubKey: recipientSessionId,
    data: base64Data,
    ttl: 24 * 60 * 60 * 1000, // 24 hours
    timestamp: Date.now(),
  };
  
  await sendOnionRequest(targetSnode, 'store', snodeMessage);
}

// Receive: poll swarm → decrypt → deliver to UI
export async function pollMessages(myKeyPair: KeyPair): Promise<Message[]> {
  const swarm = await getSwarmForKey(myKeyPair.publicKey);
  const snode = pickRandom(swarm);
  
  const response = await sendOnionRequest(snode, 'retrieve', {
    pubKey: myKeyPair.publicKey,
    lastHash: await getLastMessageHash(),
  });
  
  return response.messages.map(msg => {
    const envelope = unwrapMessage(base64Decode(msg.data));
    const decrypted = decryptFromSender(envelope.content, ...);
    return { id: msg.hash, content: decrypted, ... };
  });
}
```

### 3.5 `contactSyncService.ts` → Direct swarm messaging

**Current:** Writes to Firebase RTDB path `contactRequests/{targetUserId}/{myUserId}`.

**New:** Send a "contact request" message directly to the recipient's swarm:
- Contact request = a regular Session message with a special type flag
- Recipient's app polls their swarm, sees the request, auto-adds
- No central database node needed

### 3.6 `presenceService.ts` → Swarm-based presence

**Current:** Firebase RTDB `/presence/{userId}` with `onDisconnect()`.

**Options for v2:**
1. **Ephemeral swarm messages:** Periodically store a "heartbeat" in your swarm with a short TTL (e.g., 30s). Contacts poll your swarm — if recent heartbeat exists, you're online.
2. **Last-seen in message metadata:** Each message carries a `lastSeen` timestamp. Display "last seen X ago" based on the most recent message.
3. **Skip real-time presence:** Many privacy-focused apps (Signal, Session itself) don't show real-time online status. Consider making this opt-in.

**Recommendation:** Option 2 (message-based last-seen) — simplest and most privacy-friendly.

### 3.7 `notificationService.ts` → Session PN Server

**Current:** FCM via `@react-native-firebase/messaging`.

**New:**
```typescript
// Register with Session's push notification server via onion request
export async function registerForPushNotifications(
  sessionId: string,
  fcmToken: string,
  ed25519KeyPair: KeyPair
): Promise<void> {
  const server = {
    url: 'https://push.getsession.org',
    publicKey: '<session-pn-server-public-key>',
  };
  
  const params = {
    pubKey: sessionId,
    token: fcmToken,
    // ... signed with ed25519 key
  };
  
  await sendOnionRequest(server, 'register', params);
}
```

**Note:** FCM is still used for the actual wake-up push, but only a "you have a new message" signal — no content, no metadata. The app then retrieves the actual message via onion-routed swarm request.

**Alternative (no Google at all):** Use a persistent WebSocket/SSE connection to a swarm node for real-time delivery. More battery usage but zero Google dependency.

---

## 4. Onion Routing Implementation

This is the core networking change. Every request must be onion-routed through 3 service nodes.

### 4.1 Path Building
```
1. Fetch snode pool from seed nodes
2. Select 3 random snodes: Guard → Relay → Exit
3. Encrypt payload in layers:
   - Layer 3: Encrypt for Exit node (contains actual request)
   - Layer 2: Encrypt for Relay node (contains Layer 3 + next hop)
   - Layer 1: Encrypt for Guard node (contains Layer 2 + next hop)
4. Send Layer 1 to Guard node
5. Each node peels one layer and forwards to the next
```

### 4.2 Implementation Approach

**Option A: Pure JavaScript (recommended for React Native)**
- Port the `OnionRequestAPI.kt` logic to TypeScript
- Use `tweetnacl` for X25519 key exchange per hop
- Use `tweetnacl` for AES-GCM encryption per layer
- HTTP POST to guard snode's `/onion_req/v2` endpoint
- ~500 lines of TypeScript

**Option B: Native module wrapping `libsession-util`**
- C++ library, available as git submodule
- Requires React Native native module bridge
- More performant but significantly more build complexity
- Only worth it if message volume is very high

**Recommendation:** Option A — pure JS. The onion routing math is straightforward (just layered X25519 + AES-GCM), and `tweetnacl` is fast enough for a messenger.

---

## 5. New Dependencies

### Add
| Package | Purpose | Size |
|---------|---------|------|
| `tweetnacl` | Ed25519, X25519, XSalsa20-Poly1305 | ~7 KB |
| `tweetnacl-util` | Encoding helpers | ~2 KB |
| `protobufjs` | Session wire format (protobuf envelopes) | ~40 KB |
| `expo-secure-store` | Store secret keys securely (Keychain/Keystore) | Already in Expo |

### Remove
| Package | Reason |
|---------|--------|
| `@react-native-firebase/app` | No more Firebase |
| `@react-native-firebase/database` | Replaced by swarm store/retrieve |
| `@react-native-firebase/messaging` | Replaced by Session PN or polling |
| `crypto-js` | Replaced by tweetnacl |
| `firebase-functions` (Cloud Functions) | No server-side code needed |

### Keep
| Package | Reason |
|---------|--------|
| `@react-native-async-storage` | Local storage (contacts, messages, prefs) |
| `expo-barcode-scanner` | QR code scanning |
| `expo-local-authentication` | PIN/fingerprint lock |
| `expo-notifications` | Local notification display |
| `react-native-qrcode-svg` | QR code generation |

---

## 6. Files Changed / Created

### New Files
| File | Purpose |
|------|---------|
| `src/services/sessionConfig.ts` | Snode pool, seed nodes, session init |
| `src/services/sessionCrypto.ts` | Ed25519/X25519 key management, onion encryption |
| `src/services/onionRequestService.ts` | 3-hop onion routing, path building, request sending |
| `src/services/sessionMessageService.ts` | Store/retrieve messages via swarm |
| `src/services/sessionPresenceService.ts` | Last-seen via message metadata |
| `src/services/sessionNotificationService.ts` | Session PN server registration |

### Modified Files
| File | Change |
|------|--------|
| `src/services/authService.ts` | UUID → Ed25519 keypair generation |
| `src/services/encryptionService.ts` | AES → X25519 + XSalsa20-Poly1305 |
| `src/services/contactSyncService.ts` | RTDB requests → swarm messages |
| `src/services/contactService.ts` | Store public keys alongside contact info |
| `src/types/index.ts` | Add `publicKey`, `x25519PublicKey` to User/Contact types |
| `src/screens/ChatScreen.tsx` | Use swarm polling instead of RTDB listeners |
| `src/screens/ContactsScreen.tsx` | Swarm-based unread detection |
| `src/screens/AuthScreen.tsx` | Remove Firebase init, add Session init |
| `src/components/QRCodeDisplay.tsx` | Encode Session ID + X25519 pubkey in QR |
| `index.js` | Remove Firebase imports |
| `App.tsx` | Remove AuthProvider Firebase deps |

### Deleted Files
| File | Reason |
|------|--------|
| `src/services/firebaseConfig.ts` | No Firebase |
| `src/services/firebaseMessageService.ts` | Replaced by sessionMessageService |
| `functions/` (entire directory) | No Cloud Functions |
| `google-services.json` | No Google Services |
| `firebase.json` | No Firebase Hosting (keep landing page on GitHub Pages or Vercel) |
| `database.rules.json` | No Firebase RTDB |

---

## 7. Migration Phases

### Phase 1: Crypto & Identity (no network changes)
- [ ] Add `tweetnacl` and `expo-secure-store`
- [ ] Rewrite `authService.ts` to generate Ed25519 keypairs
- [ ] Rewrite `encryptionService.ts` to use X25519 + XSalsa20-Poly1305
- [ ] Update `types/index.ts` with new User/Contact fields
- [ ] Migrate existing accounts: generate keypair, store alongside existing UUID
- **Test:** Encryption/decryption roundtrip with new crypto

### Phase 2: Onion Routing Layer
- [ ] Implement `sessionConfig.ts` (seed nodes, snode pool fetching)
- [ ] Implement `sessionCrypto.ts` (per-hop encryption)
- [ ] Implement `onionRequestService.ts` (path building, layered encryption, HTTP relay)
- [ ] Add snode pool refresh logic (refresh every 2 hours)
- **Test:** Successfully send an onion request to a service node and get a response

### Phase 3: Message Transport
- [ ] Implement `sessionMessageService.ts` (store/retrieve via swarm)
- [ ] Add protobuf message envelope format
- [ ] Implement message polling (every 1.5s when app is active)
- [ ] Update `ChatScreen.tsx` to use swarm polling instead of RTDB listeners
- [ ] Implement delivery receipts as swarm messages
- **Test:** Send and receive messages between two devices via Session Network

### Phase 4: Contact Exchange
- [ ] Update QR code format: encode Session ID + username
- [ ] Rewrite `contactSyncService.ts`: contact requests via swarm messages
- [ ] Update `ContactsScreen.tsx` and `QRCodeScanner.tsx`
- **Test:** QR scan adds contact, both sides can message

### Phase 5: Notifications & Presence
- [ ] Implement Session PN server registration (or polling-based approach)
- [ ] Implement last-seen via message timestamps
- [ ] Update `ContactsScreen.tsx` unread indicators to use local poll data
- **Test:** Background notifications arrive, presence shows last-seen

### Phase 6: Cleanup & Removal
- [ ] Remove all Firebase packages and native config
- [ ] Delete Cloud Functions directory
- [ ] Remove `google-services.json`
- [ ] Update Android build.gradle (remove Google Services plugin)
- [ ] Move landing page to GitHub Pages
- [ ] Update QR/share links
- [ ] Run `expo prebuild --clean` to regenerate native projects
- **Test:** Full end-to-end test with zero Google dependencies

---

## 8. Key Technical Challenges

### 8.1 Real-Time Messaging Without Listeners
Firebase RTDB provides real-time `child_added` listeners. Session Network doesn't — you must **poll** the swarm.

**Solution:** Poll every 1-2 seconds when chat is open, every 15-30 seconds in background. Use `lastHash` parameter to only retrieve new messages (already supported by Session's `retrieve` RPC).

### 8.2 Message Ordering
Swarm nodes may return messages slightly out of order from different nodes.

**Solution:** Sort by `timestamp` client-side (already doing this). Use `hash` for deduplication.

### 8.3 Account Recovery
Current: UUID stored in AsyncStorage → trivially recoverable.
Session: Ed25519 secret key → must be backed up.

**Solution:** Show user a **Recovery Phrase** (mnemonic seed) on account creation — same as Session app. Store encrypted in `expo-secure-store`. Allow recovery via phrase entry.

### 8.4 First Connection Latency
Onion routing adds ~200-500ms per hop (3 hops = ~1-1.5s for first message).

**Solution:** Pre-build onion paths on app launch. Cache swarm assignments. Acceptable for a messenger — Signal also has similar latencies.

### 8.5 Offline Message Delivery
Firebase pushes messages instantly. Swarm stores messages until polled.

**Solution:** Session PN server sends a "wake-up" FCM push (data-only, no content) → app wakes → polls swarm. OR: Use pure polling with aggressive intervals. The Session PN server approach still uses FCM for the push token but routes the registration through onion requests, so Google never learns your Session ID.

---

## 9. Security Improvements in v2

| Feature | v1 | v2 |
|---------|----|----|
| **Encryption** | AES-256-CBC (symmetric, deterministic key) | X25519 ECDH + XSalsa20-Poly1305 (asymmetric) |
| **Key derivation** | SHA256 of sorted UUIDs | ECDH with per-message nonces |
| **IP protection** | None | 3-hop onion routing |
| **Metadata** | Google sees all connection metadata | No single entity sees full picture |
| **Server trust** | Full trust in Google/Firebase | Zero trust — nodes can't read messages or see sender IP |
| **Identity** | Random UUID (no crypto backing) | Ed25519 public key (cryptographically verifiable) |
| **Forward secrecy** | None | Per-message nonces; future: rotating key pairs (Protocol V2) |
| **Key storage** | AsyncStorage (plaintext) | Keychain/Keystore via expo-secure-store |

---

## 10. Estimated Effort

| Phase | Complexity | Estimate |
|-------|-----------|----------|
| Phase 1: Crypto & Identity | Low | 1-2 sessions |
| Phase 2: Onion Routing | High | 3-4 sessions |
| Phase 3: Message Transport | High | 2-3 sessions |
| Phase 4: Contact Exchange | Medium | 1 session |
| Phase 5: Notifications | Medium | 1-2 sessions |
| Phase 6: Cleanup | Low | 1 session |
| **Total** | | **~9-12 sessions** |

---

## 11. References

- **Session Whitepaper:** https://arxiv.org/pdf/2002.04609.pdf
- **Session Protocol V2 Blog:** https://getsession.org/blog/session-protocol-v2
- **Session Android (active repo):** https://github.com/session-foundation/session-android
- **Key source files:**
  - `SnodeAPI.kt` — Swarm and snode RPC methods
  - `OnionRequestAPI.kt` — Onion routing implementation
  - `OnionRequestEncryption.kt` — Per-hop encryption
  - `MessageSender.kt` — Message wrapping and sending
  - `Snode.kt` — RPC method definitions (store, retrieve, delete, etc.)
- **Session Network Docs:** https://docs.getsession.org/session-network
- **Seed Nodes:** `seed1.getsession.org:4443`, `seed2.getsession.org:4443`, `seed3.getsession.org:4443`
