// QR Code generation utility
// This generates QR code data, not the component itself

export interface QRCodeData {
  value: string;
  size?: number;
  backgroundColor?: string;
  color?: string;
}

/**
 * Prepare QR code data for a user's unique ID
 * @param uniqueId - The user's unique identifier
 * @returns QR code configuration object
 */
export const generateQRCodeData = (uniqueId: string): QRCodeData => {
  return {
    value: uniqueId,
    size: 200,
    backgroundColor: 'white',
    color: 'black',
  };
};

/**
 * Generate QR code data for user invitation
 * @param userId - User ID to encode
 * @param username - Username to include
 * @returns QR code data string
 */
export const generateInviteQRData = (userId: string, username: string): string => {
  const inviteData = {
    type: 'nalid24-invite',
    userId,
    username,
    timestamp: Date.now(),
  };
  return JSON.stringify(inviteData);
};

/**
 * Parse invite QR code data
 * @param qrData - Scanned QR code string
 * @returns Parsed invite data or null if invalid
 */
export const parseInviteQRData = (qrData: string): {
  userId: string;
  username: string;
  timestamp: number;
} | null => {
  try {
    const data = JSON.parse(qrData);
    if (data.type === 'nalid24-invite' && data.userId && data.username) {
      return {
        userId: data.userId,
        username: data.username,
        timestamp: data.timestamp,
      };
    }
    return null;
  } catch (error) {
    console.error('Error parsing QR code data:', error);
    return null;
  }
};

export default { generateQRCodeData, generateInviteQRData, parseInviteQRData };
