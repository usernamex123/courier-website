import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../../supabase"; // Adjusted relative path to reach the root folder

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      fetchUserRole(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      fetchUserRole(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserRole = async (authUser) => {
    if (!authUser) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", authUser.id)
        .single();

      setUser({
        ...authUser,
        role: data?.role || authUser.user_metadata?.role || "customer",
      });
    } catch (err) {
      setUser({
        ...authUser,
        role: authUser.user_metadata?.role || "customer",
      });
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  };

  const signUp = async (email, password, metadata = {}) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: metadata },
    });
    if (error) throw error;
    return data;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);