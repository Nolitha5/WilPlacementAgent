/**
 * src/hooks/useAuth.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Custom hook that exposes the current auth state from AuthContext.
 * Usage: const { profile, loading, logout } = useAuth();
 *
 * TODO: connect to AuthContext when context is wired up.
 */
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";

export function useAuth() {
  return useContext(AuthContext);
}
