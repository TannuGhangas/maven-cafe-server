// backend/notify.js
const admin = require("./firebaseAdmin");

async function sendPushNotification(token, title, body, data = {}) {
  const message = {
    token,
    notification: { title, body },
    data, // optional key/value strings
    android: { priority: "high" },
    apns: { headers: { "apns-priority": "10" } }
  };

  return admin.messaging().send(message);
}

module.exports = sendPushNotification;

// usage example (do NOT call here directly in production):
// await sendPushNotification(userToken, "Chef is coming", "Tannu from Cabin 12 called the chef");
