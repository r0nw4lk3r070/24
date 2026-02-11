import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  StyleSheet,
  SafeAreaView,
  Modal,
  Alert
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import QRCodeScanner from '../components/QRCodeScanner';
import QRCodeDisplay from '../components/QRCodeDisplay';
import { getContacts, addContact, removeContact, Contact } from '../services/contactService';
import { getUser } from '../services/authService';
import { getFCMToken } from '../services/notificationService';
import { sendContactRequest } from '../services/contactSyncService';
import { listenForLastMessage } from '../services/firebaseMessageService';
import AsyncStorage from '@react-native-async-storage/async-storage';

type ContactsScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Contacts'>;

const ContactsScreen = () => {
  const navigation = useNavigation<ContactsScreenNavigationProp>();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [showScanner, setShowScanner] = useState(false);
  const [showMyQR, setShowMyQR] = useState(false);
  const [myUserId, setMyUserId] = useState<string>('');
  const [myUsername, setMyUsername] = useState<string>('');
  const [myFcmToken, setMyFcmToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  // Track unread messages per contact: { contactId: { hasUnread: boolean, timestamp: number } }
  const [unreadMap, setUnreadMap] = useState<Record<string, boolean>>({});
  const lastMessageCleanups = useRef<(() => void)[]>([]);

  useEffect(() => {
    loadData();
    loadFCMToken();
  }, [myUserId]);

  // Refresh contacts list whenever the screen comes into focus
  // (e.g., contact auto-added via global listener while on ChatScreen)
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadData();
      // Refresh unread status when returning from a chat
      if (myUserId && contacts.length > 0) {
        checkUnreadMessages(contacts);
      }
    });
    return unsubscribe;
  }, [navigation, myUserId, contacts]);

  // Set up real-time listeners for last message in each chat
  useEffect(() => {
    if (!myUserId || contacts.length === 0) return;

    // Clean up previous listeners
    lastMessageCleanups.current.forEach(fn => fn());
    lastMessageCleanups.current = [];

    contacts.forEach((contact) => {
      const cleanup = listenForLastMessage(myUserId, contact.id, async (lastMsg) => {
        if (!lastMsg) return;
        // Only show unread if the message is from the contact (not from me)
        if (lastMsg.senderId === myUserId) return;
        const lastReadKey = `@Nalid24:LastRead:${contact.id}`;
        const lastReadStr = await AsyncStorage.getItem(lastReadKey);
        const lastRead = lastReadStr ? parseInt(lastReadStr, 10) : 0;
        const hasUnread = lastMsg.timestamp > lastRead;
        setUnreadMap(prev => {
          if (prev[contact.id] === hasUnread) return prev;
          return { ...prev, [contact.id]: hasUnread };
        });
      });
      lastMessageCleanups.current.push(cleanup);
    });

    return () => {
      lastMessageCleanups.current.forEach(fn => fn());
      lastMessageCleanups.current = [];
    };
  }, [myUserId, contacts.length]);

  // Check unread messages for all contacts
  const checkUnreadMessages = async (contactsList: Contact[]) => {
    // This runs on focus to update badges after reading a chat
    const newUnreadMap: Record<string, boolean> = {};
    for (const contact of contactsList) {
      // We rely on the real-time listener to set the correct state,
      // but we can still force a re-check of lastRead here
      const lastReadKey = `@Nalid24:LastRead:${contact.id}`;
      const lastReadStr = await AsyncStorage.getItem(lastReadKey);
      if (lastReadStr) {
        // Listener will handle the comparison; just trigger re-evaluation
        newUnreadMap[contact.id] = unreadMap[contact.id] || false;
      }
    }
  };

  const loadFCMToken = async () => {
    const token = await getFCMToken();
    setMyFcmToken(token);
    console.log('FCM Token loaded:', token?.slice(0, 20) + '...');
  };

  const loadData = async () => {
    try {
      const [contactsList, user] = await Promise.all([
        getContacts(),
        getUser()
      ]);
      
      setContacts(contactsList);
      if (user) {
        setMyUserId(user.uniqueId);
        setMyUsername(user.username);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleQRCodeScan = async (data: string) => {
    try {
      setShowScanner(false);
      
      // Parse QR code data (expecting JSON with userId and fcmToken)
      let scannedId = data;
      let scannedUsername = 'Unknown';
      let scannedFcmToken: string | undefined = undefined;
      
      try {
        const parsed = JSON.parse(data);
        scannedId = parsed.userId || parsed.id || parsed.uniqueId || data;
        scannedUsername = parsed.username || `User_${scannedId.slice(0, 8)}`;
        scannedFcmToken = parsed.fcmToken || undefined;
        
        console.log('Scanned QR data:', { 
          userId: scannedId, 
          username: scannedUsername, 
          hasFcmToken: !!scannedFcmToken 
        });
      } catch {
        // If not JSON, treat as plain ID
        scannedUsername = `User_${scannedId.slice(0, 8)}`;
        console.log('QR code is not JSON, using as plain ID');
      }
      
      // Check if trying to add self
      if (scannedId === myUserId) {
        Alert.alert('Error', 'You cannot add yourself as a contact');
        return;
      }
      
      // Add contact with FCM token
      await addContact(scannedId, scannedUsername, scannedFcmToken);
      
      // Send bidirectional contact request via Firebase
      await sendContactRequest(scannedId, scannedUsername, scannedFcmToken);
      
      await loadData();
      
      Alert.alert('Success', `Added ${scannedUsername} to your contacts\n\nThey will automatically receive your contact info.`);
    } catch (error) {
      console.error('Error adding contact:', error);
      Alert.alert('Error', 'Failed to add contact');
    }
  };

  const handleRemoveContact = (contact: Contact) => {
    Alert.alert(
      'Remove Contact',
      `Remove ${contact.username} from your contacts?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await removeContact(contact.id);
              await loadData();
            } catch (error) {
              console.error('Error removing contact:', error);
              Alert.alert('Error', 'Failed to remove contact');
            }
          }
        }
      ]
    );
  };

  const handleContactPress = async (contact: Contact) => {
    // Mark as read: save current timestamp before navigating to chat
    const lastReadKey = `@Nalid24:LastRead:${contact.id}`;
    await AsyncStorage.setItem(lastReadKey, Date.now().toString());
    // Clear unread indicator immediately
    setUnreadMap(prev => ({ ...prev, [contact.id]: false }));
    navigation.navigate('Chat', {
      contactId: contact.id,
      contactName: contact.username
    });
  };

  const renderContactItem = ({ item }: { item: Contact }) => (
    <TouchableOpacity 
      style={styles.contactItem}
      onPress={() => handleContactPress(item)}
      onLongPress={() => handleRemoveContact(item)}
    >
      <View style={styles.contactAvatar}>
        <Text style={styles.contactAvatarText}>
          {item.username.charAt(0).toUpperCase()}
        </Text>
      </View>
      <View style={styles.contactInfo}>
        <Text style={styles.contactName}>{item.username}</Text>
        {unreadMap[item.id] ? (
          <Text style={styles.unreadText}>New message</Text>
        ) : (
          <Text style={styles.contactId}>ID: {item.id.slice(0, 8)}...</Text>
        )}
      </View>
      {unreadMap[item.id] && (
        <View style={styles.unreadBadge} />
      )}
      <View style={styles.contactArrow}>
        <Text style={styles.arrowText}>›</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Contacts</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => setShowMyQR(true)}
          >
            <Text style={styles.headerButtonText}>My QR</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => navigation.navigate('Profile')}
          >
            <Text style={styles.headerButtonText}>Profile</Text>
          </TouchableOpacity>
        </View>
      </View>

      {contacts.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateTitle}>No Contacts Yet</Text>
          <Text style={styles.emptyStateText}>
            Scan a QR code to add your first contact
          </Text>
        </View>
      ) : (
        <FlatList
          data={contacts}
          renderItem={renderContactItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
        />
      )}

      <TouchableOpacity 
        style={styles.scanButton}
        onPress={() => setShowScanner(true)}
      >
        <Text style={styles.scanButtonText}>+ Scan QR Code</Text>
      </TouchableOpacity>

      {/* QR Scanner Modal */}
      <Modal
        visible={showScanner}
        animationType="slide"
        onRequestClose={() => setShowScanner(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Scan Contact QR Code</Text>
            <TouchableOpacity onPress={() => setShowScanner(false)}>
              <Text style={styles.modalClose}>✕</Text>
            </TouchableOpacity>
          </View>
          <QRCodeScanner onScan={handleQRCodeScan} />
        </SafeAreaView>
      </Modal>

      {/* My QR Code Modal */}
      <Modal
        visible={showMyQR}
        animationType="fade"
        transparent
        onRequestClose={() => setShowMyQR(false)}
      >
        <View style={styles.qrModalOverlay}>
          <View style={styles.qrModalContent}>
            <Text style={styles.qrModalTitle}>My QR Code</Text>
            <Text style={styles.qrModalSubtitle}>{myUsername}</Text>
            {myUserId ? (
              <QRCodeDisplay uniqueId={myUserId} username={myUsername} fcmToken={myFcmToken} size={240} />
            ) : null}
            <Text style={styles.qrModalHint}>
              Let others scan this to add you
            </Text>
            <TouchableOpacity
              style={styles.qrModalButton}
              onPress={() => setShowMyQR(false)}
            >
              <Text style={styles.qrModalButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  headerButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#2196F3',
    borderRadius: 8,
  },
  headerButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  listContent: {
    padding: 16,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  contactAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  contactAvatarText: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: '600',
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  contactId: {
    fontSize: 12,
    color: '#999',
    fontFamily: 'monospace',
  },
  unreadText: {
    fontSize: 13,
    color: '#2196F3',
    fontWeight: '600',
  },
  unreadBadge: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#2196F3',
    marginRight: 4,
  },
  contactArrow: {
    marginLeft: 8,
  },
  arrowText: {
    fontSize: 24,
    color: '#CCC',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  scanButton: {
    margin: 16,
    backgroundColor: '#2196F3',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  scanButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFF',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  modalClose: {
    fontSize: 24,
    color: '#333',
  },
  qrModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  qrModalContent: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    maxWidth: '90%',
  },
  qrModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  qrModalSubtitle: {
    fontSize: 16,
    color: '#2196F3',
    marginBottom: 20,
  },
  qrModalHint: {
    fontSize: 14,
    color: '#666',
    marginTop: 16,
    textAlign: 'center',
  },
  qrModalButton: {
    marginTop: 20,
    backgroundColor: '#2196F3',
    borderRadius: 12,
    paddingHorizontal: 32,
    paddingVertical: 12,
  },
  qrModalButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ContactsScreen;