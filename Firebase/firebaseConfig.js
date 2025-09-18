import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDM9ajCTkROObUtA4QM8V6J9zRWSV964HY",
  authDomain: "findsos.firebaseapp.com",
  projectId: "findsos",
  storageBucket: "findsos.firebasestorage.app",
  messagingSenderId: "633214674311",
  appId: "1:633214674311:web:981141b66deac72c995f22",
  measurementId: "G-77M5D3DF0R"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
