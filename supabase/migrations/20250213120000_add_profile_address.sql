-- Add address and city to profiles

alter table public.profiles
  add column if not exists address text,
  add column if not exists city text;

-- Update handle_new_user to include address/city
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, first_name, last_name, date_of_birth, address, city)
  values (
    new.id,
    new.raw_user_meta_data->>'first_name',
    new.raw_user_meta_data->>'last_name',
    (new.raw_user_meta_data->>'date_of_birth')::date,
    new.raw_user_meta_data->>'address',
    new.raw_user_meta_data->>'city'
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;
