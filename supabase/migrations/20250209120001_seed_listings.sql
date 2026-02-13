-- Optional: seed listings with sample gym data
-- Run this after 20250209120000_create_listings_bookings.sql if you want demo data

insert into public.listings (title, location, price, rating, review_count, image_urls, description, category, amenities)
values
  ('Iron Peak Fitness', 'San Francisco, CA', 15, 4.92, 128,
   array['https://picsum.photos/seed/gym1a/400/300','https://picsum.photos/seed/gym1b/400/300','https://picsum.photos/seed/gym1c/400/300','https://picsum.photos/seed/gym1d/400/300'],
   'A full-service gym with state-of-the-art equipment, 24/7 access, and expert trainers.',
   '24/7', array['24/7 access','Free weights','Cardio machines','Locker rooms','Personal training']),
  ('Beach Body CrossFit', 'Miami Beach, FL', 25, 4.88, 256,
   array['https://picsum.photos/seed/gym2a/400/300','https://picsum.photos/seed/gym2b/400/300','https://picsum.photos/seed/gym2c/400/300'],
   'CrossFit box steps from the beach. High-intensity group classes and open gym hours.',
   'CrossFit', array['CrossFit classes','Open gym','Showers','Equipment rental','Competition prep']),
  ('Zen Flow Yoga & Pilates', 'Los Angeles, CA', 20, 4.95, 89,
   array['https://picsum.photos/seed/gym3a/400/300','https://picsum.photos/seed/gym3b/400/300','https://picsum.photos/seed/gym3c/400/300','https://picsum.photos/seed/gym3d/400/300'],
   'Boutique studio specializing in yoga, Pilates, and meditation. Serene space in the Arts District.',
   'Yoga', array['Yoga classes','Pilates reformer','Meditation room','Mats provided','Retail'])
;
