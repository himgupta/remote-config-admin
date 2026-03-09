## 2024-05-24 - Inconsistent App Check Enforcement
**Vulnerability:** The `updateConfig` Cloud Function was protected by Firebase App Check (`context.app`), but the `requestAccess` and `manageWhitelist` endpoints were not.
**Learning:** Security features like App Check must be applied uniformly across all exposed backend endpoints. Even seemingly "internal" admin functions are public APIs and susceptible to automated attacks or abuse if unprotected.
**Prevention:** Always verify `context.app` on ALL `functions.https.onCall` endpoints, and implement robust input validation (`typeof`) to prevent NoSQL injection vectors.
