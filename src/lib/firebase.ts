import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  // Replace with your Firebase config
  apiKey: "AIzaSyDN92ds8LA3TQ71SEIrBK4hqpvZHk6wsE8",
  authDomain: "jccl-workshop.firebaseapp.com",
  projectId: "jccl-workshop",
  storageBucket: "jccl-workshop.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:641608612240:android:f162eb76a51f56313b1b15"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const auth = getAuth(app);