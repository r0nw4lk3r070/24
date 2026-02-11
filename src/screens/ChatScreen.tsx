import React, { useEffect, useState, useRef } from 'react';
import { 
  View, 
  TextInput, 
  FlatList, 
  Text, 
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  Alert
} from 'react-native';
import { RouteProp, useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/AppNavigator';
import { sendMessage, getMessages, listenForMessages, markAllMessagesAsRead, markMessageAsDelivered } from '../services/firebaseMessageService';
import { getUser } from '../services/authService';
import { listenToPresence, formatLastSeen } from '../services/presenceService';
import { Message } from '../types';

type ChatScreenRouteProp = RouteProp<RootStackParamList, 'Chat'>;

interface ChatScreenProps {
  route: ChatScreenRouteProp;
}

const ChatScreen: React.FC<ChatScreenProps> = ({ route }) => {
  const { contactId, contactName } = route.params;
  const navigation = useNavigation();
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [myUserId, setMyUserId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [contactPresence, setContactPresence] = useState<{
    status: 'online' | 'offline';
    lastSeen: number;
  } | null>(null);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    loadUser();
  }, []);

  useEffect(() => {
    if (!myUserId) return;

    // Load initial messages
    loadMessages();
    
    // Mark all messages as read
    markAllMessagesAsRead(myUserId, contactId);
    
    // Set up real-time listener for new messages
    console.log('Setting up real-time listener for chat:', contactId);
    const unsubscribe = listenForMessages(myUserId, contactId, (newMessage) => {
      console.log('New message received:', newMessage.id);
      
      // If it's not my message, mark as delivered
      if (newMessage.senderId !== myUserId) {
        markMessageAsDelivered(myUserId, contactId, newMessage.id);
      }
      
      setMessages((prevMessages) => {
        // Check if message already exists
        if (prevMessages.some(m => m.id === newMessage.id)) {
          return prevMessages;
        }
        return [newMessage, ...prevMessages].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
      });
    });
    
    // Listen to contact's presence
    const unsubscribePresence = listenToPresence(contactId, (presence) => {
      console.log('Contact presence:', presence);
      setContactPresence(presence);
    });
    
    return () => {
      console.log('Cleaning up message listener');
      unsubscribe();
      unsubscribePresence();
    };
  }, [myUserId, contactId]);

  const loadUser = async () => {
    const user = await getUser();
    if (user) {
      setMyUserId(user.uniqueId);
    }
  };

  const loadMessages = async () => {
    if (!myUserId) return;
    
    try {
      const msgs = await getMessages(myUserId, contactId);
      setMessages(msgs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()));
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const handleDeleteChat = () => {
    Alert.alert(
      'Delete Chat',
      `Delete all messages with ${contactName}? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              // Import the delete function
              const { clearMessagesForContact } = await import('../services/messageService');
              await clearMessagesForContact(contactId);
              setMessages([]);
              Alert.alert('Success', 'Chat deleted');
              navigation.goBack();
            } catch (error) {
              console.error('Delete chat error:', error);
              Alert.alert('Error', 'Failed to delete chat');
            }
          }
        }
      ]
    );
  };

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !myUserId) return;
    
    setLoading(true);
    try {
      console.log('Sending message to:', contactId);
      await sendMessage(myUserId, contactId, messageInput.trim(), false);
      
      setMessageInput('');
      
      // Scroll to top (newest message)
      setTimeout(() => {
        flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
      }, 100);
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (date: Date) => {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const getTimeRemaining = (timestamp: Date) => {
    const now = Date.now();
    const messageTime = timestamp.getTime();
    const hoursRemaining = Math.max(0, 24 - Math.floor((now - messageTime) / (1000 * 60 * 60)));
    return hoursRemaining;
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isMyMessage = item.senderId === myUserId;
    const hoursLeft = getTimeRemaining(item.timestamp);
    
    // Delivery status indicator
    const getStatusIcon = () => {
      if (!isMyMessage) return null;
      if (item.status === 'read') return '✓✓';
      if (item.status === 'delivered') return '✓✓';
      if (item.status === 'sent') return '✓';
      return '○'; // sending
    };
    
    const getStatusColor = () => {
      if (item.status === 'read') return '#4FC3F7';
      if (item.status === 'delivered') return '#AAA';
      return '#AAA';
    };
    
    return (
      <View style={[styles.messageContainer, isMyMessage && styles.myMessageContainer]}>
        <View style={[styles.messageBubble, isMyMessage ? styles.myMessageBubble : styles.theirMessageBubble]}>
          <Text style={[styles.messageText, isMyMessage && styles.myMessageText]}>
            {item.content}
          </Text>
          <View style={styles.messageFooter}>
            <Text style={[styles.timestamp, isMyMessage && styles.myTimestamp]}>
              {formatTime(item.timestamp)}
            </Text>
            {isMyMessage && (
              <Text style={[styles.statusIcon, { color: getStatusColor() }]}>
                {getStatusIcon()}
              </Text>
            )}
            <Text style={[styles.expiryText, isMyMessage && styles.myExpiryText]}>
              {hoursLeft}h
            </Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Presence Header */}
      <View style={styles.presenceHeader}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.contactName}>{contactName}</Text>
          {contactPresence && (
            <View style={styles.presenceInfo}>
              <View style={[
                styles.presenceDot, 
                contactPresence.status === 'online' && styles.presenceDotOnline
              ]} />
              <Text style={styles.presenceText}>
                {contactPresence.status === 'online' ? 'online' : formatLastSeen(contactPresence.lastSeen)}
              </Text>
            </View>
          )}
        </View>
        <TouchableOpacity 
          onPress={handleDeleteChat}
          style={styles.deleteButton}
        >
          <Text style={styles.deleteButtonText}>🗑️</Text>
        </TouchableOpacity>
      </View>
      
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <View style={styles.messagesContainer}>
          {messages.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No messages yet</Text>
              <Text style={styles.emptyStateHint}>
                Messages disappear after 24 hours
              </Text>
            </View>
          ) : (
            <FlatList
              ref={flatListRef}
              data={messages}
              renderItem={renderMessage}
              keyExtractor={(item) => item.id}
              inverted
              contentContainerStyle={styles.messagesList}
            />
          )}
        </View>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={messageInput}
            onChangeText={setMessageInput}
            placeholder="Type a message..."
            placeholderTextColor="#999"
            multiline
            maxLength={500}
            editable={!loading}
          />
          <TouchableOpacity 
            style={[styles.sendButton, (!messageInput.trim() || loading) && styles.sendButtonDisabled]}
            onPress={handleSendMessage}
            disabled={!messageInput.trim() || loading}
          >
            <Text style={styles.sendButtonText}>
              {loading ? '...' : '→'}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  presenceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  backButtonText: {
    fontSize: 24,
    color: '#2196F3',
  },
  headerInfo: {
    flex: 1,
  },
  deleteButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  deleteButtonText: {
    fontSize: 20,
  },
  contactName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  presenceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  presenceDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#999',
    marginRight: 6,
  },
  presenceDotOnline: {
    backgroundColor: '#4CAF50',
  },
  presenceText: {
    fontSize: 12,
    color: '#666',
  },
  keyboardView: {
    flex: 1,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesList: {
    padding: 16,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#999',
    marginBottom: 8,
  },
  emptyStateHint: {
    fontSize: 12,
    color: '#BBB',
  },
  messageContainer: {
    marginBottom: 12,
    alignItems: 'flex-start',
  },
  myMessageContainer: {
    alignItems: 'flex-end',
  },
  messageBubble: {
    maxWidth: '75%',
    padding: 12,
    borderRadius: 16,
  },
  theirMessageBubble: {
    backgroundColor: '#FFF',
    borderBottomLeftRadius: 4,
  },
  myMessageBubble: {
    backgroundColor: '#2196F3',
    borderBottomRightRadius: 4,
  },
  messageText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 4,
  },
  myMessageText: {
    color: '#FFF',
  },
  messageFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 6,
  },
  timestamp: {
    fontSize: 11,
    color: '#999',
  },
  myTimestamp: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  statusIcon: {
    fontSize: 11,
    marginLeft: 2,
  },
  expiryText: {
    fontSize: 10,
    color: '#CCC',
    fontWeight: '600',
  },
  myExpiryText: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 8,
    fontSize: 16,
    maxHeight: 100,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#CCC',
  },
  sendButtonText: {
    fontSize: 24,
    color: '#FFF',
    fontWeight: 'bold',
  },
});

export default ChatScreen;