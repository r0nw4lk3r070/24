import AsyncStorage from '@react-native-async-storage/async-storage';
import { Message } from '../types';

const MESSAGE_STORAGE_KEY = '@Nalid24:Messages';
const MESSAGE_EXPIRATION_TIME = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

// Helper to get storage key for a specific contact
const getContactMessageKey = (contactId: string) => `${MESSAGE_STORAGE_KEY}:${contactId}`;

export interface MessageService {
  sendMessage: (contactId: string, message: Omit<Message, 'id' | 'timestamp'>) => Promise<Message>;
  getMessages: (contactId: string) => Promise<Message[]>;
  cleanupOldMessages: (contactId: string) => Promise<void>;
  deleteMessage: (contactId: string, messageId: string) => Promise<void>;
  clearAllMessages: (contactId: string) => Promise<void>;
}

// Send a new message to a specific contact
export const sendMessage = async (
  contactId: string,
  messageData: Omit<Message, 'id' | 'timestamp'>
): Promise<Message> => {
  try {
    const messages = await getMessages(contactId);
    const newMessage: Message = {
      ...messageData,
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
    };
    
    messages.push(newMessage);
    await AsyncStorage.setItem(getContactMessageKey(contactId), JSON.stringify(messages));
    
    // Cleanup old messages after adding new one
    await cleanupOldMessages(contactId);
    
    return newMessage;
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
};

// Get all messages with a specific contact
export const getMessages = async (contactId: string): Promise<Message[]> => {
  try {
    const storedMessages = await AsyncStorage.getItem(getContactMessageKey(contactId));
    if (!storedMessages) return [];
    
    const messages = JSON.parse(storedMessages);
    // Convert timestamp strings back to Date objects
    return messages.map((msg: any) => ({
      ...msg,
      timestamp: new Date(msg.timestamp),
    }));
  } catch (error) {
    console.error('Error getting messages:', error);
    return [];
  }
};

// Cleanup messages older than 24 hours for a specific contact
export const cleanupOldMessages = async (contactId: string): Promise<void> => {
  try {
    const messages = await getMessages(contactId);
    const currentTime = Date.now();
    
    const filteredMessages = messages.filter((message) => {
      const messageTime = new Date(message.timestamp).getTime();
      return currentTime - messageTime < MESSAGE_EXPIRATION_TIME;
    });
    
    await AsyncStorage.setItem(getContactMessageKey(contactId), JSON.stringify(filteredMessages));
  } catch (error) {
    console.error('Error cleaning up messages:', error);
  }
};

// Delete a specific message with a contact
export const deleteMessage = async (contactId: string, messageId: string): Promise<void> => {
  try {
    const messages = await getMessages(contactId);
    const filteredMessages = messages.filter((msg) => msg.id !== messageId);
    await AsyncStorage.setItem(getContactMessageKey(contactId), JSON.stringify(filteredMessages));
  } catch (error) {
    console.error('Error deleting message:', error);
    throw error;
  }
};

// Clear all messages with a specific contact
export const clearAllMessages = async (contactId: string): Promise<void> => {
  try {
    await AsyncStorage.removeItem(getContactMessageKey(contactId));
  } catch (error) {
    console.error('Error clearing messages:', error);
    throw error;
  }
};

// Clear all messages for all contacts
export const clearAllMessagesGlobally = async (): Promise<void> => {
  try {
    const allKeys = await AsyncStorage.getAllKeys();
    const messageKeys = allKeys.filter(key => key.startsWith(MESSAGE_STORAGE_KEY));
    await AsyncStorage.multiRemove(messageKeys);
    console.log(`Cleared ${messageKeys.length} message storage keys`);
  } catch (error) {
    console.error('Error clearing all messages:', error);
    throw error;
  }
};

// Alias for chat deletion
export const clearMessagesForContact = clearAllMessages;

// Message service object
export const messageService: MessageService = {
  sendMessage,
  getMessages,
  cleanupOldMessages,
  deleteMessage,
  clearAllMessages,
};

export default messageService;
