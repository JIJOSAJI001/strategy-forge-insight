import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDvCeE9-Lz3IagSrnEfzvwfEK3JXysuD-w",
  authDomain: "microproject2-7ac7e.firebaseapp.com",
  projectId: "microproject2-7ac7e",
  storageBucket: "microproject2-7ac7e.firebasestorage.app",
  messagingSenderId: "896381780535",
  appId: "1:896381780535:web:85e7026f071ea2b4d2f5b2",
  measurementId: "G-9C20SDZP97"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app); 