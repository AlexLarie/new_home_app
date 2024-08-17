// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, onValue, remove, push } from "firebase/database"; // Corrected import for Realtime Database
import { getAuth } from "firebase/auth";


// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCEzmGinLoMFcFw722St4Xkk6jA5DBeS8g",
  authDomain: "new-home-bfbe7.firebaseapp.com",
  databaseURL: "https://new-home-bfbe7-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "new-home-bfbe7",
  storageBucket: "new-home-bfbe7.appspot.com",
  messagingSenderId: "27257408053",
  appId: "1:27257408053:web:f053787ab80ac404e1ff7c"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const database = getDatabase(app);

export { database, ref, set, onValue, remove, push, auth };
