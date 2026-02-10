/**
 * Cloud Functions for Nalid24 Messenger
 * 
 * Features:
 * - Push notifications when app is closed
 * - Delivery receipts
 * - Online/offline status tracking
 */

import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

admin.initializeApp();

/**
 * Send push notification when new message is written to database
 * Triggers when app is closed or in background
 */
export const sendMessageNotification = functions.database
  .ref("/chats/{chatId}/messages/{messageId}")
  .onCreate(async (snapshot, context) => {
    const message = snapshot.val();
    const chatId = context.params.chatId;
    const messageId = context.params.messageId;

    try {
      // Parse chat ID to get user IDs
      const userIds = chatId.split("_").sort();
      if (userIds.length !== 2) {
        console.error("Invalid chat ID format:", chatId);
        return null;
      }

      // Determine recipient (the one who didn't send the message)
      const recipientId = userIds[0] === message.senderId ? 
        userIds[1] : userIds[0];

      console.log("New message:", {
        messageId,
        senderId: message.senderId,
        recipientId,
        hasContent: !!message.content,
      });

      // Get recipient's FCM token from contacts
      // We need to search all contacts to find the one with matching userId
      const contactsSnapshot = await admin.database()
        .ref("/contacts")
        .orderByChild("userId")
        .equalTo(recipientId)
        .limitToFirst(1)
        .once("value");

      let fcmToken: string | null = null;

      contactsSnapshot.forEach((contact) => {
        const contactData = contact.val();
        if (contactData.fcmToken) {
          fcmToken = contactData.fcmToken;
        }
      });

      if (!fcmToken) {
        console.log("No FCM token found for recipient:", recipientId);
        // Update message status to "sent" (delivered but no notification)
        await snapshot.ref.update({
          status: "sent",
          updatedAt: admin.database.ServerValue.TIMESTAMP,
        });
        return null;
      }

      // Get sender's username for notification
      const senderUsername = message.senderUsername || "Someone";

      // Send FCM notification
      const payload: admin.messaging.MessagingPayload = {
        notification: {
          title: senderUsername,
          body: message.isEmoji ? 
            "Sent an emoji" : 
            (message.content || "New message"),
          sound: "default",
          clickAction: "FLUTTER_NOTIFICATION_CLICK",
        },
        data: {
          chatId: chatId,
          messageId: messageId,
          senderId: message.senderId,
          type: "message",
        },
      };

      await admin.messaging().sendToDevice(fcmToken, payload);

      console.log("Notification sent successfully to:", recipientId);

      // Update message status to "delivered"
      await snapshot.ref.update({
        status: "delivered",
        deliveredAt: admin.database.ServerValue.TIMESTAMP,
      });

      return null;
    } catch (error) {
      console.error("Error sending notification:", error);
      return null;
    }
  });

/**
 * Clean up old messages (older than 24 hours)
 * Runs every hour
 */
export const cleanupOldMessages = functions.pubsub
  .schedule("every 1 hours")
  .onRun(async () => {
    const now = Date.now();
    const cutoffTime = now - (24 * 60 * 60 * 1000); // 24 hours ago

    try {
      const chatsSnapshot = await admin.database()
        .ref("/chats")
        .once("value");

      let deletedCount = 0;

      const deletePromises: Promise<void>[] = [];

      chatsSnapshot.forEach((chatSnapshot) => {
        const chatId = chatSnapshot.key;
        const messages = chatSnapshot.child("messages").val();

        if (messages) {
          Object.keys(messages).forEach((messageId) => {
            const message = messages[messageId];
            if (message.timestamp < cutoffTime) {
              const deletePromise = admin.database()
                .ref(`/chats/${chatId}/messages/${messageId}`)
                .remove();
              deletePromises.push(deletePromise);
              deletedCount++;
            }
          });
        }
      });

      await Promise.all(deletePromises);

      console.log(`Cleaned up ${deletedCount} messages older than 24 hours`);
      return null;
    } catch (error) {
      console.error("Error cleaning up messages:", error);
      return null;
    }
  });

/**
 * Update user's online status
 * Triggers when /presence/{userId} is written
 */
export const updateUserPresence = functions.database
  .ref("/presence/{userId}")
  .onUpdate(async (change, context) => {
    const userId = context.params.userId;
    const presence = change.after.val();

    try {
      console.log("User presence updated:", {
        userId,
        status: presence.status,
        lastSeen: presence.lastSeen,
      });

      // Store presence in user profile for quick access
      await admin.database()
        .ref(`/users/${userId}/presence`)
        .set({
          status: presence.status,
          lastSeen: presence.lastSeen || admin.database.ServerValue.TIMESTAMP,
        });

      return null;
    } catch (error) {
      console.error("Error updating user presence:", error);
      return null;
    }
  });

/**
 * Handle message read receipts
 * Triggers when /chats/{chatId}/messages/{messageId}/readBy is updated
 */
export const handleReadReceipt = functions.database
  .ref("/chats/{chatId}/messages/{messageId}/readBy/{userId}")
  .onCreate(async (snapshot, context) => {
    const chatId = context.params.chatId;
    const messageId = context.params.messageId;
    const userId = context.params.userId;
    const readAt = snapshot.val();

    try {
      console.log("Message read:", {
        chatId,
        messageId,
        userId,
        readAt,
      });

      // Update message status to "read" if this is the recipient reading it
      const messageSnapshot = await admin.database()
        .ref(`/chats/${chatId}/messages/${messageId}`)
        .once("value");

      const message = messageSnapshot.val();

      if (message && message.senderId !== userId) {
        await messageSnapshot.ref.update({
          status: "read",
          readAt: readAt,
        });

        console.log("Message status updated to read");
      }

      return null;
    } catch (error) {
      console.error("Error handling read receipt:", error);
      return null;
    }
  });
