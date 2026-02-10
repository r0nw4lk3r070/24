import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { messageService } from '../services/messageService';
import { Message } from '../types';

interface MessageContextType {
  messages: Message[];
  loading: boolean;
  sendMessage: (messageData: Omit<Message, 'id' | 'timestamp'>) => Promise<void>;
  deleteMessage: (messageId: string) => Promise<void>;
  refreshMessages: () => Promise<void>;
}

const MessageContext = createContext<MessageContextType | undefined>(undefined);

interface MessageProviderProps {
  children: ReactNode;
}

export const MessageProvider: React.FC<MessageProviderProps> = ({ children }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  const loadMessages = async () => {
    try {
      const storedMessages = await messageService.getMessages();
      setMessages(storedMessages);
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMessages();

    // Cleanup old messages every minute
    const cleanupInterval = setInterval(async () => {
      await messageService.cleanupOldMessages();
      await loadMessages();
    }, 60 * 1000);

    return () => clearInterval(cleanupInterval);
  }, []);

  const sendMessage = async (messageData: Omit<Message, 'id' | 'timestamp'>) => {
    try {
      await messageService.sendMessage(messageData);
      await loadMessages();
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  };

  const deleteMessage = async (messageId: string) => {
    try {
      await messageService.deleteMessage(messageId);
      await loadMessages();
    } catch (error) {
      console.error('Error deleting message:', error);
      throw error;
    }
  };

  const refreshMessages = async () => {
    await loadMessages();
  };

  return (
    <MessageContext.Provider
      value={{ messages, loading, sendMessage, deleteMessage, refreshMessages }}
    >
      {children}
    </MessageContext.Provider>
  );
};

export const useMessages = (): MessageContextType => {
  const context = useContext(MessageContext);
  if (context === undefined) {
    throw new Error('useMessages must be used within a MessageProvider');
  }
  return context;
};

export default useMessages;
