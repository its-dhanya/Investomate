import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

// Firebase configuration object from your Firebase Console
const firebaseConfig = {
  apiKey: "AIzaSyA7ptQUGisxW4MrTfLSaNDYXhBTnEmTBCU",
  authDomain: "investomate-6ee33.firebaseapp.com",
  projectId: "investomate-6ee33",
  storageBucket: "investomate-6ee33.firebasestorage.app",
  messagingSenderId: "780998670236",
  appId: "1:780998670236:web:9a1397eae2b835c53b3a59",
  measurementId: "G-3903QSBS67"
};

// Initialize Firebase app
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and Google provider
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export { app, auth, googleProvider };
