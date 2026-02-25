# Firebase App Check Setup

To fully secure your Firebase Functions and prevent abuse, you must configure App Check in the Firebase Console. The code changes in this repository (`frontend/src/firebase.js` and `functions/index.js`) handle the **client-side token generation** and **server-side token verification**.

However, to make this "fool proof" against billing abuse, you must complete the following steps:

## 1. Get reCAPTCHA Keys (Google Admin Console)
1.  Go to the [reCAPTCHA Admin Console](https://www.google.com/recaptcha/admin).
2.  Register a new site (reCAPTCHA v3).
3.  Note down the **Site Key** (public) and **Secret Key** (private).
    *   Add the **Site Key** to your `frontend/.env` file as `VITE_RECAPTCHA_SITE_KEY`.

## 2. Configure Firebase Console (Critical Step)
1.  Go to the [Firebase Console](https://console.firebase.google.com/).
2.  Navigate to **Build > App Check**.
3.  Click **Get Started**.
4.  Select your web app.
5.  Select **reCAPTCHA v3**.
6.  Enter the **Secret Key** you got from step 1.
7.  Click **Save**.

## 3. Enforcement (The "Fool Proof" Part)
Currently, the code includes a check:
```javascript
if (!context.app) {
  throw new functions.https.HttpsError(...)
}
```
*   **Protection Level:** Code-Based.
*   **Effect:** Unverified requests are rejected immediately. Your database/logic is safe.
*   **Billing Risk:** The function is *still invoked* to perform this check. You pay for the invocation time (minimal, but non-zero).

**To achieve Zero-Billing Protection:**
1.  After verifying your app works correctly with App Check enabled (monitor the "Unverified traffic" metric in the App Check tab).
2.  Click the **Enforce** button in the Cloud Functions section of the App Check tab.
3.  Once enforced, unverified requests are blocked at the Google infrastructure level and never reach your function code. **This incurs zero cost.**

## Summary
*   **Code:** Handled in this update.
*   **Keys:** Must be added to Firebase Console manually.
*   **Enforcement:** Must be enabled in Firebase Console for full billing protection.
