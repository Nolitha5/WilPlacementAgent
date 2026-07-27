/**
 * src/services/employers.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Supabase operations for the employers table and the create-employer
 * Edge Function used by admins.
 */
import { supabase } from "../lib/supabase";

export const getEmployers = () =>
  supabase
    .from("employers")
    .select("id, company, location, profiles(name, email)")
    .order("created_at", { ascending: false });

export const createEmployer = (payload) =>
  supabase.functions.invoke("create-employer", { body: payload });

export const deleteEmployer = (id) =>
  supabase.from("employers").delete().eq("id", id);
