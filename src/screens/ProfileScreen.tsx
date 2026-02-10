import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  SafeAreaView,
  ScrollView,
  Alert,
  Modal
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import QRCodeDisplay from '../components/QRCodeDisplay';
import { getUser, clearUserData } from '../services/authService';
import { clearAllContacts } from '../services/contactService';
import { clearAllMessagesGlobally } from '../services/messageService';
import { getFCMToken } from '../services/notificationService';
import { cleanupPresence } from '../services/presenceService';
import { User } from '../types';

type ProfileScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Profile'>;

const ProfileScreen = () => {
  const navigation = useNavigation<ProfileScreenNavigationProp>();
  const [user, setUser] = useState<User | null>(null);
  const [fcmToken, setFcmToken] = useState<string | null>(null);
  const [showQR, setShowQR] = useState(false);

  useEffect(() => {
    loadUser();
    loadFCMToken();
  }, []);

  const loadUser = async () => {
    const currentUser = await getUser();
    setUser(currentUser);
  };

  const loadFCMToken = async () => {
    const token = await getFCMToken();
    setFcmToken(token);
    console.log('FCM Token loaded for QR code:', token?.slice(0, 20) + '...');
  };

  const handleShowQR = () => {
    setShowQR(true);
  };

  const handleClearData = () => {
    Alert.alert(
      'Clear All Data',
      'This will delete all contacts and messages. Your account will remain. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              await clearAllContacts();
              await clearAllMessagesGlobally();
              Alert.alert('Success', 'All data cleared');
            } catch (error) {
              Alert.alert('Error', 'Failed to clear data');
            }
          }
        }
      ]
    );
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'This will delete your account and all data. You cannot undo this action.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              // Cleanup presence tracking
              await cleanupPresence();
              // Clear all data
              await clearAllContacts();
              await clearAllMessagesGlobally();
              await clearUserData();
              navigation.reset({
                index: 0,
                routes: [{ name: 'Auth' }],
              });
            } catch (error) {
              Alert.alert('Error', 'Failed to logout');
            }
          }
        }
      ]
    );
  };

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <Text>Loading...</Text>
      </SafeAreaView>
    );
  }

  const accountAge = Math.floor((Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24));

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{user.username.charAt(0).toUpperCase()}</Text>
          </View>
          <Text style={styles.username}>{user.username}</Text>
          <Text style={styles.userId}>ID: {user.uniqueId.slice(0, 12)}...</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          
          <TouchableOpacity style={styles.menuItem} onPress={handleShowQR}>
            <Text style={styles.menuItemText}>Show My QR Code</Text>
            <Text style={styles.menuItemArrow}>›</Text>
          </TouchableOpacity>

          <View style={styles.menuItem}>
            <Text style={styles.menuItemText}>Account Age</Text>
            <Text style={styles.menuItemValue}>{accountAge} days</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Privacy</Text>
          
          <View style={styles.menuItem}>
            <Text style={styles.menuItemText}>Message Retention</Text>
            <Text style={styles.menuItemValue}>24 hours</Text>
          </View>

          <View style={styles.menuItem}>
            <Text style={styles.menuItemText}>Encryption</Text>
            <Text style={styles.menuItemValue}>End-to-end</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data</Text>
          
          <TouchableOpacity style={styles.menuItem} onPress={handleClearData}>
            <Text style={[styles.menuItemText, styles.warningText]}>Clear All Data</Text>
            <Text style={styles.menuItemArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
            <Text style={[styles.menuItemText, styles.dangerText]}>Logout & Delete Account</Text>
            <Text style={styles.menuItemArrow}>›</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Nalid24 Messenger v1.0.0</Text>
          <Text style={styles.footerText}>Privacy-focused messaging</Text>
        </View>
      </ScrollView>

      {/* QR Code Modal */}
      <Modal
        visible={showQR}
        animationType="fade"
        transparent
        onRequestClose={() => setShowQR(false)}
      >
        <View style={styles.qrModalOverlay}>
          <View style={styles.qrModalContent}>
            <Text style={styles.qrModalTitle}>My QR Code</Text>
            <Text style={styles.qrModalSubtitle}>{user.username}</Text>
            <QRCodeDisplay uniqueId={user.uniqueId} fcmToken={fcmToken} size={240} />
            <Text style={styles.qrModalHint}>
              Share this code for others to add you
            </Text>
            <TouchableOpacity
              style={styles.qrModalButton}
              onPress={() => setShowQR(false)}
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
  scrollContent: {
    padding: 16,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: '#FFF',
    borderRadius: 16,
    marginBottom: 24,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: {
    color: '#FFF',
    fontSize: 36,
    fontWeight: 'bold',
  },
  username: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  userId: {
    fontSize: 12,
    color: '#999',
    fontFamily: 'monospace',
  },
  section: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    padding: 16,
    paddingBottom: 8,
    textTransform: 'uppercase',
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#F5F5F5',
  },
  menuItemText: {
    fontSize: 16,
    color: '#333',
  },
  menuItemValue: {
    fontSize: 14,
    color: '#999',
  },
  menuItemArrow: {
    fontSize: 20,
    color: '#CCC',
  },
  warningText: {
    color: '#FF9800',
  },
  dangerText: {
    color: '#F44336',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  footerText: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
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

export default ProfileScreen;

export default ProfileScreen;