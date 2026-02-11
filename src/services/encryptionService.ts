import * as Crypto from 'expo-crypto';
import CryptoJS from 'crypto-js';

/**
 * Encryption Service for Nalid24
 * 
 * Uses AES-256 encryption for message content
 * Messages are encrypted before being stored in Firebase
 * Only users with the shared secret can decrypt messages
 */

// Generate a random encryption key
export const generateEncryptionKey = async (): Promise<string> => {
  const randomBytes = await Crypto.getRandomBytesAsync(32); // 256 bits
  return arrayBufferToBase64(randomBytes);
};

// Convert ArrayBuffer to Base64 string
const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  return btoa(binary);
};

/**
 * Encrypt a message using AES-256
 * @param message - Plain text message
 * @param key - Shared secret key (SHA256 hash)
 * @returns Encrypted message as string
 */
export const encryptMessage = async (message: string, key: string): Promise<string> => {
  try {
    // Use AES-256 encryption with the shared secret
    const encrypted = CryptoJS.AES.encrypt(message, key).toString();
    return encrypted;
  } catch (error) {
    console.error('Encryption error:', error);
    throw error;
  }
};

/**
 * Decrypt a message using AES-256
 * @param encryptedMessage - Encrypted message string
 * @param key - Shared secret key (SHA256 hash)
 * @returns Decrypted plain text message
 */
export const decryptMessage = async (
  encryptedMessage: string,
  key: string
): Promise<string> => {
  try {
    // Decrypt using AES-256 with the shared secret
    const decrypted = CryptoJS.AES.decrypt(encryptedMessage, key);
    const plaintext = decrypted.toString(CryptoJS.enc.Utf8);
    
    if (!plaintext) {
      throw new Error('Decryption failed - invalid key or corrupted data');
    }
    
    return plaintext;
  } catch (error) {
    console.error('Decryption error:', error);
    throw error;
  }
};

/**
 * Generate a shared secret between two users (for E2E encryption)
 * Uses deterministic hash so both users get the same key
 */
export const generateSharedSecret = async (
  userId: string,
  contactId: string
): Promise<string> => {
  const combined = [userId, contactId].sort().join('-');
  const hash = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    combined
  );
  return hash;
};

export default {
  generateEncryptionKey,
  encryptMessage,
  decryptMessage,
  generateSharedSecret,
};
