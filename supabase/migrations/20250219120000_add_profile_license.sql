-- Store license image path in Supabase Storage (bucket: licenses, path: {user_id}/license.jpg)
alter table public.profiles
  add column if not exists license_path text;

-- Storage RLS: users can only read/write their own folder in bucket 'licenses'.
-- Create the bucket in Dashboard first: Storage → New bucket → name "licenses", private.

-- Allow users to upload to their own folder only
create policy "Users can upload own license"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'licenses'
  and (storage.foldername(name))[1] = (auth.uid())::text
);

-- Allow users to read their own files
create policy "Users can read own license"
on storage.objects for select
to authenticated
using (
  bucket_id = 'licenses'
  and (storage.foldername(name))[1] = (auth.uid())::text
);

-- Allow users to update/delete their own files (e.g. replace license)
create policy "Users can update own license"
on storage.objects for update
to authenticated
using (
  bucket_id = 'licenses'
  and (storage.foldername(name))[1] = (auth.uid())::text
);

create policy "Users can delete own license"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'licenses'
  and (storage.foldername(name))[1] = (auth.uid())::text
);
