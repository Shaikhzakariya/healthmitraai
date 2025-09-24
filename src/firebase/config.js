import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAVL3l38f5njbfvhbLdZHvEEwLtOkNE9kE",
  authDomain: "diabetes-mitra-de5f8.firebaseapp.com",
  projectId: "diabetes-mitra-de5f8",
  storageBucket: "diabetes-mitra-de5f8.firebasestorage.app",
  messagingSenderId: "916099811993",
  appId: "1:916099811993:web:9ae0d4f89d8ce01ffd8608",
  measurementId: "G-JD0D5KTWKX"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

export default app;