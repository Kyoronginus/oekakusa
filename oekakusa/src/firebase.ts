import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// TODO: Replace with your actual Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCJUsPna7hWI7Y_1vqudM0guaCWar1RAMo",
  authDomain: "oekakusa.firebaseapp.com",
  projectId: "oekakusa",
  storageBucket: "oekakusa.firebasestorage.app",
  messagingSenderId: "237030398892",
  appId: "1:237030398892:web:1a84ac74c2fd4c42cbb809",
  measurementId: "G-6LWYE5GS81"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
