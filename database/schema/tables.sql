-- ─────────────────────────────────────────────────────────────────────────────
-- WIL Placement Agent — Supabase Schema
-- ─────────────────────────────────────────────────────────────────────────────

-- Profiles (extends Supabase auth.users)
create table if not exists profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  name        text,
  email       text unique,
  role        text check (role in ('admin','student','employer')) not null,
  created_at  timestamptz default now()
);

-- Students
create table if not exists students (
  id            uuid primary key references profiles(id) on delete cascade,
  major         text,
  year          text,
  average_mark  numeric,
  skills        text[],
  location      text,
  created_at    timestamptz default now()
);

-- Employers
create table if not exists employers (
  id          uuid primary key references profiles(id) on delete cascade,
  company     text,
  location    text,
  created_at  timestamptz default now()
);

-- Internships (posted by employers)
create table if not exists internships (
  id               uuid primary key default gen_random_uuid(),
  employer_id      uuid references employers(id) on delete cascade,
  company_name     text,
  internship_name  text not null,
  type             text check (type in ('Full-Time','Part-Time')),
  location         text,
  duration         text,
  description      text,
  skills_required  text[],
  posted_date      date,
  created_at       timestamptz default now()
);

-- Applications (student → internship)
create table if not exists applications (
  id             uuid primary key default gen_random_uuid(),
  student_id     uuid references students(id) on delete cascade,
  internship_id  uuid references internships(id) on delete cascade,
  status         text check (status in ('pending','interview','declined')) default 'pending',
  applied_date   date,
  interview_date date,
  cv_url         text,
  motivation     text,
  note           text,
  created_at     timestamptz default now(),
  unique (student_id, internship_id)
);

-- RLS: enable on all tables
alter table profiles    enable row level security;
alter table students    enable row level security;
alter table employers   enable row level security;
alter table internships enable row level security;
alter table applications enable row level security;
