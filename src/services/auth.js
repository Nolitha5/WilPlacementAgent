/**
 * src/services/auth.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Authentication service — wraps Supabase Auth calls.
 *
 * All components should import signIn / signOut from here rather than
 * calling supabase.auth directly, so the auth logic stays in one place.
 */

import { supabase } from "../lib/supabase";

/**
 * Sign in a user and return their merged profile + role-specific data.
 * Throws on auth error or if the profile row is missing.
 *
 * @param {string} email
 * @param {string} password
 * @returns {Promise<Object>} profile merged with student/employer extras
 */
export async function signIn(email, password) {
  const { data, error: err } = await supabase.auth.signInWithPassword({ email, password });
  if (err) throw new Error(err.message);

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", data.user.id)
    .single();

  if (!profile) throw new Error("Profile not found. Contact the administrator.");

  let extra = {};
  if (profile.role === "student") {
    const { data: s } = await supabase.from("students").select("*").eq("id", profile.id).single();
    extra = s || {};
  } else if (profile.role === "employer") {
    const { data: emp } = await supabase.from("employers").select("*").eq("id", profile.id).single();
    extra = emp || {};
  }

  return { ...profile, ...extra };
}

/**
 * Restore the current session (called on app boot).
 * Returns null if no active session.
 *
 * @returns {Promise<Object|null>}
 */
export async function restoreSession() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return null;

  const { data: prof } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", session.user.id)
    .single();

  if (!prof) return null;

  let extra = {};
  if (prof.role === "student") {
    const { data: s } = await supabase.from("students").select("*").eq("id", prof.id).single();
    extra = s || {};
  } else if (prof.role === "employer") {
    const { data: emp } = await supabase.from("employers").select("*").eq("id", prof.id).single();
    extra = emp || {};
  }

  return { ...prof, ...extra };
}

/**
 * Sign out the current user.
 */
export async function signOut() {
  await supabase.auth.signOut();
}
