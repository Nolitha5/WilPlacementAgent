/**
 * src/services/internships.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Supabase CRUD operations for the internships table.
 * Import these functions in pages instead of calling supabase directly,
 * so data-access logic stays decoupled from UI components.
 */
import { supabase } from "../lib/supabase";

export const getInternships = () =>
  supabase.from("internships").select("*").order("created_at", { ascending: false });

export const getInternshipsByEmployer = (employerId) =>
  supabase.from("internships").select("*").eq("employer_id", employerId).order("created_at", { ascending: false });

export const createInternship = (data) =>
  supabase.from("internships").insert(data);

export const deleteInternship = (id) =>
  supabase.from("internships").delete().eq("id", id);
