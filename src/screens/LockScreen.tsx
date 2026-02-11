import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  Vibration,
  Animated,
  Platform,
} from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PIN_STORAGE_KEY = '@Nalid24:PIN';
const BIOMETRIC_ENABLED_KEY = '@Nalid24:BiometricEnabled';

interface LockScreenProps {
  onUnlock: () => void;
}

const LockScreen: React.FC<LockScreenProps> = ({ onUnlock }) => {
  const [pin, setPin] = useState('');
  const [isSettingPin, setIsSettingPin] = useState(false);
  const [confirmPin, setConfirmPin] = useState('');
  const [step, setStep] = useState<'enter' | 'confirm'>('enter');
  const [hasBiometric, setHasBiometric] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [hasStoredPin, setHasStoredPin] = useState(false);
  const [error, setError] = useState('');
  const shakeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    checkSetup();
  }, []);

  const checkSetup = async () => {
    // Check if PIN exists
    const storedPin = await AsyncStorage.getItem(PIN_STORAGE_KEY);
    const bioEnabled = await AsyncStorage.getItem(BIOMETRIC_ENABLED_KEY);

    if (!storedPin) {
      // First time — set up PIN
      setIsSettingPin(true);
      return;
    }

    setHasStoredPin(true);

    // Check biometric availability
    const compatible = await LocalAuthentication.hasHardwareAsync();
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    const biometricAvailable = compatible && enrolled;
    setHasBiometric(biometricAvailable);

    if (bioEnabled === 'true' && biometricAvailable) {
      setBiometricEnabled(true);
      // Auto-prompt biometric
      attemptBiometric();
    }
  };

  const attemptBiometric = async () => {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Unlock Nalid24',
        cancelLabel: 'Use PIN',
        disableDeviceFallback: true,
        fallbackLabel: 'Use PIN',
      });

      if (result.success) {
        onUnlock();
      }
    } catch (error) {
      console.log('Biometric error:', error);
    }
  };

  const shake = () => {
    Vibration.vibrate(200);
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  };

  const handleDigit = async (digit: string) => {
    if (isSettingPin) {
      await handleSetupDigit(digit);
    } else {
      await handleUnlockDigit(digit);
    }
  };

  const handleSetupDigit = async (digit: string) => {
    if (step === 'enter') {
      const newPin = pin + digit;
      setPin(newPin);
      setError('');
      if (newPin.length === 4) {
        setConfirmPin(newPin);
        setPin('');
        setStep('confirm');
      }
    } else {
      const newPin = pin + digit;
      setPin(newPin);
      setError('');
      if (newPin.length === 4) {
        if (newPin === confirmPin) {
          // PIN matches — save it
          await AsyncStorage.setItem(PIN_STORAGE_KEY, newPin);

          // Check if biometric is available and offer to enable
          const compatible = await LocalAuthentication.hasHardwareAsync();
          const enrolled = await LocalAuthentication.isEnrolledAsync();

          if (compatible && enrolled) {
            Alert.alert(
              'Enable Fingerprint',
              'Would you like to use fingerprint to unlock Nalid24?',
              [
                {
                  text: 'No, use PIN only',
                  style: 'cancel',
                  onPress: () => onUnlock(),
                },
                {
                  text: 'Enable',
                  onPress: async () => {
                    await AsyncStorage.setItem(BIOMETRIC_ENABLED_KEY, 'true');
                    onUnlock();
                  },
                },
              ]
            );
          } else {
            // No biometric on device — just PIN
            Alert.alert('PIN Set', 'Your 4-digit PIN has been saved.', [
              { text: 'OK', onPress: () => onUnlock() },
            ]);
          }
        } else {
          // PINs don't match
          shake();
          setError('PINs do not match. Try again.');
          setPin('');
          setConfirmPin('');
          setStep('enter');
        }
      }
    }
  };

  const handleUnlockDigit = async (digit: string) => {
    const newPin = pin + digit;
    setPin(newPin);
    setError('');

    if (newPin.length === 4) {
      const storedPin = await AsyncStorage.getItem(PIN_STORAGE_KEY);
      if (newPin === storedPin) {
        onUnlock();
      } else {
        shake();
        setError('Incorrect PIN');
        setPin('');
      }
    }
  };

  const handleDelete = () => {
    setPin((prev) => prev.slice(0, -1));
    setError('');
  };

  const getTitle = () => {
    if (isSettingPin) {
      return step === 'enter' ? 'Set your PIN' : 'Confirm your PIN';
    }
    return 'Enter PIN';
  };

  const getSubtitle = () => {
    if (isSettingPin) {
      return step === 'enter'
        ? 'Choose a 4-digit PIN to secure your messages'
        : 'Enter the same PIN again';
    }
    return 'Unlock to access your messages';
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.logo}>24</Text>
          <Text style={styles.title}>{getTitle()}</Text>
          <Text style={styles.subtitle}>{getSubtitle()}</Text>
        </View>

        <Animated.View style={[styles.dotsContainer, { transform: [{ translateX: shakeAnim }] }]}>
          {[0, 1, 2, 3].map((i) => (
            <View
              key={i}
              style={[styles.dot, pin.length > i && styles.dotFilled]}
            />
          ))}
        </Animated.View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <View style={styles.keypad}>
          {[
            ['1', '2', '3'],
            ['4', '5', '6'],
            ['7', '8', '9'],
            ['bio', '0', 'del'],
          ].map((row, rowIndex) => (
            <View key={rowIndex} style={styles.keypadRow}>
              {row.map((key) => {
                if (key === 'bio') {
                  if (!isSettingPin && biometricEnabled && hasBiometric) {
                    return (
                      <TouchableOpacity
                        key={key}
                        style={styles.keypadButton}
                        onPress={attemptBiometric}
                      >
                        <Text style={styles.keypadIcon}>👆</Text>
                      </TouchableOpacity>
                    );
                  }
                  return <View key={key} style={styles.keypadButton} />;
                }
                if (key === 'del') {
                  return (
                    <TouchableOpacity
                      key={key}
                      style={styles.keypadButton}
                      onPress={handleDelete}
                    >
                      <Text style={styles.keypadIcon}>⌫</Text>
                    </TouchableOpacity>
                  );
                }
                return (
                  <TouchableOpacity
                    key={key}
                    style={styles.keypadButton}
                    onPress={() => handleDigit(key)}
                  >
                    <Text style={styles.keypadText}>{key}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 40,
  },
  header: {
    alignItems: 'center',
    marginTop: 20,
  },
  logo: {
    fontSize: 56,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    color: '#333',
    marginTop: 12,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 6,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  dotsContainer: {
    flexDirection: 'row',
    gap: 20,
  },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#2196F3',
    backgroundColor: 'transparent',
  },
  dotFilled: {
    backgroundColor: '#2196F3',
  },
  errorText: {
    color: '#E53935',
    fontSize: 14,
    fontWeight: '500',
    marginTop: -10,
  },
  keypad: {
    paddingHorizontal: 40,
    paddingBottom: 20,
  },
  keypadRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 12,
  },
  keypadButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  keypadText: {
    fontSize: 28,
    fontWeight: '500',
    color: '#333',
  },
  keypadIcon: {
    fontSize: 24,
  },
});

export default LockScreen;
