import { firebase } from '@react-native-firebase/database';

/**
 * Central Firebase Realtime Database configuration.
 * The database is hosted in europe-west1 (Belgium).
 *
 * CRITICAL: We must pass the explicit URL because the Google Services
 * Gradle plugin v4.3.3 does NOT generate the firebase_database_url
 * string resource from google-services.json's firebase_url field.
 * Without the explicit URL, the SDK defaults to us-central1 and the
 * server rejects the connection.
 */

const DATABASE_URL = 'https://nalid24-a7401-default-rtdb.europe-west1.firebasedatabase.app';

/**
 * Returns the Firebase Realtime Database instance connected to
 * the europe-west1 region. Use this instead of calling database()
 * directly in services.
 */
export const getDatabase = () => {
  return firebase.app().database(DATABASE_URL);
};

export default getDatabase;
