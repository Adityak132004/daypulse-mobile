-- DayPulse: listings, profiles, and bookings tables

-- Enable UUID extension if not already enabled
create extension if not exists "uuid-ossp";

-- ============================================
-- PROFILES
-- Extends auth.users with app-specific fields
-- ============================================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  first_name text,
  last_name text,
  date_of_birth date,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- RLS
alter table public.profiles enable row level security;

create policy "Users can view all profiles"
  on public.profiles for select
  using (true);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Auto-create profile on signup (optional trigger)
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, first_name, last_name, date_of_birth)
  values (
    new.id,
    new.raw_user_meta_data->>'first_name',
    new.raw_user_meta_data->>'last_name',
    (new.raw_user_meta_data->>'date_of_birth')::date
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

-- Drop trigger if exists (for re-running migration)
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================
-- LISTINGS
-- Gym listings for day passes
-- ============================================
create table if not exists public.listings (
  id uuid primary key default uuid_generate_v4(),
  host_id uuid references auth.users(id) on delete set null,
  title text not null,
  location text not null,
  price numeric(10,2) not null check (price >= 0),
  rating numeric(3,2) default 5.00,
  review_count integer default 0,
  image_urls text[] default '{}',
  description text,
  category text default 'Boutique',
  amenities text[] default '{}',
  latitude numeric(10, 7),
  longitude numeric(10, 7),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- RLS
alter table public.listings enable row level security;

create policy "Anyone can view listings"
  on public.listings for select
  using (true);

create policy "Authenticated users can create listings"
  on public.listings for insert
  with check (auth.uid() is not null);

create policy "Users can update own listings"
  on public.listings for update
  using (auth.uid() = host_id);

create policy "Users can delete own listings"
  on public.listings for delete
  using (auth.uid() = host_id);

-- Index for common queries
create index if not exists listings_host_id_idx on public.listings(host_id);
create index if not exists listings_category_idx on public.listings(category);

-- ============================================
-- BOOKINGS
-- Day pass purchases
-- ============================================
create table if not exists public.bookings (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  listing_id uuid not null references public.listings(id) on delete cascade,
  pass_date date not null,
  pass_count integer default 1 check (pass_count > 0),
  status text default 'confirmed' check (status in ('pending', 'confirmed', 'cancelled')),
  created_at timestamptz default now()
);

-- RLS
alter table public.bookings enable row level security;

create policy "Users can view own bookings"
  on public.bookings for select
  using (auth.uid() = user_id);

create policy "Users can create bookings"
  on public.bookings for insert
  with check (auth.uid() = user_id);

create policy "Listing hosts can view bookings for their listings"
  on public.bookings for select
  using (
    exists (
      select 1 from public.listings
      where listings.id = bookings.listing_id
      and listings.host_id = auth.uid()
    )
  );

-- Index
create index if not exists bookings_user_id_idx on public.bookings(user_id);
create index if not exists bookings_listing_id_idx on public.bookings(listing_id);
