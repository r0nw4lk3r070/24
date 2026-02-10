import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';
import { generateQRCodeData } from '../utils/qrCodeGenerator';

/**
 * APK Sharing Service for Nalid24
 * 
 * Allows the app to share its own APK file with other users
 * This enables viral distribution without app stores
 */

const APK_FILENAME = 'Nalid24.apk';
const APK_STORAGE_KEY = '@Nalid24:APKPath';

/**
 * Get the APK file path
 * The APK is embedded in the app during build
 */
export const getAPKPath = async (): Promise<string | null> => {
  try {
    if (Platform.OS !== 'android') {
      console.warn('APK sharing only available on Android');
      return null;
    }

    // Path to embedded APK in assets
    // This will be configured during build process
    const apkPath = `${FileSystem.documentDirectory}${APK_FILENAME}`;
    
    // Check if APK exists
    const fileInfo = await FileSystem.getInfoAsync(apkPath);
    if (fileInfo.exists) {
      return apkPath;
    }

    console.warn('APK file not found');
    return null;
  } catch (error) {
    console.error('Error getting APK path:', error);
    return null;
  }
};

/**
 * Share APK file via Android share dialog
 */
export const shareAPK = async (): Promise<boolean> => {
  try {
    const apkPath = await getAPKPath();
    if (!apkPath) {
      console.error('APK file not found');
      return false;
    }

    const isAvailable = await Sharing.isAvailableAsync();
    if (!isAvailable) {
      console.error('Sharing not available on this device');
      return false;
    }

    await Sharing.shareAsync(apkPath, {
      mimeType: 'application/vnd.android.package-archive',
      dialogTitle: 'Share Nalid24 Messenger',
      UTI: 'com.android.package-archive',
    });

    return true;
  } catch (error) {
    console.error('Error sharing APK:', error);
    return false;
  }
};

/**
 * Generate QR code data for APK download
 * In production, this would contain a download link
 */
export const generateAPKQRCode = async (): Promise<{
  value: string;
  size: number;
}> => {
  try {
    // In production, this would be a download URL
    // For now, we'll include app info
    const qrData = {
      type: 'nalid24-app-download',
      version: '1.0.0',
      platform: 'android',
      // In production: downloadUrl: 'https://your-server.com/Nalid24.apk'
      message: 'Request APK via Bluetooth or WiFi Direct',
    };

    return {
      value: JSON.stringify(qrData),
      size: 250,
    };
  } catch (error) {
    console.error('Error generating APK QR code:', error);
    throw error;
  }
};

/**
 * Copy APK to shared location for easy access
 */
export const prepareAPKForSharing = async (): Promise<string | null> => {
  try {
    if (Platform.OS !== 'android') {
      return null;
    }

    // Source: embedded APK
    // This path needs to be configured during build
    const sourceAPK = `${FileSystem.bundleDirectory}app.apk`;
    const destAPK = `${FileSystem.documentDirectory}${APK_FILENAME}`;

    // Check if source exists
    const sourceInfo = await FileSystem.getInfoAsync(sourceAPK);
    if (!sourceInfo.exists) {
      console.warn('Source APK not found in bundle');
      return null;
    }

    // Copy to documents for sharing
    await FileSystem.copyAsync({
      from: sourceAPK,
      to: destAPK,
    });

    console.log('APK prepared for sharing:', destAPK);
    return destAPK;
  } catch (error) {
    console.error('Error preparing APK:', error);
    return null;
  }
};

/**
 * Get APK file size for display
 */
export const getAPKSize = async (): Promise<number | null> => {
  try {
    const apkPath = await getAPKPath();
    if (!apkPath) return null;

    const fileInfo = await FileSystem.getInfoAsync(apkPath);
    if (fileInfo.exists && 'size' in fileInfo) {
      return fileInfo.size;
    }

    return null;
  } catch (error) {
    console.error('Error getting APK size:', error);
    return null;
  }
};

/**
 * Format file size for display
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

export default {
  getAPKPath,
  shareAPK,
  generateAPKQRCode,
  prepareAPKForSharing,
  getAPKSize,
  formatFileSize,
};
