// src/firebase.js
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyDESQeEbFFKTfj5OmH0u-XyrE-hOQMlSsc",
  authDomain: "livestock-monitor-94ce0.firebaseapp.com",
  projectId: "livestock-monitor-94ce0",
  storageBucket: "livestock-monitor-94ce0.firebasestorage.app",
  messagingSenderId: "764405233112",
  appId: "1:764405233112:web:70aa10e8cf98776426eead",
  measurementId: "G-2NL2MWNKJW"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);  // ✅ Correct naming

export { app, auth, db };    
export const dbRT = getDatabase(app);  // ✅ Export consistent with usage
