// -----------------------------------------------------
// backend/notify.js
// -----------------------------------------------------

const admin = require("./firebaseAdmin");
const logger = require("./utils/logger");

async function sendPushNotification(token, title, body, data = {}) {
  if (!admin) {
    logger.error("❌ Firebase Admin not initialized. Cannot send notifications.");
    return { error: "Firebase Admin not initialized" };
  }

  const message = {
    token,
    notification: { title, body },
    data,

    // ANDROID HIGH PRIORITY
    android: {
      priority: "high",
      notification: {
        channelId: "maven-default",
        vibrateTimingsMillis: [200, 100, 200],
        notificationPriority: "PRIORITY_MAX"
      }
    },

    // iOS HIGH PRIORITY
    apns: {
      headers: { "apns-priority": "10" },
      payload: { aps: { sound: "default" } }
    },

    // WEB PUSH (PWA)
    webpush: {
      notification: {
        title,
        body,
        icon: "/icons/icon-192-v2.png",
        badge: "/icons/icon-192-v2.png",
        vibrate: [200, 100, 200],
        requireInteraction: true,
        tag: Date.now().toString(),
        renotify: true
      },
      fcmOptions: {
        link: "/"  // Open your PWA on notification click
      }
    }
  };

  try {
    const response = await admin.messaging().send(message);

    logger.info("📨 Push sent successfully", {
      token,
      title,
      response
    });

    return response;
  } catch (error) {
    logger.error("❌ Error sending push notification", {
      token,
      error: error?.message || error
    });

    throw error;
  }
}

module.exports = sendPushNotification;
