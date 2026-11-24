-- Run ONLY this file in the Supabase SQL Editor; do not run 0001-0003.
-- SmartPrep Migration: 0004_smartprep_schema.sql
-- Standalone, idempotent schema definition matching ROADMAP.md Section 5.

-- Ensure necessary extensions
create extension if not exists "uuid-ossp";
create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Teardown legacy / previous tables, functions, and triggers if re-running
-- ---------------------------------------------------------------------------
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();

drop table if exists public.quiz_attempts cascade;
drop table if exists public.attempts cascade;
drop table if exists public.questions cascade;
drop table if exists public.quizzes cascade;
drop table if exists public.profiles cascade;

-- ---------------------------------------------------------------------------
-- 1. Table: profiles
-- id (uuid PK, references auth.users, cascade), email, display_name, created_at
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 2. Table: quizzes
-- id, user_id (not null, references auth.users), title, module_tag,
-- source_type (pdf | text), difficulty (easy | medium | hard),
-- engine_used (cloud | offline), created_at
-- ---------------------------------------------------------------------------
create table public.quizzes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'Untitled Study Set',
  module_tag text,
  source_type text not null default 'pdf' check (source_type in ('pdf', 'text')),
  difficulty text not null default 'medium' check (difficulty in ('easy', 'medium', 'hard')),
  engine_used text not null default 'cloud' check (engine_used in ('cloud', 'offline')),
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 3. Table: questions
-- id, quiz_id (cascade), user_id (not null), position, question_text,
-- options (jsonb, 4 strings), correct_index (0–3), explanation,
-- ease_factor (default 2.5), interval_days (default 0), repetitions (default 0),
-- next_review_at (default now()), last_reviewed_at
-- ---------------------------------------------------------------------------
create table public.questions (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references public.quizzes(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  position integer not null default 0 check (position >= 0),
  question_text text not null,
  options jsonb not null check (
    jsonb_typeof(options) = 'array' and jsonb_array_length(options) = 4
  ),
  correct_index integer not null check (correct_index between 0 and 3),
  explanation text,
  ease_factor double precision not null default 2.5 check (ease_factor >= 1.3),
  interval_days integer not null default 0 check (interval_days >= 0),
  repetitions integer not null default 0 check (repetitions >= 0),
  next_review_at timestamptz not null default now(),
  last_reviewed_at timestamptz
);

-- ---------------------------------------------------------------------------
-- 4. Table: quiz_attempts
-- id, user_id (not null), quiz_id (cascade), score, total,
-- duration_seconds, answers (jsonb), created_at
-- ---------------------------------------------------------------------------
create table public.quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  quiz_id uuid not null references public.quizzes(id) on delete cascade,
  score integer not null check (score >= 0),
  total integer not null check (total > 0 and score <= total),
  duration_seconds integer check (duration_seconds is null or duration_seconds >= 0),
  answers jsonb,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Indexes (user_id, quiz_id, (user_id, next_review_at), module_tag)
-- ---------------------------------------------------------------------------
create index idx_quizzes_user_id on public.quizzes(user_id);
create index idx_quizzes_module_tag on public.quizzes(module_tag);
create index idx_quizzes_created_at on public.quizzes(user_id, created_at desc);

create index idx_questions_quiz_id on public.questions(quiz_id);
create index idx_questions_user_id on public.questions(user_id);
create index idx_questions_user_next_review on public.questions(user_id, next_review_at);
create index idx_questions_quiz_position on public.questions(quiz_id, position);

create index idx_quiz_attempts_user_id on public.quiz_attempts(user_id);
create index idx_quiz_attempts_quiz_id on public.quiz_attempts(quiz_id);
create index idx_quiz_attempts_user_created on public.quiz_attempts(user_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Auto-create profile on auth.users sign-up trigger
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Row-Level Security (RLS) - Owner-only access, separate CRUD policies, NO anon grants
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.quizzes enable row level security;
alter table public.questions enable row level security;
alter table public.quiz_attempts enable row level security;

-- Profiles: id = auth.uid()
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);

create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

create policy "profiles_delete_own" on public.profiles
  for delete using (auth.uid() = id);

-- Quizzes: user_id = auth.uid()
create policy "quizzes_select_own" on public.quizzes
  for select using (auth.uid() = user_id);

create policy "quizzes_insert_own" on public.quizzes
  for insert with check (auth.uid() = user_id);

create policy "quizzes_update_own" on public.quizzes
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "quizzes_delete_own" on public.quizzes
  for delete using (auth.uid() = user_id);

-- Questions: user_id = auth.uid()
create policy "questions_select_own" on public.questions
  for select using (auth.uid() = user_id);

create policy "questions_insert_own" on public.questions
  for insert with check (
    auth.uid() = user_id
    and exists (
      select 1
      from public.quizzes q
      where q.id = quiz_id
        and q.user_id = auth.uid()
    )
  );

create policy "questions_update_own" on public.questions
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "questions_delete_own" on public.questions
  for delete using (auth.uid() = user_id);

-- Quiz Attempts: user_id = auth.uid()
create policy "quiz_attempts_select_own" on public.quiz_attempts
  for select using (auth.uid() = user_id);

create policy "quiz_attempts_insert_own" on public.quiz_attempts
  for insert with check (
    auth.uid() = user_id
    and exists (
      select 1
      from public.quizzes q
      where q.id = quiz_id
        and q.user_id = auth.uid()
    )
  );

create policy "quiz_attempts_update_own" on public.quiz_attempts
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "quiz_attempts_delete_own" on public.quiz_attempts
  for delete using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Grants: Authenticated role only. NO ANON GRANTS.
-- ---------------------------------------------------------------------------
revoke all on public.profiles from anon;
revoke all on public.quizzes from anon;
revoke all on public.questions from anon;
revoke all on public.quiz_attempts from anon;

grant usage on schema public to authenticated;
grant select, insert, update, delete on public.profiles to authenticated;
grant select, insert, update, delete on public.quizzes to authenticated;
grant select, insert, update, delete on public.questions to authenticated;
grant select, insert, update, delete on public.quiz_attempts to authenticated;
