import database from '@react-native-firebase/database';
import { Message } from '../types';
import { encryptMessage, decryptMessage, generateSharedSecret } from './encryptionService';

const MESSAGE_EXPIRATION_TIME = 24 * 60 * 60 * 1000; // 24 hours

type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read';

/**
 * Firebase Realtime Database Message Service
 * Messages sync in real-time between devices
 */

// Generate chat ID (always same order regardless of who initiates)
export const getChatId = (userId1: string, userId2: string): string => {
  return [userId1, userId2].sort().join('_');
};

/**
 * Send a message via Firebase Realtime Database
 */
export const sendMessage = async (
  myUserId: string,
  contactId: string,
  messageContent: string
): Promise<Message> => {
  try {
    const chatId = getChatId(myUserId, contactId);
    const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Encrypt message (using shared secret between users)
    const sharedSecret = await generateSharedSecret(myUserId, contactId);
    const encryptedContent = await encryptMessage(messageContent, sharedSecret);
    
    const message: Message = {
      id: messageId,
      content: messageContent, // Store decrypted locally for display
      senderId: myUserId,
      timestamp: new Date(),
      isEmoji: false,
      status: 'sending',
    };
    
    // Store encrypted message in Firebase
    const messageData = {
      encryptedContent,
      senderId: myUserId,
      timestamp: database.ServerValue.TIMESTAMP,
      status: 'sent',
    };
    
    await database()
      .ref(`chats/${chatId}/messages/${messageId}`)
      .set(messageData);
    
    console.log('Message sent to Firebase:', messageId);
    return message;
  } catch (error) {
    console.error('Error sending message to Firebase:', error);
    throw error;
  }
};

/**
 * Listen for new messages in a chat
 */
export const listenForMessages = (
  myUserId: string,
  contactId: string,
  onMessageReceived: (message: Message) => void
): (() => void) => {
  const chatId = getChatId(myUserId, contactId);
  const messagesRef = database().ref(`chats/${chatId}/messages`);
  
  const listener = messagesRef.on('child_added', async (snapshot) => {
    try {
      const data = snapshot.val();
      const messageId = snapshot.key;
      
      if (!data || !messageId) return;
      
      // Decrypt message
      const sharedSecret = await generateSharedSecret(myUserId, contactId);
      const decryptedContent = await decryptMessage(data.encryptedContent, sharedSecret);
      
      const message: Message = {
        id: messageId,
        content: decryptedContent,
        senderId: data.senderId,
        timestamp: new Date(data.timestamp),
        isEmoji: false,
        status: data.status || 'sent',
        deliveredAt: data.deliveredAt ? new Date(data.deliveredAt) : undefined,
        readAt: data.readAt ? new Date(data.readAt) : undefined,
      };
      
      onMessageReceived(message);
    } catch (error) {
      console.error('Error processing received message:', error);
    }
  });
  
  // Return cleanup function
  return () => {
    messagesRef.off('child_added', listener);
  };
};

/**
 * Get all messages in a chat (initial load)
 */
export const getMessages = async (
  myUserId: string,
  contactId: string
): Promise<Message[]> => {
  try {
    const chatId = getChatId(myUserId, contactId);
    const snapshot = await database()
      .ref(`chats/${chatId}/messages`)
      .orderByChild('timestamp')
      .once('value');
    
    if (!snapshot.exists()) {
      return [];
    }
    
    const messages: Message[] = [];
    const now = Date.now();
    
    snapshot.forEach((childSnapshot) => {
      const data = childSnapshot.val();
      const messageId = childSnapshot.key;
      
      if (!data || !messageId) return;
      
      // Check if message is expired (older than 24h)
      const messageAge = now - data.timestamp;
      if (messageAge > MESSAGE_EXPIRATION_TIME) {
        // Delete expired message
        database().ref(`chats/${chatId}/messages/${messageId}`).remove();
        return;
      }
      
      messages.push({
        id: messageId,
        content: data.encryptedContent, // Will decrypt in UI for now
        senderId: data.senderId,
        timestamp: new Date(data.timestamp),
        isEmoji: false,
      });
    });
    
    return messages;
  } catch (error) {
    console.error('Error getting messages from Firebase:', error);
    return [];
  }
};

/**
 * Cleanup old messages (call periodically)
 */
export const cleanupOldMessages = async (
  myUserId: string,
  contactId: string
): Promise<void> => {
  try {
    const chatId = getChatId(myUserId, contactId);
    const cutoffTime = Date.now() - MESSAGE_EXPIRATION_TIME;
    
    const snapshot = await database()
      .ref(`chats/${chatId}/messages`)
      .orderByChild('timestamp')
      .endAt(cutoffTime)
      .once('value');
    
    if (!snapshot.exists()) return;
    
    const updates: { [key: string]: null } = {};
    snapshot.forEach((childSnapshot) => {
      const messageId = childSnapshot.key;
      if (messageId) {
        updates[`chats/${chatId}/messages/${messageId}`] = null;
      }
    });
    
    await database().ref().update(updates);
    console.log(`Cleaned up ${Object.keys(updates).length} expired messages`);
  } catch (error) {
    console.error('Error cleaning up old messages:', error);
  }
};

