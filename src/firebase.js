import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBNhRpuoA_aXg18iki1iIqNvPqvuQ6Qu0I",
  authDomain: "shizai-hacchu.firebaseapp.com",
  projectId: "shizai-hacchu",
  storageBucket: "shizai-hacchu.firebasestorage.app",
  messagingSenderId: "103934586205",
  appId: "1:103934586205:web:bba1df6b9f3a4b41f90cb4",
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
