import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAZoPW6Ha4CLWX3LGmIgVpP1xZx9acl-u8",
  authDomain: "investomate-1379a.firebaseapp.com",
  projectId: "investomate-1379a",
  storageBucket: "investomate-1379a.appspot.com",
  messagingSenderId: "1006652788633",
  appId: "1:1006652788633:web:a4f8fdaab5af65f8354d08",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export { auth, googleProvider };
