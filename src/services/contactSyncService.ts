import database from '@react-native-firebase/database';
import { getUser } from './authService';
import { addContact } from './contactService';
import { getFCMToken } from './notificationService';
import { getDatabase } from './firebaseConfig';

/**
 * Bidirectional Contact Sync Service
 * When Device A scans Device B's QR:
 * 1. Device A adds Device B locally
 * 2. Device A writes to Firebase: /contactRequests/{deviceB}/{deviceA}
 * 3. Device B listens for new requests and auto-adds Device A back
 *
 * Also stores user FCM tokens in Firebase for push notification delivery.
 */

// Track if the global listener is already active
let globalListenerCleanup: (() => void) | null = null;

/**
 * Store/update the current user's FCM token in Firebase
 * Called on app start and token refresh so Cloud Functions can send push notifications
 */
export const storeUserFCMToken = async (userId: string): Promise<void> => {
  try {
    const fcmToken = await getFCMToken();
    if (!fcmToken) return;

    const user = await getUser();
    const username = user?.username || 'Unknown';

    await getDatabase().ref(`users/${userId}`).update({
      userId,
      username,
      fcmToken,
      updatedAt: database.ServerValue.TIMESTAMP,
    });

    console.log('FCM token stored in Firebase for user:', userId);
  } catch (error) {
    console.error('Error storing FCM token in Firebase:', error);
  }
};

// Write contact request to Firebase
export const sendContactRequest = async (targetUserId: string, targetUsername: string, _targetFcmToken?: string): Promise<void> => {
  try {
    const myUser = await getUser();
    if (!myUser) throw new Error('Not logged in');

    const myFcmToken = await getFCMToken();

    // Write to /contactRequests/{targetUserId}/{myUserId}
    await getDatabase().ref(`contactRequests/${targetUserId}/${myUser.uniqueId}`).set({
      userId: myUser.uniqueId,
      username: myUser.username,
      fcmToken: myFcmToken || null,
      timestamp: database.ServerValue.TIMESTAMP,
    });

    // Also store/update my own FCM token in Firebase for push notifications
    await storeUserFCMToken(myUser.uniqueId);

    console.log(`Contact request sent to ${targetUsername} (${targetUserId})`);
  } catch (error) {
    console.error('Error sending contact request:', error);
    throw error;
  }
};

// Listen for incoming contact requests and auto-add them
export const listenForContactRequests = (myUserId: string): (() => void) => {
  const requestsRef = getDatabase().ref(`contactRequests/${myUserId}`);

  const onNewRequest = requestsRef.on('child_added', async (snapshot) => {
    try {
      const requestData = snapshot.val();
      const requesterId = snapshot.key;

      if (!requestData || !requesterId) return;

      console.log('Received contact request from:', requestData.username);

      // Add requester to contacts
      await addContact(requesterId, requestData.username, requestData.fcmToken);

      // Remove the handled request from Firebase
      await snapshot.ref.remove();

      console.log(`Auto-added ${requestData.username} as contact`);
    } catch (error) {
      console.error('Error handling contact request:', error);
    }
  });

  // Return cleanup function
  return () => {
    requestsRef.off('child_added', onNewRequest);
  };
};

/**
 * Initialize the global contact request listener.
 * Should be called once at app startup (e.g., after auth) so that
 * incoming contact requests are processed regardless of which screen is active.
 */
export const initializeGlobalContactListener = (myUserId: string): void => {
  // Don't double-register
  if (globalListenerCleanup) {
    globalListenerCleanup();
    globalListenerCleanup = null;
  }

  globalListenerCleanup = listenForContactRequests(myUserId);
  console.log('Global contact request listener initialized for:', myUserId);
};

/**
 * Cleanup the global contact request listener (e.g., on logout).
 */
export const cleanupGlobalContactListener = (): void => {
  if (globalListenerCleanup) {
    globalListenerCleanup();
    globalListenerCleanup = null;
    console.log('Global contact request listener cleaned up');
  }
};
