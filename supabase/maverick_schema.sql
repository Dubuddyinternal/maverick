-- Maverick (maverick.dubuddy.in) database, for the shared Supabase project.
-- Creates maverick_* tables and functions; the only existing row it changes
-- is the dubuddy "admin" role, which gains the review_maverick permission.
-- Safe to re-run.
--
-- Creators (phone OTP users) can only ever see and add their own rows.
-- The team works in tools.dubuddy.in → the "Maverick Admin" space
-- (team-roadmap/maverick-space.js). Two permissions on the dubuddy team:
--   review_maverick  approve / reject videos, verify published links, enter views
--   pay_maverick     release base pay and bonuses (the payout head)
-- Owners pass both automatically (public.has_perm).
--
-- Life of a video (maverick_submissions.status):
--   in_review → approved → published (creator adds the link) → verified (team checks it)
--             ↘ rejected            ↖ sent back to approved if the link is wrong
--   needs_info is kept for a reviewer question; the creator's reply moves it back to in_review.
-- Base pay and bonus live in maverick_payouts: a pending base row is added when
-- a video is verified, and a row becomes paid when the payout head releases it.

-- ---------------------------------------------------------------- tables

create table if not exists public.maverick_creators (
  id               uuid primary key references auth.users (id) on delete cascade,
  phone            text,
  full_name        text not null,
  email            text,
  youtube_handle   text,
  instagram_handle text,
  upi_id           text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create table if not exists public.maverick_submissions (
  id             uuid primary key default gen_random_uuid(),
  sn             bigint generated always as identity unique,   -- the S. No. the team sees
  creator_id     uuid not null references public.maverick_creators (id) on delete cascade,
  title          text not null,
  platform       text not null default 'instagram' check (platform in ('instagram', 'youtube', 'other')),
  drive_link     text not null,
  status         text not null default 'in_review'
                 check (status in ('in_review', 'needs_info', 'approved', 'rejected', 'published', 'verified')),
  reviewer_note  text,
  creator_reply  text,
  reviewed_by    uuid references auth.users (id),
  reviewed_at    timestamptz,
  published_link text,
  channel_link   text,
  published_at   timestamptz,
  views_30d      integer check (views_30d >= 0),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index if not exists maverick_submissions_creator_idx on public.maverick_submissions (creator_id, created_at desc);
create index if not exists maverick_submissions_status_idx on public.maverick_submissions (status, created_at desc);

create table if not exists public.maverick_payouts (
  id            uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.maverick_submissions (id) on delete cascade,
  creator_id    uuid not null references public.maverick_creators (id) on delete cascade,
  kind          text not null check (kind in ('base', 'bonus')),
  amount        numeric(10, 2) not null check (amount >= 0),
  status        text not null default 'pending' check (status in ('pending', 'paid')),
  due_on        date,
  upi_id        text,
  paid_at       timestamptz,
  paid_by       uuid references auth.users (id),
  created_at    timestamptz not null default now(),
  unique (submission_id, kind)
);
create index if not exists maverick_payouts_creator_idx on public.maverick_payouts (creator_id);

-- ---------------------------------------------------------------- who is on the team side

create or replace function public.maverick_is_reviewer()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.has_perm('dubuddy', 'review_maverick');
$$;

create or replace function public.maverick_can_pay()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.has_perm('dubuddy', 'pay_maverick');
$$;

create or replace function public.maverick_is_staff()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.maverick_is_reviewer() or public.maverick_can_pay();
$$;

-- Give the admin role the review permission (owner passes already).
-- pay_maverick is given to nobody here: an owner ticks it for the payout head's role.
update public.team_roles
   set perms = array_append(perms, 'review_maverick')
 where team_slug = 'dubuddy' and key = 'admin'
   and not ('review_maverick' = any(perms));

-- ---------------------------------------------------------------- guard rails
-- Creators may only: create a submission (always starts in_review), add the
-- published + channel link once approved (moves it to published), and reply
-- when a reviewer asked a question (moves it back to in_review).

create or replace function public.maverick_submissions_guard()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if public.maverick_is_staff() then
    if tg_op = 'UPDATE' and new.status is distinct from old.status then
      new.reviewed_at := now();
      new.reviewed_by := auth.uid();
    end if;
    new.updated_at := now();
    return new;
  end if;

  if tg_op = 'INSERT' then
    new.status := 'in_review';
    new.reviewer_note := null;
    new.creator_reply := null;
    new.reviewed_by := null;
    new.reviewed_at := null;
    new.published_link := null;
    new.channel_link := null;
    new.published_at := null;
    new.views_30d := null;
    new.created_at := now();
    new.updated_at := now();
    return new;
  end if;

  -- UPDATE by the creator: everything is locked except the allowed fields
  new.id := old.id;
  new.creator_id := old.creator_id;
  new.title := old.title;
  new.platform := old.platform;
  new.drive_link := old.drive_link;
  new.status := old.status;
  new.reviewer_note := old.reviewer_note;
  new.reviewed_by := old.reviewed_by;
  new.reviewed_at := old.reviewed_at;
  new.published_at := old.published_at;
  new.views_30d := old.views_30d;
  new.created_at := old.created_at;

  if old.status = 'approved' and new.published_link is not null and old.published_link is null then
    new.status := 'published';
    new.published_at := now();
  else
    new.published_link := old.published_link;
    new.channel_link := old.channel_link;
  end if;

  if old.status = 'needs_info' and new.creator_reply is distinct from old.creator_reply then
    new.status := 'in_review';
  else
    new.creator_reply := old.creator_reply;
  end if;

  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists maverick_submissions_guard on public.maverick_submissions;
create trigger maverick_submissions_guard
  before insert or update on public.maverick_submissions
  for each row execute function public.maverick_submissions_guard();

-- ---------------------------------------------------------------- row level security

alter table public.maverick_creators enable row level security;
alter table public.maverick_submissions enable row level security;
alter table public.maverick_payouts enable row level security;

-- creators
drop policy if exists "maverick: read own profile" on public.maverick_creators;
create policy "maverick: read own profile" on public.maverick_creators
  for select to authenticated using (id = auth.uid() or public.maverick_is_staff());
drop policy if exists "maverick: create own profile" on public.maverick_creators;
create policy "maverick: create own profile" on public.maverick_creators
  for insert to authenticated with check (id = auth.uid());
drop policy if exists "maverick: update own profile" on public.maverick_creators;
create policy "maverick: update own profile" on public.maverick_creators
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

-- submissions
drop policy if exists "maverick: read own submissions" on public.maverick_submissions;
create policy "maverick: read own submissions" on public.maverick_submissions
  for select to authenticated using (creator_id = auth.uid() or public.maverick_is_staff());
drop policy if exists "maverick: add own submissions" on public.maverick_submissions;
create policy "maverick: add own submissions" on public.maverick_submissions
  for insert to authenticated with check (creator_id = auth.uid());
drop policy if exists "maverick: update own or review" on public.maverick_submissions;
create policy "maverick: update own or review" on public.maverick_submissions
  for update to authenticated
  using (creator_id = auth.uid() or public.maverick_is_staff())
  with check (creator_id = auth.uid() or public.maverick_is_staff());

-- payouts: creators read their own. Reviewers may only add a pending row
-- (when they verify a video); only the payout head marks anything paid.
drop policy if exists "maverick: read own payouts" on public.maverick_payouts;
create policy "maverick: read own payouts" on public.maverick_payouts
  for select to authenticated using (creator_id = auth.uid() or public.maverick_is_staff());
drop policy if exists "maverick: reviewers add payouts" on public.maverick_payouts;
create policy "maverick: reviewers add payouts" on public.maverick_payouts
  for insert to authenticated
  with check (public.maverick_can_pay() or (public.maverick_is_reviewer() and status = 'pending'));
drop policy if exists "maverick: reviewers update payouts" on public.maverick_payouts;
create policy "maverick: reviewers update payouts" on public.maverick_payouts
  for update to authenticated using (public.maverick_can_pay()) with check (public.maverick_can_pay());

-- ---------------------------------------------------------------- live updates
-- The admin space refreshes the moment a creator submits a video or adds a
-- published link. Realtime still applies the policies above, so creators only
-- ever hear about their own rows.
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'maverick_submissions') then
      alter publication supabase_realtime add table public.maverick_submissions;
    end if;
    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'maverick_payouts') then
      alter publication supabase_realtime add table public.maverick_payouts;
    end if;
  end if;
