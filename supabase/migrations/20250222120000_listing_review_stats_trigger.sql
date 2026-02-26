-- Update listing rating and review_count when reviews are inserted, updated, or deleted.

create or replace function public.update_listing_review_stats()
returns trigger as $$
declare
  target_listing_id uuid;
begin
  -- Determine which listing_id to update
  if (tg_op = 'DELETE') then
    target_listing_id := old.listing_id;
  else
    target_listing_id := new.listing_id;
  end if;

  update public.listings
  set
    review_count = (select count(*) from public.reviews where listing_id = target_listing_id),
    rating = coalesce(
      (select round(avg(rating)::numeric, 2) from public.reviews where listing_id = target_listing_id),
      5.00
    )
  where id = target_listing_id;

  return coalesce(new, old);
end;
$$ language plpgsql security definer;

drop trigger if exists on_reviews_change_update_listing_stats on public.reviews;
create trigger on_reviews_change_update_listing_stats
  after insert or update or delete on public.reviews
  for each row execute function public.update_listing_review_stats();
