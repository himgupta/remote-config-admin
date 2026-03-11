# Maintenance Mode Admin Dashboard

This project provides a secure, web-based admin dashboard to manage the maintenance mode of your application using Firebase Remote Config.

## Features

- **Secure Login**: Only whitelisted Google accounts can access the dashboard.
- **Granular Control**: Toggle maintenance mode globally, or specifically for Login/Dashboard screens.
- **Custom Messages**: Set custom titles and messages for maintenance screens.
- **Audit Logging**: Every configuration change is logged to Firestore with user and timestamp.
- **Cost Effective**: Uses Firebase Hosting and Cloud Functions (minimal cost within free tier limits, requires Blaze plan).

## Project Structure

- `frontend/`: React application (Vite + Tailwind CSS).
- `functions/`: Firebase Cloud Functions (Backend logic).

## App Store Connect Webhook Setup

This project includes a secure Cloud Function (`appStoreWebhook`) to listen for App Store Connect review updates and push notifications to a Slack channel.

### 1. Set Firebase Secrets
The webhook function requires two secrets to run securely. Run these commands using the Firebase CLI and paste your values when prompted:

```bash
firebase functions:secrets:set APP_STORE_WEBHOOK_SECRET
firebase functions:secrets:set SLACK_WEBHOOK_URL
```
- `APP_STORE_WEBHOOK_SECRET`: A strong, random string you create (e.g., `my_super_secure_string`).
- `SLACK_WEBHOOK_URL`: Your incoming Slack Webhook URL.

### 2. Deploy the Webhook
Deploy the function to get the live endpoint URL:
```bash
firebase deploy --only functions:appStoreWebhook
```
Once deployed, copy the Function URL from the terminal output (e.g., `https://us-central1-YOUR_PROJECT.cloudfunctions.net/appStoreWebhook`).

### 3. Configure App Store Connect
1. Log in to [App Store Connect](https://appstoreconnect.apple.com/).
2. Navigate to **Users and Access** > **Integrations** > **Webhooks**.
3. Click the **+** button to add a new webhook.
4. Name it (e.g., "Slack Review Notifications").
5. Paste your Cloud Function URL into the **URL** field.
6. Enter the secret you created in Step 1 into the **Secret** field.
7. Select the **App Version State** event type.
8. Save.

### 4. Test the Webhook
App Store Connect provides a "Send Test Notification" button in the Webhook configuration. Clicking this sends a `webhookPings` test event to the function. If everything is configured correctly, it will respond with a `200 OK`.

When an app goes into review or is approved, you will get a Slack message. If an app is **REJECTED**, the webhook will format a special alert directing you to the Resolution Center for the detailed textual rejection reason (since the raw App Store Connect webhook payload does not contain the textual reason itself).

## Prerequisites

1.  **Firebase Project**: Create a project in the [Firebase Console](https://console.firebase.google.com/).
2.  **Blaze Plan**: Upgrade your project to the Blaze (Pay-as-you-go) plan to use Cloud Functions.
3.  **Node.js**: Install Node.js (v18 or later).
4.  **Firebase CLI**: Install globally via `npm install -g firebase-tools`.

## Setup Instructions

### 1. Configure Firebase

1.  Enable **Authentication** and set up the **Google** sign-in provider.
2.  Enable **Cloud Firestore** in production mode.
3.  Enable **Remote Config**.
4.  Enable **Cloud Functions**.

### 2. Initial Configuration

1.  **Clone the repository**:
    ```bash
    git clone <repo-url>
    cd <repo-name>
    ```

2.  **Set up Environment Variables**:
    Create a `.env` file in the `frontend/` directory with your Firebase config keys:
    ```
    VITE_FIREBASE_API_KEY=your_api_key
    VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
    VITE_FIREBASE_PROJECT_ID=your_project_id
    VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
    VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
    VITE_FIREBASE_APP_ID=your_app_id
    ```

3.  **Add Initial Whitelist User**:
    Go to Firestore Console and create a collection named `whitelist`.
    Add a document where the **Document ID** is your email address (e.g., `user@example.com`). The fields can be empty or `{ "role": "admin" }`.

### 3. Deploy

1.  **Login to Firebase**:
    ```bash
    firebase login
    firebase use --add
    ```
    Select your project alias (e.g., `default`).

2.  **Configure Hosting Target**:
    This project is configured to deploy to a hosting target named `nudge`. Run the following command to link this target to your Firebase Hosting site:
    ```bash
    firebase target:apply hosting nudge <your-hosting-site-name>
    ```
    *Replace `<your-hosting-site-name>` with the site ID from your Firebase Console (Hosting tab).*

3.  **Deploy Everything**:
    Run the following command from the root directory:
    ```bash
    firebase deploy
    ```
    This will automatically:
    1. Install frontend dependencies.
    2. Build the frontend application.
    3. Deploy:
       - Firestore Security Rules
       - Cloud Functions (`updateConfig`)
       - Frontend to Firebase Hosting

## Usage

1.  Open the hosted URL (provided by `firebase deploy`).
2.  Login with your Google account.
3.  If your email is whitelisted, you will see the dashboard.
4.  Modify the settings and click "Activate Configuration".
5.  View the audit history in the sidebar.

## Local Development

**Frontend**:
```bash
cd frontend
npm install
npm run dev
```

**Functions**:
```bash
cd functions
npm install
npm run serve
```
Note: To test functions locally with the frontend, you'll need to configure the emulator suite.

## Security Notes

- **Firestore Rules**: Restrict read access to `whitelist` and `audit_logs` to authenticated users in the whitelist.
- **Cloud Functions**: The `updateConfig` function programmatically verifies the user is in the whitelist before applying changes.
