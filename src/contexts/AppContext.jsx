import { createContext, useContext, useState, useEffect } from "react";

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [isLoggedIn, setIsLoggedIn] = useState(() => localStorage.getItem("swiftship_session") === "true");
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem("swiftship_user")));

  useEffect(() => {
    localStorage.setItem("swiftship_session", isLoggedIn);
    user ? localStorage.setItem("swiftship_user", JSON.stringify(user)) : localStorage.removeItem("swiftship_user");
  }, [isLoggedIn, user]);

  async function login(email, password) {
    await new Promise((resolve) => setTimeout(resolve, 800));
    if (!email || !password) throw new Error("All identity parameters are strictly required.");
    setIsLoggedIn(true);
    setUser({ name: "Global Terminal Operator", email: email, role: "administrator" });
  }

  async function register(email, password) {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    if (password.length < 6) throw new Error("Password framework must contain at least 6 characters.");
    setIsLoggedIn(true);
    setUser({ name: "New Client Account", email: email, role: "client" });
  }

  const initGoogle = () => {
    if (window.google) {
      window.google.accounts.id.initialize({
        client_id: "612496809464-9bokjlq3tkumnh5tf5ammgkfbcnca7s1.apps.googleusercontent.com", // PASTE YOUR ID
        callback: (response) => {
          const userObject = JSON.parse(window.atob(response.credential.split('.')[1]));
          setIsLoggedIn(true);
          setUser({ name: userObject.name, email: userObject.email, role: "client" });
          window.location.href = "/dashboard";
        }
      });
    }
  };

  const renderGoogleButton = (elementId) => {
    if (window.google) {
      window.google.accounts.id.renderButton(document.getElementById(elementId), {
        theme: "filled_black",
        size: "large",
        type: "standard",
        text: "signin_with",
        shape: "pill",
        width: 350
      });
    }
  };

  const logout = () => {
    setIsLoggedIn(false);
    setUser(null);
    localStorage.clear();
  };

  return (
    <AppContext.Provider value={{ isLoggedIn, user, login, register, initGoogle, renderGoogleButton, logout }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);