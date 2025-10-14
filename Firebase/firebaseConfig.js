import { initializeApp } from "firebase/app";
import {
  getAuth,
  initializeAuth,
  getReactNativePersistence,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import AsyncStorage from "@react-native-async-storage/async-storage"; // ✅ add this

// Your Firebase config
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
const app = initializeApp(firebaseConfig);

// ✅ Use persistent authentication for React Native
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

export { auth };

// Firestore
export const db = getFirestore(app);
