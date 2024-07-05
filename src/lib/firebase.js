
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_API_KEY,
  authDomain: "react-chat-app-2ccd3.firebaseapp.com",
  projectId: "react-chat-app-2ccd3",
  storageBucket: "react-chat-app-2ccd3.appspot.com",
  messagingSenderId: "121720424160",
  appId: "1:121720424160:web:62d64a31e02f137c24f285",
  measurementId: "G-HTFHJ3Y00X"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const auth=getAuth()
export const db=getFirestore()
export const storage=getStorage()
