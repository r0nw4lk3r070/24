import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Linking
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import QRCodeDisplay from '../components/QRCodeDisplay';
import { createUser, getUser } from '../services/authService';
import { initializePresence } from '../services/presenceService';
import { initializeGlobalContactListener, storeUserFCMToken } from '../services/contactSyncService';
import { getFCMToken, onTokenRefresh, requestNotificationPermissions } from '../services/notificationService';
import { User } from '../types';

type AuthScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Auth'>;

const AuthScreen = () => {
  const navigation = useNavigation<AuthScreenNavigationProp>();
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [creating, setCreating] = useState(false);
  const [fcmToken, setFcmToken] = useState<string | null>(null);

  useEffect(() => {
    checkExistingUser();
    loadFCMToken();
  }, []);

  const checkExistingUser = async () => {
    try {
      const user = await getUser();
      if (user) {
        setCurrentUser(user);
      }
    } catch (error) {
      console.error('Error checking user:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadFCMToken = async () => {
    const token = await getFCMToken();
    setFcmToken(token);
  };

  const handleCreateUser = async () => {
    if (!username.trim()) return;
    
    setCreating(true);
    try {
      const user = await createUser(username.trim());
      setCurrentUser(user);

      // Request notification permission and show setup info
      const granted = await requestNotificationPermissions();
      if (!granted) {
        Alert.alert(
          'Enable Notifications',
          'To receive messages when the app is closed, please enable notifications for Nalid24 in your device Settings.\n\n' +
          'Go to: Settings → Apps → Nalid24 → Notifications → Enable',
          [
            { text: 'Open Settings', onPress: () => Linking.openSettings() },
            { text: 'Later', style: 'cancel' },
          ]
        );
      }
    } catch (error) {
      console.error('Error creating user:', error);
    } finally {
      setCreating(false);
    }
  };

  const handleContinue = () => {
    if (currentUser) {
      // Initialize presence tracking
      initializePresence(currentUser.uniqueId);
      // Start listening for incoming contact requests globally
      initializeGlobalContactListener(currentUser.uniqueId);
      // Store FCM token in Firebase so others can send us push notifications
      storeUserFCMToken(currentUser.uniqueId);
      // Listen for FCM token refresh and update Firebase when it changes
      onTokenRefresh((newToken) => {
        console.log('FCM token refreshed, updating Firebase...');
        storeUserFCMToken(currentUser.uniqueId);
      });
    }
    navigation.navigate('Contacts');
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
      </View>
    );
  }

  if (currentUser) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.logo}>24</Text>
            <Text style={styles.subtitle}>Nalid24 Messenger</Text>
          </View>

          <View style={styles.userSection}>
            <Text style={styles.welcomeText}>Welcome back!</Text>
            <Text style={styles.usernameText}>{currentUser.username}</Text>
            
            <View style={styles.qrSection}>
              <Text style={styles.qrLabel}>Your QR Code</Text>
              <Text style={styles.qrHint}>Share this with others to connect</Text>
              <QRCodeDisplay uniqueId={currentUser.uniqueId} username={currentUser.username} fcmToken={fcmToken} size={240} />
              <Text style={styles.userIdText}>ID: {currentUser.uniqueId.slice(0, 8)}...</Text>
            </View>
          </View>

          <TouchableOpacity 
            style={styles.continueButton}
            onPress={handleContinue}
          >
            <Text style={styles.continueButtonText}>Continue to Messages</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.logo}>24</Text>
            <Text style={styles.subtitle}>Nalid24 Messenger</Text>
            <Text style={styles.tagline}>Messages disappear in 24 hours</Text>
          </View>

          <View style={styles.formSection}>
            <Text style={styles.label}>Choose your username</Text>
            <TextInput
              style={styles.input}
              placeholder="Username"
              placeholderTextColor="#999"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              autoCorrect={false}
              maxLength={20}
              editable={!creating}
            />
            
            <TouchableOpacity 
              style={[styles.createButton, (!username.trim() || creating) && styles.createButtonDisabled]}
              onPress={handleCreateUser}
              disabled={!username.trim() || creating}
            >
              {creating ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.createButtonText}>Create Account</Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Privacy-focused • End-to-end encrypted</Text>
          </View>
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
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'space-between',
  },
  header: {
    alignItems: 'center',
    marginTop: 60,
  },
  logo: {
    fontSize: 72,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  subtitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginTop: 8,
  },
  tagline: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },
  formSection: {
    flex: 1,
    justifyContent: 'center',
    maxWidth: 400,
    width: '100%',
    alignSelf: 'center',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  input: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#DDD',
    marginBottom: 16,
  },
  createButton: {
    backgroundColor: '#2196F3',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  createButtonDisabled: {
    backgroundColor: '#BBB',
  },
  createButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  userSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  usernameText: {
    fontSize: 20,
    color: '#2196F3',
    marginBottom: 32,
  },
  qrSection: {
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  qrLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  qrHint: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  userIdText: {
    fontSize: 12,
    color: '#999',
    marginTop: 12,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  continueButton: {
    backgroundColor: '#2196F3',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  continueButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  footerText: {
    fontSize: 12,
    color: '#999',
  },
});

export default AuthScreen;