import database from '@react-native-firebase/database';
import { AppState, AppStateStatus } from 'react-native';
import { getDatabase } from './firebaseConfig';

/**
 * Presence Service for Nalid24
 * Tracks online/offline status using Firebase Realtime Database
 * Uses .info/connected for automatic presence detection
 */

let currentUserId: string | null = null;
let appStateSubscription: { remove: () => void } | null = null;

/**
 * Initialize presence tracking for a user
 * Call this after user logs in
 */
export const initializePresence = (userId: string): void => {
  if (currentUserId === userId) {
    console.log('Presence already initialized for user:', userId);
    return;
  }

  currentUserId = userId;
  console.log('Initializing presence for user:', userId);

  // Set up presence in Firebase
  const presenceRef = getDatabase().ref(`/presence/${userId}`);
  const connectedRef = getDatabase().ref('.info/connected');

  // Listen to connection state
  connectedRef.on('value', (snapshot) => {
    if (snapshot.val() === true) {
      console.log('Firebase connected - setting user online');

      // Set user as online
      presenceRef.set({
        status: 'online',
        lastSeen: database.ServerValue.TIMESTAMP,
      });

      // When disconnected, set as offline
      presenceRef.onDisconnect().set({
        status: 'offline',
        lastSeen: database.ServerValue.TIMESTAMP,
      });
    } else {
      console.log('Firebase disconnected');
    }
  });

  // Listen to app state changes
  appStateSubscription = AppState.addEventListener('change', handleAppStateChange);
};

/**
 * Handle app state changes (foreground/background)
 */
const handleAppStateChange = (nextAppState: AppStateStatus) => {
  if (!currentUserId) return;

  const presenceRef = getDatabase().ref(`/presence/${currentUserId}`);

  if (nextAppState === 'active') {
    // App came to foreground
    console.log('App active - setting user online');
    presenceRef.set({
      status: 'online',
      lastSeen: database.ServerValue.TIMESTAMP,
    });
  } else if (nextAppState === 'background') {
    // App went to background
    console.log('App background - setting user offline');
    presenceRef.set({
      status: 'offline',
      lastSeen: database.ServerValue.TIMESTAMP,
    });
  }
};

/**
 * Get presence status for a user
 */
export const getUserPresence = async (userId: string): Promise<{
  status: 'online' | 'offline';
  lastSeen: number;
} | null> => {
  try {
    const snapshot = await getDatabase().ref(`/presence/${userId}`).once('value');
    const data = snapshot.val();

    if (!data) return null;

    return {
      status: data.status || 'offline',
      lastSeen: data.lastSeen || Date.now(),
    };
  } catch (error) {
    console.error('Error getting user presence:', error);
    return null;
  }
};

/**
 * Listen to presence changes for a user
 */
export const listenToPresence = (
  userId: string,
  callback: (presence: { status: 'online' | 'offline'; lastSeen: number }) => void
): (() => void) => {
  const presenceRef = getDatabase().ref(`/presence/${userId}`);

  const listener = presenceRef.on('value', (snapshot) => {
    const data = snapshot.val();
    if (data) {
      callback({
        status: data.status || 'offline',
        lastSeen: data.lastSeen || Date.now(),
      });
    }
  });

  // Return unsubscribe function
  return () => {
    presenceRef.off('value', listener);
  };
};

/**
 * Manually set user as offline
 * Call this on logout
 */
export const setUserOffline = async (userId: string): Promise<void> => {
  try {
    await getDatabase().ref(`/presence/${userId}`).set({
      status: 'offline',
      lastSeen: database.ServerValue.TIMESTAMP,
    });

    // Cancel any pending onDisconnect
    await getDatabase().ref(`/presence/${userId}`).onDisconnect().cancel();

    console.log('User set to offline:', userId);
  } catch (error) {
    console.error('Error setting user offline:', error);
  }
};

/**
 * Cleanup presence tracking
 * Call this on logout
 */
export const cleanupPresence = async (): Promise<void> => {
  if (!currentUserId) return;

  console.log('Cleaning up presence for user:', currentUserId);

  try {
    await setUserOffline(currentUserId);

    // Remove app state listener
    if (appStateSubscription) {
      appStateSubscription.remove();
      appStateSubscription = null;
    }

    // Remove connection listener
    const connectedRef = getDatabase().ref('.info/connected');
    connectedRef.off('value');

    currentUserId = null;
  } catch (error) {
    console.error('Error cleaning up presence:', error);
  }
};

/**
 * Format last seen time for display
 */
export const formatLastSeen = (timestamp: number): string => {
  const now = Date.now();
  const diff = now - timestamp;

  // Less than 1 minute
  if (diff < 60 * 1000) {
    return 'just now';
  }

  // Less than 1 hour
  if (diff < 60 * 60 * 1000) {
    const minutes = Math.floor(diff / (60 * 1000));
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  }

  // Less than 24 hours
  if (diff < 24 * 60 * 60 * 1000) {
    const hours = Math.floor(diff / (60 * 60 * 1000));
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  }

  // More than 24 hours
  const days = Math.floor(diff / (24 * 60 * 60 * 1000));
  return `${days} day${days > 1 ? 's' : ''} ago`;
};

export default {
  initializePresence,
  getUserPresence,
  listenToPresence,
  setUserOffline,
  cleanupPresence,
  formatLastSeen,
};
