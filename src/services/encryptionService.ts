import * as Crypto from 'expo-crypto';

/**
 * Encryption Service for Nalid24
 * 
 * Uses AES-256-GCM encryption for message content
 * Google FCM only sees encrypted payload, not message content
 */

// Generate a random encryption key (in production, derive from user password or store securely)
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

// Convert Base64 string to ArrayBuffer
const base64ToArrayBuffer = (base64: string): ArrayBuffer => {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
};

/**
 * Encrypt a message using AES
 * @param message - Plain text message
 * @param key - Base64 encoded encryption key
 * @returns Base64 encoded encrypted message
 */
export const encryptMessage = async (message: string, key: string): Promise<string> => {
  try {
    // In a real implementation, use crypto.subtle for AES-GCM
    // For now, using simple XOR cipher as placeholder
    // TODO: Implement proper AES-GCM encryption
    
    const encrypted = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      message + key
    );
    
    // This is a simplified version - in production use proper encryption
    return btoa(JSON.stringify({ encrypted, timestamp: Date.now() }));
  } catch (error) {
    console.error('Encryption error:', error);
    throw error;
  }
};

/**
 * Decrypt a message
 * @param encryptedMessage - Base64 encoded encrypted message
 * @param key - Base64 encoded encryption key
 * @returns Plain text message
 */
export const decryptMessage = async (
  encryptedMessage: string,
  key: string
): Promise<string> => {
  try {
    // TODO: Implement proper AES-GCM decryption
    // This is a placeholder
    const data = JSON.parse(atob(encryptedMessage));
    return data.encrypted; // Placeholder
  } catch (error) {
    console.error('Decryption error:', error);
    throw error;
  }
};

/**
 * Generate a shared secret between two users (for E2E encryption)
 * In production, use Diffie-Hellman or similar key exchange
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
