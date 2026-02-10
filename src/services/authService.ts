import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import { User } from '../types';

const USER_STORAGE_KEY = '@Nalid24:User';

export interface AuthService {
  createUser: (username: string) => Promise<User>;
  getUser: () => Promise<User | null>;
  clearUserData: () => Promise<void>;
  onAuthStateChanged: (callback: (user: User | null) => void) => () => void;
}

// Create user with unique ID
export const createUser = async (username: string): Promise<User> => {
  const userId = Crypto.randomUUID();
  const user: User = {
    id: userId,
    username,
    uniqueId: userId,
    createdAt: new Date(),
  };
  await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
  return user;
};

// Get current user from storage
export const getUser = async (): Promise<User | null> => {
  try {
    const userData = await AsyncStorage.getItem(USER_STORAGE_KEY);
    if (!userData) return null;
    
    const user = JSON.parse(userData);
    // Convert createdAt string back to Date
    user.createdAt = new Date(user.createdAt);
    return user;
  } catch (error) {
    console.error('Error getting user:', error);
    return null;
  }
};

// Clear user data (logout)
export const clearUserData = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(USER_STORAGE_KEY);
  } catch (error) {
    console.error('Error clearing user data:', error);
    throw error;
  }
};

// Simple auth state listener (polling-based for AsyncStorage)
let authListeners: Array<(user: User | null) => void> = [];

export const onAuthStateChanged = (
  callback: (user: User | null) => void
): (() => void) => {
  authListeners.push(callback);
  
  // Immediately call with current user
  getUser().then(callback);
  
  // Return unsubscribe function
  return () => {
    authListeners = authListeners.filter((listener) => listener !== callback);
  };
};

// Helper to notify all listeners (call after login/logout)
export const notifyAuthListeners = async (): Promise<void> => {
  const user = await getUser();
  authListeners.forEach((listener) => listener(user));
};

// Auth service object
export const authService: AuthService = {
  createUser,
  getUser,
  clearUserData,
  onAuthStateChanged,
};

export default authService;
