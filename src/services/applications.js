/**
 * src/services/applications.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Supabase CRUD operations for the applications table.
 */
import { supabase } from "../lib/supabase";

export const getApplicationsByStudent = (studentId) =>
  supabase
    .from("applications")
    .select("*, internships(internship_name, company_name, location, duration, type, skills_required)")
    .eq("student_id", studentId)
    .order("created_at", { ascending: false });

export const getApplicationsByInternships = (internshipIds) =>
  supabase
    .from("applications")
    .select("*, cv_url, motivation, internships(internship_name, skills_required), students(major,year,average_mark,skills,profiles(name,email))")
    .in("internship_id", internshipIds)
    .order("created_at", { ascending: false });

export const createApplication = (data) =>
  supabase.from("applications").insert(data);

export const updateApplication = (id, data) =>
  supabase.from("applications").update(data).eq("id", id);

export const deleteApplication = (id) =>
  supabase.from("applications").delete().eq("id", id);
