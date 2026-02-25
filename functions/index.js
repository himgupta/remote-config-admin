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

  // 2. Verify Whitelist & Admin Role
  const db = getFirestore();
  // Check if the user exists in the whitelist collection and is an admin.
  // The document ID should be the email address.
  const whitelistRef = db.collection("whitelist").doc(email);
  const whitelistDoc = await whitelistRef.get();

  if (!whitelistDoc.exists || whitelistDoc.data().role !== "admin") {
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

exports.requestAccess = functions.https.onCall(async (data, context) => {
  // 1. Verify Authentication
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "The function must be called while authenticated."
    );
  }

  const email = context.auth.token.email;
  const db = getFirestore();

  try {
    // Check if request already exists
    // We can use email as ID to prevent duplicates easily
    await db.collection("access_requests").doc(email).set({
      email: email,
      status: "pending",
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });

    return { success: true, message: "Access request submitted successfully." };
  } catch (error) {
    console.error("Error submitting access request:", error);
    throw new functions.https.HttpsError(
      "internal",
      "An error occurred while submitting the request."
    );
  }
});

exports.manageWhitelist = functions.https.onCall(async (data, context) => {
  // 1. Verify Authentication
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "The function must be called while authenticated."
    );
  }

  const callerEmail = context.auth.token.email;
  const db = getFirestore();

  // 2. Verify Caller is Admin
  const callerDoc = await db.collection("whitelist").doc(callerEmail).get();
  if (!callerDoc.exists || callerDoc.data().role !== "admin") {
    throw new functions.https.HttpsError(
      "permission-denied",
      "Only admins can manage the whitelist."
    );
  }

  const { email, role, action } = data;
  if (!email || !action) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Email and action are required."
    );
  }

  try {
    if (action === "add") {
      await db.collection("whitelist").doc(email).set({
        email: email,
        role: role || "viewer", // Default role
        addedBy: callerEmail,
        addedAt: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });

      // Remove from access_requests if exists
      await db.collection("access_requests").doc(email).delete();
    } else if (action === "remove") {
      await db.collection("whitelist").doc(email).delete();
    } else {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Invalid action."
      );
    }

    // Audit Log
    await db.collection("audit_logs").add({
      user: callerEmail,
      action: `WHITELIST_${action.toUpperCase()}`,
      targetEmail: email,
      targetRole: role,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });

    return { success: true, message: `User ${action}ed successfully.` };
  } catch (error) {
    console.error("Error managing whitelist:", error);
    throw new functions.https.HttpsError(
      "internal",
      "An error occurred."
    );
  }
});
