/**
 * src/services/storage.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Supabase Storage helpers for CV uploads.
 */
import { supabase } from "../lib/supabase";

/**
 * Upload a CV PDF to the 'cvs' bucket and return a long-lived signed URL.
 * @param {string} studentId
 * @param {string} internshipId
 * @param {File}   file
 * @returns {Promise<string>} signed URL
 */
export async function uploadCV(studentId, internshipId, file) {
  const filePath = `${studentId}/${internshipId}_${Date.now()}.pdf`;
  const { error } = await supabase.storage
    .from("cvs")
    .upload(filePath, file, { upsert: true });
  if (error) throw new Error("CV upload failed: " + error.message);

  const { data } = await supabase.storage
    .from("cvs")
    .createSignedUrl(filePath, 60 * 60 * 24 * 365 * 10); // 10 years
  return data?.signedUrl || null;
}
