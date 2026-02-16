// src/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCZH-B42YhsZrN5rGpX_RUOOuXVDaj5tdI",
  authDomain: "inventory-7caee.firebaseapp.com",
  projectId: "inventory-7caee",
  storageBucket: "inventory-7caee.firebasestorage.app",
  messagingSenderId: "388993307691",
  appId: "1:388993307691:web:d302a651e74b075bcfc66e",
  measurementId: "G-7M95CFSHGJ"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);