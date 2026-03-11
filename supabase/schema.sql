create extension if not exists "pgcrypto";

create table if not exists students (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique references auth.users(id) on delete cascade,
  full_name text not null,
  email text unique,
  total_xp integer not null default 0,
  streak integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists semesters (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references students(id) on delete cascade,
  name text not null,
  year integer not null,
  is_current boolean not null default false,
  created_at timestamptz not null default now()
);

alter table students
  add column if not exists current_semester_id uuid references semesters(id) on delete set null;

create table if not exists courses (
  id text primary key,
  semester_id uuid references semesters(id) on delete cascade,
  title text not null,
  professor text,
  color text,
  syllabus text,
  xp integer not null default 0,
  completion_rate integer not null default 0,
  missions_completed integer not null default 0,
  quests_completed integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists materials (
  id text primary key,
  course_id text references courses(id) on delete cascade,
  type text not null check (type in ('syllabus', 'lecture_notes', 'transcript', 'study_guide', 'assignment')),
  title text not null,
  raw_text text not null,
  storage_path text,
  uploaded_at timestamptz not null default now()
);

create table if not exists study_quests (
  id text primary key,
  course_id text references courses(id) on delete cascade,
  material_id text references materials(id) on delete cascade,
  topic text not null,
  summary text not null,
  cards jsonb not null default '[]'::jsonb,
  quiz jsonb not null default '[]'::jsonb,
  missions jsonb not null default '[]'::jsonb,
  badge text,
  xp integer not null default 0,
  completed boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists earned_badges (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references students(id) on delete cascade,
  course_id text references courses(id) on delete cascade,
  label text not null,
  description text,
  earned_at timestamptz not null default now()
);
