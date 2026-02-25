import React, { createContext, useContext, useEffect, useState } from "react";
import { auth, googleProvider, db } from "./firebase";
import { signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

const AuthContext = createContext();

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isWhitelisted, setIsWhitelisted] = useState(false);
  const [role, setRole] = useState(null);

  function login() {
    return signInWithPopup(auth, googleProvider);
  }

  function logout() {
    return signOut(auth);
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setLoading(true);
      if (user) {
        // Check whitelist
        try {
          const userDoc = await getDoc(doc(db, "whitelist", user.email));
          if (userDoc.exists()) {
            const data = userDoc.data();
            setIsWhitelisted(true);
            setRole(data.role || "viewer");
            setCurrentUser(user);
          } else {
            setIsWhitelisted(false);
            setRole(null);
            setCurrentUser(user); // Still set user so we can show "Not authorized" screen
          }
        } catch (error) {
          console.error("Error checking whitelist:", error);
          setIsWhitelisted(false);
          setRole(null);
        }
      } else {
        setCurrentUser(null);
        setIsWhitelisted(false);
        setRole(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    isWhitelisted,
    role,
    login,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
