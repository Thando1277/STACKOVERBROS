// Firebase/firebaseConfig.js
import { initializeApp, getApps, getApp } from "firebase/app";
import { initializeAuth, getReactNativePersistence, getAuth } from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyDM9ajCTkROObUtA4QM8V6J9zRWSV964HY",
  authDomain: "findsos.firebaseapp.com",
  projectId: "findsos",
  storageBucket: "findsos.firebasestorage.app",
  messagingSenderId: "633214674311",
  appId: "1:633214674311:web:981141b66deac72c995f22",
  measurementId: "G-77M5D3DF0R",
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

// Storage - Connected to findsos.firebasestorage.app
const storage = getStorage(app);

console.log("🔥 Firebase initialized successfully!");
console.log("📦 Storage bucket:", firebaseConfig.storageBucket);

export { app, auth, db, storage };