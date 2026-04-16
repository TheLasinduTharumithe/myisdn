import { FirebaseApp, getApp, getApps, initializeApp } from "firebase/app";
import { Auth, getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

function hasConfiguredValue(value: string | undefined) {
  if (!value) {
    return false;
  }

  const normalized = value.trim().toLowerCase();
  return normalized.length > 0 && !normalized.startsWith("your-");
}

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const SECONDARY_APP_NAME = "isdn-secondary-auth";

export const isFirebaseConfigured = Boolean(
  hasConfiguredValue(firebaseConfig.apiKey) &&
    hasConfiguredValue(firebaseConfig.authDomain) &&
    hasConfiguredValue(firebaseConfig.projectId) &&
    hasConfiguredValue(firebaseConfig.storageBucket) &&
    hasConfiguredValue(firebaseConfig.messagingSenderId) &&
    hasConfiguredValue(firebaseConfig.appId),
);

export const firebaseApp = isFirebaseConfigured
  ? getApps().length > 0
    ? getApp()
    : initializeApp(firebaseConfig)
  : null;

export const auth = firebaseApp ? getAuth(firebaseApp) : null;
export const db = firebaseApp ? getFirestore(firebaseApp) : null;

function requireConfiguredApp(app: FirebaseApp | null, label: string) {
  if (!isFirebaseConfigured || !app) {
    throw new Error(
      `Firebase is not configured. Add valid NEXT_PUBLIC_FIREBASE_* values before using ${label}.`,
    );
  }

  return app;
}

export function getFirebaseApp() {
  return requireConfiguredApp(firebaseApp, "Firebase App");
}

export function getFirebaseAuth() {
  if (!auth) {
    throw new Error(
      "Firebase Authentication is not configured. Add valid NEXT_PUBLIC_FIREBASE_* values.",
    );
  }

  return auth;
}

export function getFirebaseDb() {
  if (!db) {
    throw new Error(
      "Cloud Firestore is not configured. Add valid NEXT_PUBLIC_FIREBASE_* values.",
    );
  }

  return db;
}

let secondaryAuthInstance: Auth | null = null;

export function getSecondaryAuth() {
  if (secondaryAuthInstance) {
    return secondaryAuthInstance;
  }

  const existingSecondaryApp = getApps().find((app) => app.name === SECONDARY_APP_NAME);
  const secondaryApp = existingSecondaryApp ?? initializeApp(firebaseConfig, SECONDARY_APP_NAME);
  secondaryAuthInstance = getAuth(requireConfiguredApp(secondaryApp, "Secondary Firebase Auth"));
  return secondaryAuthInstance;
}
