import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  SafeAreaView, 
  ScrollView,
  Share,
  Linking
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import QRCodeDisplay from '../components/QRCodeDisplay';

const DOWNLOAD_URL = 'https://nalid24-a7401.web.app';
const GITHUB_URL = 'https://github.com/yourusername/nalid24';

const InviteScreen = () => {
  const navigation = useNavigation();
  const [showQR, setShowQR] = useState(false);

  const handleShareLink = async () => {
    try {
      await Share.share({
        message: `Join me on Nalid24 - Privacy-focused messaging with 24h auto-delete!\n\nDownload: ${DOWNLOAD_URL}\n\nNo phone number, no email, complete privacy. 🔒`,
        title: 'Try Nalid24 Messenger'
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleOpenWebsite = () => {
    Linking.openURL(DOWNLOAD_URL);
  };

  const handleShowQR = () => {
    setShowQR(true);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Share Nalid24</Text>
          <Text style={styles.subtitle}>Help others join the privacy revolution</Text>
        </View>

        {showQR ? (
          <View style={styles.qrSection}>
            <Text style={styles.qrTitle}>Scan to Download</Text>
            <View style={styles.qrWrapper}>
              <QRCodeDisplay uniqueId={DOWNLOAD_URL} size={240} />
            </View>
            <Text style={styles.qrHint}>
              Scan this QR code to download Nalid24
            </Text>
            <TouchableOpacity 
              style={styles.qrToggleButton} 
              onPress={() => setShowQR(false)}
            >
              <Text style={styles.qrToggleButtonText}>Hide QR Code</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.section}>
            <TouchableOpacity style={styles.primaryButton} onPress={handleShowQR}>
              <Text style={styles.buttonIcon}>📱</Text>
              <View style={styles.buttonContent}>
                <Text style={styles.buttonTitle}>Show QR Code</Text>
                <Text style={styles.buttonDescription}>Let someone scan to download</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.primaryButton} onPress={handleShareLink}>
              <Text style={styles.buttonIcon}>🔗</Text>
              <View style={styles.buttonContent}>
                <Text style={styles.buttonTitle}>Share Download Link</Text>
                <Text style={styles.buttonDescription}>Send via any messaging app</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.secondaryButton} onPress={handleOpenWebsite}>
              <Text style={styles.buttonIcon}>🌐</Text>
              <View style={styles.buttonContent}>
                <Text style={styles.buttonTitle}>Open Website</Text>
                <Text style={styles.buttonDescription}>nalid24-a7401.web.app</Text>
              </View>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>Why Nalid24?</Text>
          <View style={styles.infoItem}>
            <Text style={styles.infoIcon}>🔒</Text>
            <Text style={styles.infoText}>End-to-end encrypted messages</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoIcon}>⏱️</Text>
            <Text style={styles.infoText}>Auto-delete after 24 hours</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoIcon}>👤</Text>
            <Text style={styles.infoText}>No phone number required</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoIcon}>🚫</Text>
            <Text style={styles.infoText}>No data collection or tracking</Text>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Nalid24 is open source and free forever
          </Text>
          <TouchableOpacity onPress={() => Linking.openURL(GITHUB_URL)}>
            <Text style={styles.githubLink}>View on GitHub →</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
    paddingHorizontal: 24,
    backgroundColor: '#FFF',
    borderRadius: 16,
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  section: {
    marginBottom: 24,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 20,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 20,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#E0E0E0',
  },
  buttonIcon: {
    fontSize: 32,
    marginRight: 16,
  },
  buttonContent: {
    flex: 1,
  },
  buttonTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  buttonDescription: {
    fontSize: 13,
    color: '#666',
  },
  qrSection: {
    backgroundColor: '#FFF',
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 24,
  },
  qrTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 24,
  },
  qrWrapper: {
    padding: 16,
    backgroundColor: '#FFF',
    borderRadius: 12,
    marginBottom: 16,
  },
  qrHint: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  qrToggleButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
  },
  qrToggleButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  infoSection: {
    backgroundColor: '#FFF',
    padding: 24,
    borderRadius: 16,
    marginBottom: 24,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  footerText: {
    fontSize: 13,
    color: '#999',
    marginBottom: 8,
  },
  githubLink: {
    fontSize: 14,
    color: '#2196F3',
    fontWeight: '600',
  },
});

export default InviteScreen;