// Firebase/firebaseConfig.js
import { initializeApp, getApps, getApp } from "firebase/app";
import { initializeAuth, getReactNativePersistence, getAuth } from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import Constants from 'expo-constants';

// Prefer .env in development; fallback to Expo extra for builds
const isDev = __DEV__ === true;

const getEnvVar = (key, fallback = null) => {
  // 1) In dev, prefer process.env (babel inline from .env)
  if (isDev && process.env[key]) {
    return process.env[key];
  }
  // 2) Expo extra (EAS/builds or when provided via app.json)
  if (Constants.expoConfig?.extra?.[key]) {
    return Constants.expoConfig.extra[key];
  }
  // 3) Non-dev fallback to process.env if present
  if (!isDev && process.env[key]) {
    return process.env[key];
  }
  if (fallback !== null) return fallback;
  throw new Error(`Environment variable ${key} is not defined. Check your .env (dev) or app config (prod).`);
};

const firebaseConfig = {
  apiKey: getEnvVar('FIREBASE_API_KEY'),
  authDomain: getEnvVar('FIREBASE_AUTH_DOMAIN'),
  projectId: getEnvVar('FIREBASE_PROJECT_ID'),
  storageBucket: getEnvVar('FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: getEnvVar('FIREBASE_MESSAGING_SENDER_ID'),
  appId: getEnvVar('FIREBASE_APP_ID'),
  measurementId: getEnvVar('FIREBASE_MEASUREMENT_ID', ''),
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

let auth;
try {
  auth = initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) });
} catch (e) {
  auth = getAuth(app);
}

const db = getFirestore(app);
const storage = getStorage(app);

console.log('🔥 Firebase initialized');
console.log('📦 Storage bucket:', firebaseConfig.storageBucket);

export { app, auth, db, storage };