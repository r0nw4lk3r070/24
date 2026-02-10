import AsyncStorage from '@react-native-async-storage/async-storage';
import { Message } from '../types';

const MESSAGE_EXPIRATION_TIME = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

export const cleanupOldMessages = async (): Promise<void> => {
    try {
        const messages = await AsyncStorage.getItem('messages');
        if (messages) {
            const parsedMessages: Message[] = JSON.parse(messages);
            const currentTime = Date.now();
            const filteredMessages = parsedMessages.filter((message: Message) => {
                const messageTime = new Date(message.timestamp).getTime();
                return (currentTime - messageTime) < MESSAGE_EXPIRATION_TIME;
            });
            await AsyncStorage.setItem('messages', JSON.stringify(filteredMessages));
        }
    } catch (error) {
        console.error('Error cleaning up old messages:', error);
    }
};