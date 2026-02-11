import React, { useState, useEffect, useRef } from 'react';
import { AppState, AppStateStatus, StyleSheet, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import AppNavigator from './src/navigation/AppNavigator';
import { AuthProvider } from './src/hooks/useAuth';
import LockScreen from './src/screens/LockScreen';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PIN_STORAGE_KEY = '@Nalid24:PIN';
const LOCK_GRACE_PERIOD_MS = 30_000; // 30 seconds — app won't re-lock if backgrounded shorter than this

const App: React.FC = () => {
  const [isLocked, setIsLocked] = useState(true);
  const [hasPin, setHasPin] = useState<boolean | null>(null);
  const backgroundedAt = useRef<number | null>(null);

  useEffect(() => {
    // Check if a PIN has been set
    AsyncStorage.getItem(PIN_STORAGE_KEY).then((pin) => {
      setHasPin(!!pin);
      // If no PIN yet, the LockScreen will handle setup
    });
  }, []);

  // Only re-lock after the app has been in the background for longer
  // than the grace period. This prevents locking during camera permission
  // dialogs, share sheets, and brief app switches.
  useEffect(() => {
    const handleAppState = (nextState: AppStateStatus) => {
      if (nextState === 'background') {
        // Record when we went to background
        backgroundedAt.current = Date.now();
      } else if (nextState === 'active' && backgroundedAt.current) {
        // Returning to foreground — check how long we were away
        const elapsed = Date.now() - backgroundedAt.current;
        backgroundedAt.current = null;
        if (elapsed >= LOCK_GRACE_PERIOD_MS) {
          setIsLocked(true);
        }
      }
    };
    const sub = AppState.addEventListener('change', handleAppState);
    return () => sub.remove();
  }, []);

  // Show nothing while checking if PIN exists
  if (hasPin === null) return null;

  return (
    <View style={styles.root}>
      <AuthProvider>
        <NavigationContainer>
          <AppNavigator />
        </NavigationContainer>
      </AuthProvider>
      {isLocked && (
        <View style={styles.lockOverlay}>
          <LockScreen onUnlock={() => setIsLocked(false)} />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },
  lockOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 999,
  },
});

export default App;
