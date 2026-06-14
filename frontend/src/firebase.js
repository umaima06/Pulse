import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyBgXF4KinKVngapDbyFIVOeSt7Z9Tdwx9Q",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "pulse-11de7.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "pulse-11de7",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "pulse-11de7.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "383499078117",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:383499078117:web:dc5a48db35b128abb3470c"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
