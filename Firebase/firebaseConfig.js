// Firebase/firebaseConfig.js
import { initializeApp, getApps, getApp } from "firebase/app";
import { initializeAuth, getReactNativePersistence } from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// ⚡ Your Firebase project config
const firebaseConfig = {
  apiKey: "AIzaSyDM9ajCTkROObUtA4QM8V6J9zRWSV964HY",
  authDomain: "findsos.firebaseapp.com",
  projectId: "findsos",
  storageBucket: "findsos.appspot.com",
  messagingSenderId: "633214674311",
  appId: "1:633214674311:web:981141b66deac72c995f22",
  measurementId: "G-77M5D3DF0R",
};

// Initialize Firebase app
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// Initialize Auth (only once)
let auth;
try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} catch (e) {
  console.log("Firebase Auth already initialized");
}

// Firestore & Storage
const db = getFirestore(app);
const storage = getStorage(app);

export { app, auth, db, storage };
