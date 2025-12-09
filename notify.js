// backend/notify.js
const admin = require("./firebaseAdmin");

async function sendPushNotification(token, title, body, data = {}) {
  const message = {
    token,
    notification: {
      title,
      body
    },
    data, // optional key/value strings

    // --- ANDROID HIGH PRIORITY ---
    android: {
      priority: "high",
      notification: {
        channelId: "maven-default",
        vibrateTimingsMillis: [200, 100, 200],
        notificationPriority: "PRIORITY_MAX"
      }
    },

    // --- iOS HIGH PRIORITY ---
    apns: {
      headers: {
        "apns-priority": "10"
      },
      payload: {
        aps: {
          sound: "default"
        }
      }
    },

    // --- IMPORTANT FIX FOR CHROME ---
    webpush: {
      notification: {
        title,
        body,
        icon: "/icons/icon-192-v2.png",
        badge: "/icons/icon-192-v2.png",
        vibrate: [200, 100, 200],
        requireInteraction: true,

        // 💥 KEY FIX — Chrome shows notification every time
        tag: Date.now().toString(),  // unique each time
        renotify: true               // force display even if same tag
      },
      fcmOptions: {
        link: "/" // opens PWA
      }
    }
  };

  return admin.messaging().send(message);
}

module.exports = sendPushNotification;
