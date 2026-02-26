-- Add phone to profiles (optional)
alter table public.profiles
  add column if not exists phone text;
