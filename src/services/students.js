/**
 * src/services/students.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Supabase operations for the students table.
 */
import { supabase } from "../lib/supabase";

export const getStudent = (id) =>
  supabase.from("students").select("*").eq("id", id).single();

export const createStudent = (data) =>
  supabase.from("students").insert(data);

export const updateStudent = (id, data) =>
  supabase.from("students").update(data).eq("id", id);
