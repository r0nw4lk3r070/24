import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Message } from '../types';

interface ChatBubbleProps {
  message: Message;
  isCurrentUser?: boolean;
}

const ChatBubble: React.FC<ChatBubbleProps> = ({ message, isCurrentUser = false }) => {
  return (
    <View style={[styles.container, isCurrentUser ? styles.currentUser : styles.otherUser]}>
      <Text style={styles.message}>{message.content}</Text>
      <Text style={styles.timestamp}>
        {new Date(message.timestamp).toLocaleTimeString()}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 5,
    padding: 10,
    borderRadius: 10,
    maxWidth: '80%',
  },
  currentUser: {
    alignSelf: 'flex-end',
    backgroundColor: '#007AFF',
  },
  otherUser: {
    alignSelf: 'flex-start',
    backgroundColor: '#f0f0f0',
  },
  message: {
    marginVertical: 2,
    color: '#000',
  },
  timestamp: {
    fontSize: 10,
    color: '#666',
    marginTop: 4,
  },
});

export default ChatBubble;