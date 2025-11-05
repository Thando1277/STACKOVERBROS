// Firebase/firebaseConfig.js
import { initializeApp, getApps, getApp } from "firebase/app";
import { initializeAuth, getReactNativePersistence, getAuth } from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import Constants from 'expo-constants';

// Get environment variables
// In development, these come from .env file
// In production/Expo, these come from app.json extra field
const getEnvVar = (key, fallback = null) => {
  // Try Expo Constants first (for production builds)
  if (Constants.expoConfig?.extra?.[key]) {
    return Constants.expoConfig.extra[key];
  }
  
  // Try process.env (for development with babel-plugin-inline-dotenv)
  if (process.env[key]) {
    return process.env[key];
  }
  
  // Use fallback or throw error
  if (fallback !== null) {
    return fallback;
  }
  
  throw new Error(`Environment variable ${key} is not defined. Please check your .env file or app.json configuration.`);
};

// Firebase config using environment variables
const firebaseConfig = {
  apiKey: getEnvVar('FIREBASE_API_KEY'),
  authDomain: getEnvVar('FIREBASE_AUTH_DOMAIN'),
  projectId: getEnvVar('FIREBASE_PROJECT_ID'),
  storageBucket: getEnvVar('FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: getEnvVar('FIREBASE_MESSAGING_SENDER_ID'),
  appId: getEnvVar('FIREBASE_APP_ID'),
  measurementId: getEnvVar('FIREBASE_MEASUREMENT_ID', ''), // Optional
};

// Initialize Firebase
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// Initialize Auth with React Native persistence
let auth;
try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} catch (e) {
  // Auth already initialized, get existing instance
  auth = getAuth(app);
}

// Firestore - React Native doesn't need enableIndexedDbPersistence
// Firestore automatically handles offline persistence in React Native
const db = getFirestore(app);

// Storage
const storage = getStorage(app);

console.log("🔥 Firebase initialized successfully!");
console.log("📦 Storage bucket:", firebaseConfig.storageBucket);

export { app, auth, db, storage };