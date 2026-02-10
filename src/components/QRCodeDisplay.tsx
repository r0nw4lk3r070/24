import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Image, ActivityIndicator, Text } from 'react-native';
import QRCodeGenerator from 'qrcode-generator';

interface QRCodeDisplayProps {
  uniqueId: string;
  fcmToken?: string | null;
  size?: number;
  color?: string;
}

const QRCodeDisplay: React.FC<QRCodeDisplayProps> = ({ uniqueId, fcmToken, size = 200, color = 'black' }) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    generateQR();
  }, [uniqueId, fcmToken]);

  const generateQR = () => {
    try {
      setLoading(true);
      setError('');
      
      // Create QR code data with both userId and FCM token
      const qrData = JSON.stringify({
        userId: uniqueId,
        fcmToken: fcmToken || null,
      });
      
      console.log('Generating QR code with data:', { userId: uniqueId, hasFcmToken: !!fcmToken });
      
      // Create QR code
      const qr = QRCodeGenerator(0, 'M');
      qr.addData(qrData);
      qr.make();
      
      // Generate data URI
      const dataUrl = qr.createDataURL(4, 0); // cellSize=4, margin=0
      
      console.log('QR code generated, URL length:', dataUrl.length);
      setQrDataUrl(dataUrl);
      setLoading(false);
    } catch (err) {
      console.error('Error generating QR code:', err);
      setError('Failed to generate QR code');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { width: size, height: size }]}>
        <ActivityIndicator size="large" color="#2196F3" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, { width: size, height: size, backgroundColor: '#FFF', borderRadius: 8 }]}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  if (!qrDataUrl) {
    return (
      <View style={[styles.container, { width: size, height: size, backgroundColor: '#FFF', borderRadius: 8 }]}>
        <Text style={styles.errorText}>No QR data</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Image
        source={{ uri: qrDataUrl }}
        style={{ width: size, height: size, backgroundColor: '#FFF' }}
        resizeMode="contain"
        onError={(e) => console.error('Image load error:', e.nativeEvent.error)}
        onLoad={() => console.log('QR image loaded successfully')}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    margin: 20,
  },
  errorText: {
    color: '#FF0000',
    fontSize: 14,
    textAlign: 'center',
  },
});

export default QRCodeDisplay;