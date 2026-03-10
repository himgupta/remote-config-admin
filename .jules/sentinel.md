## 2024-05-18 - Missing App Check Enforcement on Exposed Cloud Functions
**Vulnerability:** The `requestAccess` and `manageWhitelist` Cloud Functions did not verify `context.app`, despite App Check being a requirement for this project.
**Learning:** Cloud Functions added without an explicit `if (!context.app)` check allow unverified clients to bypass App Check entirely, increasing the risk of abuse and unintended billing charges, which must be strictly minimized.
**Prevention:** Always verify that newly created `https.onCall` Cloud Functions explicitly include the `context.app` verification boilerplate at the very beginning of the function execution.
