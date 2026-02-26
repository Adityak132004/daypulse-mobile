-- Hours of operation for gyms + reviews for listings

alter table public.listings
  add column if not exists hours_of_operation text;

-- Reviews: user writes a review for a listing (e.g. after a visit)
create table if not exists public.reviews (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  listing_id uuid not null references public.listings(id) on delete cascade,
  booking_id uuid references public.bookings(id) on delete set null,
  rating integer not null check (rating >= 1 and rating <= 5),
  comment text,
  created_at timestamptz default now(),
  unique(user_id, listing_id)
);

alter table public.reviews enable row level security;

create policy "Anyone can view reviews"
  on public.reviews for select
  using (true);

create policy "Users can insert own review"
  on public.reviews for insert
  with check (auth.uid() = user_id);

create policy "Users can update own review"
  on public.reviews for update
  using (auth.uid() = user_id);

create index if not exists reviews_listing_id_idx on public.reviews(listing_id);
create index if not exists reviews_user_id_idx on public.reviews(user_id);
