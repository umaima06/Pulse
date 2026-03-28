import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBgXF4KinKVngapDbyFIVOeSt7Z9Tdwx9Q",
  authDomain: "pulse-11de7.firebaseapp.com",
  projectId: "pulse-11de7",
  storageBucket: "pulse-11de7.firebasestorage.app",
  messagingSenderId: "383499078117",
  appId: "1:383499078117:web:dc5a48db35b128abb3470c"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);