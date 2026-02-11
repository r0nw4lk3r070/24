import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, Vibration } from 'react-native';
import { BarCodeScanner } from 'expo-barcode-scanner';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SCAN_AREA_SIZE = SCREEN_WIDTH * 0.65;

interface QRCodeScannerProps {
  onScan: (data: string) => void;
}

const QRCodeScanner: React.FC<QRCodeScannerProps> = ({ onScan }) => {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);

  useEffect(() => {
    (async () => {
      const { status } = await BarCodeScanner.requestPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const handleBarCodeScanned = ({ type, data }: { type: string; data: string }) => {
    if (!scanned) {
      setScanned(true);
      Vibration.vibrate(100);
      console.log('QR Code scanned! Type:', type, 'Data:', data.slice(0, 80));
      onScan(data);
    }
  };

  if (hasPermission === null) {
    return (
      <View style={styles.centered}>
        <Text style={styles.statusText}>Requesting camera permission...</Text>
      </View>
    );
  }
  if (hasPermission === false) {
    return (
      <View style={styles.centered}>
        <Text style={styles.statusText}>No access to camera</Text>
        <Text style={styles.hintText}>Please enable camera permission in Settings</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <BarCodeScanner
        style={StyleSheet.absoluteFillObject}
        onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
        barCodeTypes={[BarCodeScanner.Constants.BarCodeType.qr]}
      />

      {/* Scan window overlay */}
      <View style={styles.scanOverlay}>
        <View style={styles.scanWindow}>
          <View style={[styles.corner, styles.cornerTL]} />
          <View style={[styles.corner, styles.cornerTR]} />
          <View style={[styles.corner, styles.cornerBL]} />
          <View style={[styles.corner, styles.cornerBR]} />
        </View>
      </View>

      {/* Instructions at bottom */}
      <View style={styles.instructionsContainer}>
        {scanned ? (
          <View style={styles.successContainer}>
            <Text style={styles.successText}>✓ QR Code Detected!</Text>
            <TouchableOpacity
              style={styles.rescanButton}
              onPress={() => setScanned(false)}
            >
              <Text style={styles.rescanButtonText}>Scan Another</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <Text style={styles.instructionText}>
            Point camera at a QR code
          </Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
    padding: 20,
  },
  statusText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  hintText: {
    color: '#888',
    fontSize: 14,
    marginTop: 8,
  },
  scanOverlay: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    width: SCREEN_WIDTH,
    height: '100%',
  },
  scanWindow: {
    width: SCAN_AREA_SIZE,
    height: SCAN_AREA_SIZE,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.5)',
    backgroundColor: 'transparent',
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: '#00d4ff',
  },
  cornerTL: {
    top: -2,
    left: -2,
    borderTopWidth: 4,
    borderLeftWidth: 4,
  },
  cornerTR: {
    top: -2,
    right: -2,
    borderTopWidth: 4,
    borderRightWidth: 4,
  },
  cornerBL: {
    bottom: -2,
    left: -2,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
  },
  cornerBR: {
    bottom: -2,
    right: -2,
    borderBottomWidth: 4,
    borderRightWidth: 4,
  },
  instructionsContainer: {
    position: 'absolute',
    bottom: 60,
    width: '100%',
    alignItems: 'center',
  },
  instructionText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  rescanButton: {
    marginTop: 16,
    backgroundColor: '#00d4ff',
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 10,
  },
  rescanButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '700',
  },
  successContainer: {
    alignItems: 'center',
  },
  successText: {
    color: '#00ff88',
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
});

export default QRCodeScanner;