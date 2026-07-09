import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  GoogleAuthProvider, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  updateProfile,
  signInWithPopup
} from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDpPT2mjJPkx_iMRF0JWD1OLboalN9bR0A",
  authDomain: "swiftship-2e2ac.firebaseapp.com",
  projectId: "swiftship-2e2ac",
  storageBucket: "swiftship-2e2ac.firebasestorage.app",
  messagingSenderId: "612496809464",
  appId: "1:612496809464:web:314a0fe0624e0332fdca0d"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  updateProfile,
  signInWithPopup
};