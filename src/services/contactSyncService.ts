import database from '@react-native-firebase/database';
import { getUser } from './authService';
import { addContact, getContacts } from './contactService';
import { getFCMToken } from './notificationService';

/**
 * Bidirectional Contact Sync Service
 * When Device A scans Device B's QR:
 * 1. Device A adds Device B locally
 * 2. Device A writes to Firebase: /contactRequests/{deviceB}/{deviceA}
 * 3. Device B listens for new requests and auto-adds Device A back
 */

// Write contact request to Firebase
export const sendContactRequest = async (targetUserId: string, targetUsername: string, targetFcmToken?: string): Promise<void> => {
  try {
    const myUser = await getUser();
    if (!myUser) throw new Error('Not logged in');

    const myFcmToken = await getFCMToken();

    // Write to /contactRequests/{targetUserId}/{myUserId}
    await database().ref(`contactRequests/${targetUserId}/${myUser.uniqueId}`).set({
      userId: myUser.uniqueId,
      username: myUser.username,
      fcmToken: myFcmToken || null,
      timestamp: database.ServerValue.TIMESTAMP,
    });

    console.log(`Contact request sent to ${targetUsername} (${targetUserId})`);
  } catch (error) {
    console.error('Error sending contact request:', error);
    throw error;
  }
};

// Listen for incoming contact requests and auto-add them
export const listenForContactRequests = (myUserId: string): (() => void) => {
  const requestsRef = database().ref(`contactRequests/${myUserId}`);

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
