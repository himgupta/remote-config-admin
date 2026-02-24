const functions = require("firebase-functions");
const admin = require("firebase-admin");
const { getRemoteConfig } = require("firebase-admin/remote-config");
const { getFirestore } = require("firebase-admin/firestore");

admin.initializeApp();

exports.updateConfig = functions.https.onCall(async (data, context) => {
  // 0. Verify App Check
  if (!context.app) {
    throw new functions.https.HttpsError(
      "failed-precondition",
      "The function must be called from an App Check verified app."
    );
  }

  // 1. Verify Authentication
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "The function must be called while authenticated."
    );
  }

  const email = context.auth.token.email;
  if (!email) {
    throw new functions.https.HttpsError(
      "failed-precondition",
      "The function must be called with an authenticated email."
    );
  }

  // 2. Verify Whitelist
  const db = getFirestore();
  // Check if the user exists in the whitelist collection.
  // The document ID should be the email address.
  const whitelistRef = db.collection("whitelist").doc(email);
  const whitelistDoc = await whitelistRef.get();

  if (!whitelistDoc.exists) {
    throw new functions.https.HttpsError(
      "permission-denied",
      "User is not authorized to perform this action."
    );
  }

  // 3. Validate Config Payload
  const newConfig = data.config;
  if (!newConfig || typeof newConfig !== "object") {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "The function must be called with a valid config object."
    );
  }

  // 4. Update Remote Config
  try {
    const remoteConfig = getRemoteConfig();
    const template = await remoteConfig.getTemplate();

    // Update the parameter
    // We store the entire configuration in a single key "maintenance_config"
    template.parameters["maintenance_config"] = {
      defaultValue: {
        value: JSON.stringify(newConfig)
      },
      valueType: "JSON",
      description: "Configuration for maintenance mode and journey settings."
    };

    // Publish the template
    await remoteConfig.publishTemplate(template);

    // 5. Audit Log
    await db.collection("audit_logs").add({
      user: email,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      action: "UPDATE_CONFIG",
      newConfig: newConfig
    });

    return { success: true, message: "Configuration updated successfully." };

  } catch (error) {
    console.error("Error updating config:", error);
    throw new functions.https.HttpsError(
      "internal",
      "An error occurred while updating the configuration."
    );
  }
});
