// Import the functions you need from the SDKs you need
import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth, GoogleAuthProvider, getRedirectResult } from "firebase/auth"; // Added GoogleAuthProvider and getRedirectResult
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// --- Start of critical Firebase configuration check ---
const essentialConfigs = {
  "NEXT_PUBLIC_FIREBASE_API_KEY": firebaseConfig.apiKey,
  "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN": firebaseConfig.authDomain,
  "NEXT_PUBLIC_FIREBASE_PROJECT_ID": firebaseConfig.projectId,
};

let configIssueFound = false;
for (const [key, value] of Object.entries(essentialConfigs)) {
  if (!value || value === "YOUR_API_KEY_HERE" || value.includes("your_") || value.length < 5) { // Basic check for placeholders or very short values
    console.error(
      `CRITICAL Firebase Config Error: Environment variable ${key} appears to be missing, a placeholder, or incomplete in your .env.local file. Value: "${value}"`
    );
    configIssueFound = true;
  }
}

if (configIssueFound) {
  console.error(
    "----------------------------------------------------------------------------------\n" +
    "IMPORTANT: Firebase is not configured correctly. Authentication will FAIL.\n" +
    "The error 'Firebase: Error (auth/configuration-not-found)' typically means one of the following:\n\n" +
    "1. MISSING/INCORRECT VALUES IN '.env.local':\n" +
    "   - Create a '.env.local' file in the root of your project (if it doesn't exist).\n" +
    "   - Populate it with your ACTUAL Firebase project's web app configuration values.\n" +
    "   - Double-check that each value is correct and not a placeholder.\n" +
    "   Example .env.local content:\n" +
    "     NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXX\n" +
    "     NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com\n" +
    "     NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id\n" +
    "     NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com\n" +
    "     NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789012\n" +
    "     NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789012:web:abcdef1234567890abc\n" +
    "     NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX (this one is optional for Auth)\n\n" +
    "2. SIGN-IN PROVIDERS NOT ENABLED IN FIREBASE CONSOLE:\n" +
    "   - Go to your Firebase project console.\n" +
    "   - Navigate to 'Authentication' (under Build).\n" +
    "   - Go to the 'Sign-in method' tab.\n" +
    "   - Ensure the 'Email/Password' provider is ENABLED.\n" +
    "   - If using Google Sign-In, ensure the 'Google' provider is ENABLED and configured.\n\n" +
    "Please verify these steps carefully to resolve the authentication issue.\n" +
    "----------------------------------------------------------------------------------"
  );
}
// --- End of critical Firebase configuration check ---


// Initialize Firebase
let app: FirebaseApp;
if (!getApps().length) {
  try {
    app = initializeApp(firebaseConfig);
  } catch (error: any) {
    console.error("CRITICAL: Failed to initialize Firebase app:", error.message);
    // If app initialization fails, subsequent Firebase operations will also fail.
    // @ts-ignore - app will be undefined, handled below
    app = undefined;
  }
} else {
  app = getApps()[0];
}

let auth: Auth;
if (app) {
  try {
    auth = getAuth(app);
  } catch (error: any) {
    console.error("CRITICAL: Failed to get Firebase Auth instance:", error.message);
    // @ts-ignore - auth will be undefined
    auth = undefined;
  }
} else {
  // This case is hit if initializeApp failed
  console.error("Firebase app was not initialized. Auth features will not work. Check previous errors for Firebase configuration issues.");
  // Provide a non-functional Auth object to prevent 'auth is not defined' if possible,
  // though errors will still occur if its methods are called.
  auth = new Proxy({}, {
    get: (target, prop) => {
      throw new Error(`Firebase Auth is not properly initialized due to app initialization failure. Attempted to access property '${String(prop)}'. Review Firebase configuration in '.env.local' and Firebase console settings.`);
    }
  }) as Auth;
}


export { app, auth, GoogleAuthProvider, getRedirectResult }; // Exported GoogleAuthProvider and getRedirectResult
