// Polyfill for crypto.getRandomValues() — required by crypto-js in Hermes engine
import 'react-native-get-random-values';

// Polyfill for TextEncoder/TextDecoder (required by qrcode library)
if (typeof global.TextEncoder === 'undefined') {
  global.TextEncoder = class TextEncoder {
    encode(str) {
      const utf8 = [];
      for (let i = 0; i < str.length; i++) {
        let charcode = str.charCodeAt(i);
        if (charcode < 0x80) utf8.push(charcode);
        else if (charcode < 0x800) {
          utf8.push(0xc0 | (charcode >> 6), 
                    0x80 | (charcode & 0x3f));
        }
        else if (charcode < 0xd800 || charcode >= 0xe000) {
          utf8.push(0xe0 | (charcode >> 12), 
                    0x80 | ((charcode >> 6) & 0x3f), 
                    0x80 | (charcode & 0x3f));
        }
        else {
          i++;
          charcode = 0x10000 + (((charcode & 0x3ff) << 10)
                    | (str.charCodeAt(i) & 0x3ff));
          utf8.push(0xf0 | (charcode >> 18), 
                    0x80 | ((charcode >> 12) & 0x3f), 
                    0x80 | ((charcode >> 6) & 0x3f), 
                    0x80 | (charcode & 0x3f));
        }
      }
      return new Uint8Array(utf8);
    }
  };
}

import messaging from '@react-native-firebase/messaging';

// Register background/quit-state FCM handler (MUST be in entry file, before registerRootComponent)
messaging().setBackgroundMessageHandler(async (remoteMessage) => {
  console.log('Background FCM message received:', remoteMessage);
  // Android auto-displays the notification from the 'notification' payload
  // Decryption happens when user opens the app
});

import { registerRootComponent } from 'expo';
import App from './App';

registerRootComponent(App);
