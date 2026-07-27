/**
 * src/context/AuthContext.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Global authentication context.
 * Wrap <App /> with <AuthProvider> to provide auth state to all children.
 *
 * TODO: move the session-restore logic from App.jsx into AuthProvider
 *       once the context refactor is complete.
 */
import { createContext, useState, useEffect } from "react";
import { restoreSession, signOut } from "../services/auth";
import { supabase } from "../lib/supabase";

export const AuthContext = createContext({
  profile:  null,
  booting:  true,
  logout:   async () => {},
  setProfile: () => {},
});

export function AuthProvider({ children }) {
  const [profile,  setProfile] = useState(null);
  const [booting,  setBooting] = useState(true);

  useEffect(() => {
    restoreSession().then(p => {
      if (p) setProfile(p);
      setBooting(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) setProfile(null);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  const logout = async () => {
    await signOut();
    setProfile(null);
  };

  return (
    <AuthContext.Provider value={{ profile, setProfile, booting, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
