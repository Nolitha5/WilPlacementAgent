-- ─────────────────────────────────────────────────────────────────────────────
-- WIL Placement Agent — Seed Data (for local/staging development only)
-- Replace UUIDs with real ones from your auth.users table before running.
-- ─────────────────────────────────────────────────────────────────────────────

-- Example internship seed (replace employer_id with a real employer UUID)
insert into internships (employer_id, company_name, internship_name, type, location, duration, skills_required, description, posted_date)
values
  ('00000000-0000-0000-0000-000000000001', 'TechSA', 'Frontend Developer Intern', 'Full-Time', 'Cape Town', '6 months', ARRAY['React','JavaScript','Tailwind CSS'], 'Build modern web interfaces for our SaaS platform.', current_date),
  ('00000000-0000-0000-0000-000000000001', 'TechSA', 'Data Analyst Intern',       'Part-Time', 'Remote',     '3 months', ARRAY['Python','SQL','Excel'],              'Analyse user behaviour data and prepare weekly reports.', current_date);
