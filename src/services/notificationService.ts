import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import messaging from '@react-native-firebase/messaging';
import AsyncStorage from '@react-native-async-storage/async-storage';

const FCM_TOKEN_KEY = '@Nalid24:FCMToken';

/**
 * Notification Service for Nalid24
 * Uses Firebase Cloud Messaging for push notifications
 * Messages are encrypted client-side before sending through FCM
 */

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Request notification permissions
 */
export const requestNotificationPermissions = async (): Promise<boolean> => {
  if (!Device.isDevice) {
    console.warn('Notifications only work on physical devices');
    return false;
  }

  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.warn('Notification permission not granted');
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error requesting notification permissions:', error);
    return false;
  }
};

/**
 * Get FCM token for this device
 */
export const getFCMToken = async (): Promise<string | null> => {
  try {
    // Check if we have cached token
    const cachedToken = await AsyncStorage.getItem(FCM_TOKEN_KEY);
    if (cachedToken) {
      return cachedToken;
    }

    // Request permission first
    const authStatus = await messaging().requestPermission();
    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    if (!enabled) {
      console.warn('FCM permission not granted');
      return null;
    }

    // Get FCM token
    const token = await messaging().getToken();
    
    // Cache the token
    await AsyncStorage.setItem(FCM_TOKEN_KEY, token);
    
    console.log('FCM Token:', token);
    return token;
  } catch (error) {
    console.error('Error getting FCM token:', error);
    return null;
  }
};

/**
 * Listen for FCM token refresh
 */
export const onTokenRefresh = (callback: (token: string) => void) => {
  return messaging().onTokenRefresh(async (token) => {
    await AsyncStorage.setItem(FCM_TOKEN_KEY, token);
    callback(token);
  });
};

/**
 * Handle incoming FCM messages when app is in foreground
 */
export const onMessageReceived = (
  callback: (encryptedMessage: string) => void
) => {
  return messaging().onMessage(async (remoteMessage) => {
    console.log('Foreground message received:', remoteMessage);
    
    // Extract encrypted message from FCM payload
    const encryptedData = remoteMessage.data?.encryptedMessage;
    
    if (encryptedData) {
      callback(encryptedData as string);
    }

    // Show local notification
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'New Message',
        body: 'You have a new encrypted message',
        data: remoteMessage.data,
      },
      trigger: null, // Show immediately
    });
  });
};

/**
 * Handle background/quit state messages
 */
export const onBackgroundMessage = () => {
  messaging().setBackgroundMessageHandler(async (remoteMessage) => {
    console.log('Background message received:', remoteMessage);
    // Background messages are handled by the system
    // Decryption happens when user opens the app
  });
};

/**
 * Send a push notification via FCM
 * Note: This requires a server endpoint to actually send via FCM
 * The client cannot send notifications directly
 */
export const sendPushNotification = async (
  targetFCMToken: string,
  encryptedMessage: string
): Promise<boolean> => {
  try {
    // This needs to be sent to your backend server
    // which then forwards to FCM with your server key
    
    // For now, this is a placeholder
    // You'll need a simple backend endpoint like:
    // POST /send-notification
    // { token: targetFCMToken, encryptedMessage: encryptedMessage }
    
    console.warn('sendPushNotification needs a backend server endpoint');
    return false;
  } catch (error) {
    console.error('Error sending push notification:', error);
    return false;
  }
};

/**
 * Initialize notification service
 */
export const initializeNotifications = async (): Promise<void> => {
  try {
    // Request permissions
    await requestNotificationPermissions();
    
    // Get FCM token
    await getFCMToken();
    
    // Set up background message handler
    onBackgroundMessage();
    
    console.log('Notification service initialized');
  } catch (error) {
    console.error('Error initializing notifications:', error);
  }
};

export default {
  requestNotificationPermissions,
  getFCMToken,
  onTokenRefresh,
  onMessageReceived,
  sendPushNotification,
  initializeNotifications,
};