/**
 * Clear all messages in a chat
 */
export const clearAllMessages = async (
  myUserId: string,
  contactId: string
): Promise<void> => {
  try {
    const chatId = getChatId(myUserId, contactId);
    await database().ref(`chats/${chatId}/messages`).remove();
    console.log('All messages cleared from Firebase');
  } catch (error) {
    console.error('Error clearing messages from Firebase:', error);
    throw error;
  }
};

/**
 * Mark message as delivered
 * Call this when the recipient's app receives the message
 */
export const markMessageAsDelivered = async (
  myUserId: string,
  contactId: string,
  messageId: string
): Promise<void> => {
  try {
    const chatId = getChatId(myUserId, contactId);
    await database()
      .ref(`chats/${chatId}/messages/${messageId}`)
      .update({
        status: 'delivered',
        deliveredAt: database.ServerValue.TIMESTAMP,
      });
    console.log('Message marked as delivered:', messageId);
  } catch (error) {
    console.error('Error marking message as delivered:', error);
  }
};

/**
 * Mark message as read
 * Call this when the recipient opens the chat and views the message
 */
export const markMessageAsRead = async (
  myUserId: string,
  contactId: string,
  messageId: string
): Promise<void> => {
  try {
    const chatId = getChatId(myUserId, contactId);
    
    // Add read receipt with user ID and timestamp
    await database()
      .ref(`chats/${chatId}/messages/${messageId}/readBy/${myUserId}`)
      .set(database.ServerValue.TIMESTAMP);
    
    // Also update main message status
    await database()
      .ref(`chats/${chatId}/messages/${messageId}`)
      .update({
        status: 'read',
        readAt: database.ServerValue.TIMESTAMP,
      });
    
    console.log('Message marked as read:', messageId);
  } catch (error) {
    console.error('Error marking message as read:', error);
  }
};

/**
 * Mark all messages in a chat as read
 * Call this when user opens a chat
 */
export const markAllMessagesAsRead = async (
  myUserId: string,
  contactId: string
): Promise<void> => {
  try {
    const chatId = getChatId(myUserId, contactId);
    
    // Get all unread messages (sent by contact)
    const snapshot = await database()
      .ref(`chats/${chatId}/messages`)
      .orderByChild('senderId')
      .equalTo(contactId)
      .once('value');
    
    if (!snapshot.exists()) return;
    
    const updates: Record<string, string | number | null> = {};
    const timestamp = Date.now();
    
    snapshot.forEach((childSnapshot) => {
      const messageId = childSnapshot.key;
      const data = childSnapshot.val();
      
      // Only mark as read if not already read
      if (messageId && data.status !== 'read') {
        updates[`chats/${chatId}/messages/${messageId}/status`] = 'read';
        updates[`chats/${chatId}/messages/${messageId}/readAt`] = timestamp;
        updates[`chats/${chatId}/messages/${messageId}/readBy/${myUserId}`] = timestamp;
      }
    });
    
    if (Object.keys(updates).length > 0) {
      await database().ref().update(updates);
      console.log(`Marked ${Object.keys(updates).length / 3} messages as read`);
    }
  } catch (error) {
    console.error('Error marking all messages as read:', error);
  }
};

/**
 * Listen to message status updates
 * Use this to update UI when message delivery status changes
 */
export const listenToMessageStatus = (
  myUserId: string,
  contactId: string,
  messageId: string,
  onStatusUpdate: (status: MessageStatus, timestamp?: number) => void
): (() => void) => {
  const chatId = getChatId(myUserId, contactId);
  const messageRef = database().ref(`chats/${chatId}/messages/${messageId}`);
  
  const listener = messageRef.on('value', (snapshot) => {
    const data = snapshot.val();
    if (data) {
      const status = data.status || 'sent';
      const timestamp = data.status === 'delivered' ? data.deliveredAt : 
                       data.status === 'read' ? data.readAt : 
                       data.timestamp;
      onStatusUpdate(status, timestamp);
    }
  });
  
  // Return cleanup function
  return () => {
    messageRef.off('value', listener);
  };
};

export default {
  sendMessage,
  listenForMessages,
  getMessages,
  cleanupOldMessages,
  clearAllMessages,
  markMessageAsDelivered,
  markMessageAsRead,
  markAllMessagesAsRead,
  listenToMessageStatus,
  getChatId,
};