end $$;

-- ---------------------------------------------------------------- emails to creators
-- Every email the maverick-mail Edge Function sends (from maverick@dubuddy.in)
-- is logged here; the admin space shows it in its ✉️ Emails tab. Only the
-- function writes (with the service key); the team reads; creators never.
create table if not exists public.maverick_emails (
  id            uuid primary key default gen_random_uuid(),
  submission_id uuid references public.maverick_submissions (id) on delete set null,
  creator_id    uuid references public.maverick_creators (id) on delete set null,
  kind          text not null,
  to_email      text,
  subject       text,
  status        text not null check (status in ('sent', 'failed', 'skipped')),
  error         text,
  sent_by       uuid references auth.users (id),
  created_at    timestamptz not null default now()
);
create index if not exists maverick_emails_created_idx on public.maverick_emails (created_at desc);
create index if not exists maverick_emails_submission_idx on public.maverick_emails (submission_id, kind, created_at desc);
alter table public.maverick_emails enable row level security;
drop policy if exists "maverick: team reads emails" on public.maverick_emails;
create policy "maverick: team reads emails" on public.maverick_emails
  for select to authenticated using (public.maverick_is_staff());
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'maverick_emails') then
    alter publication supabase_realtime add table public.maverick_emails;
  end if;
end $$;
