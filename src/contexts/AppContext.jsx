import { createContext, useContext, useState, useEffect } from "react";
import { 
  auth, 
  googleProvider, 
  signInWithPopup,
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  updateProfile
} from "../firebase/firebase";

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const loginWithGoogle = async () => {
    try {
      return await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Google Sign-In Error:", error);
      throw error;
    }
  };

  const loginWithEmail = (email, password) => signInWithEmailAndPassword(auth, email, password);
  
  const signUpWithEmail = async (email, password, username) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(userCredential.user, { displayName: username });
    return userCredential;
  };

  const logout = () => signOut(auth);

  return (
    <AppContext.Provider value={{ user, loginWithGoogle, loginWithEmail, signUpWithEmail, logout, loading }}>
      {!loading && children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);