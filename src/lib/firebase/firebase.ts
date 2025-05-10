// Import the functions you need from the SDKs you need
import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
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

// Check for missing Firebase configuration and log a warning
if (
  !firebaseConfig.apiKey || firebaseConfig.apiKey === "YOUR_API_KEY_HERE" ||
  !firebaseConfig.authDomain ||
  !firebaseConfig.projectId
) {
  console.warn(
    "Firebase configuration is missing or incomplete. " +
    "Please check your .env file and ensure all NEXT_PUBLIC_FIREBASE_ variables are set correctly. " +
    "The application might not work as expected, especially authentication features."
  );
}


// Initialize Firebase
let app: FirebaseApp;
if (!getApps().length) {
  try {
    app = initializeApp(firebaseConfig);
  } catch (error) {
    console.error("Failed to initialize Firebase app:", error);
    // Depending on the app's needs, you might want to throw the error
    // or handle it by setting 'app' to a state that indicates failure.
    // For now, we'll let it proceed, and auth will likely fail downstream.
    // @ts-ignore - app might not be initialized here if error occurs
    app = undefined;
  }
} else {
  app = getApps()[0];
}

let auth: Auth;
// @ts-ignore - app might be undefined if initialization failed
if (app) {
  auth = getAuth(app);
} else {
  // Provide a non-functional Auth object or handle this case as appropriate
  // This prevents 'auth is not defined' errors if app initialization fails
  console.error("Firebase app not initialized. Auth features will not work.");
  // @ts-ignore - auth will be undefined, leading to runtime errors if used.
  // Consider a mock or null object pattern if needed for graceful degradation.
  auth = undefined; 
}


export { app, auth };
