-- Saved gyms (favorites) per user
create table if not exists public.saved_listings (
  user_id uuid not null references auth.users(id) on delete cascade,
  listing_id uuid not null references public.listings(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (user_id, listing_id)
);

alter table public.saved_listings enable row level security;

create policy "Users can view own saved listings"
  on public.saved_listings for select
  using (auth.uid() = user_id);

create policy "Users can insert own saved listings"
  on public.saved_listings for insert
  with check (auth.uid() = user_id);

create policy "Users can delete own saved listings"
  on public.saved_listings for delete
  using (auth.uid() = user_id);

create index if not exists saved_listings_user_id_idx on public.saved_listings(user_id);
create index if not exists saved_listings_listing_id_idx on public.saved_listings(listing_id);
