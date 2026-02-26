/**
 * Dummy listing data for the Explore screen.
 * Gym listings with daily entry price, rating, reviews, and amenities.
 */

export const LISTING_CATEGORIES = [
  'All',
  '24/7',
  'CrossFit',
  'Yoga',
  'Pool',
  'Boutique',
  'Budget',
] as const;

export type ListingCategory = (typeof LISTING_CATEGORIES)[number];

export type Listing = {
  id: string;
  title: string;
  location: string;
  price: number;
  rating: number;
  reviewCount: number;
  /** @deprecated Use imageUrls[0] for the primary image */
  imageUrl?: string;
  imageUrls: string[];
  description?: string;
  category: ListingCategory;
  amenities: string[];
  distanceFromMe: number;
  /** Gym coordinates for distance calculation */
  latitude?: number | null;
  longitude?: number | null;
  /** e.g. "Open 24/7" or "Mon–Fri 5am–10pm, Sat–Sun 7am–8pm" */
  hoursOfOperation?: string | null;
};

export const DUMMY_LISTINGS: Listing[] = [
  {
    id: '1',
    title: 'Iron Peak Fitness',
    location: 'San Francisco, CA',
    price: 15,
    rating: 4.92,
    reviewCount: 128,
    imageUrls: [
      'https://picsum.photos/seed/gym1a/400/300',
      'https://picsum.photos/seed/gym1b/400/300',
      'https://picsum.photos/seed/gym1c/400/300',
      'https://picsum.photos/seed/gym1d/400/300',
    ],
    description: 'A full-service gym with state-of-the-art equipment, 24/7 access, and expert trainers.',
    category: '24/7',
    amenities: ['24/7 access', 'Free weights', 'Cardio machines', 'Locker rooms', 'Personal training'],
    distanceFromMe: 1.2,
    hoursOfOperation: 'Open 24/7',
  },
  {
    id: '2',
    title: 'Beach Body CrossFit',
    location: 'Miami Beach, FL',
    price: 25,
    rating: 4.88,
    reviewCount: 256,
    imageUrls: [
      'https://picsum.photos/seed/gym2a/400/300',
      'https://picsum.photos/seed/gym2b/400/300',
      'https://picsum.photos/seed/gym2c/400/300',
    ],
    description: 'CrossFit box steps from the beach. High-intensity group classes and open gym hours.',
    category: 'CrossFit',
    amenities: ['CrossFit classes', 'Open gym', 'Showers', 'Equipment rental', 'Competition prep'],
    distanceFromMe: 3.5,
    hoursOfOperation: 'Mon–Fri 5am–9pm, Sat–Sun 7am–6pm',
  },
  {
    id: '3',
    title: 'Zen Flow Yoga & Pilates',
    location: 'Los Angeles, CA',
    price: 20,
    rating: 4.95,
    reviewCount: 89,
    imageUrls: [
      'https://picsum.photos/seed/gym3a/400/300',
      'https://picsum.photos/seed/gym3b/400/300',
      'https://picsum.photos/seed/gym3c/400/300',
      'https://picsum.photos/seed/gym3d/400/300',
    ],
    description: 'Boutique studio specializing in yoga, Pilates, and meditation. Serene space in the Arts District.',
    category: 'Yoga',
    amenities: ['Yoga classes', 'Pilates reformer', 'Meditation room', 'Mats provided', 'Retail'],
    distanceFromMe: 0.8,
    hoursOfOperation: 'Mon–Sat 6am–8pm, Sun 8am–4pm',
  },
  {
    id: '4',
    title: 'Lake Tahoe Sports Club',
    location: 'Lake Tahoe, CA',
    price: 35,
    rating: 4.98,
    reviewCount: 67,
    imageUrls: [
      'https://picsum.photos/seed/gym4a/400/300',
      'https://picsum.photos/seed/gym4b/400/300',
      'https://picsum.photos/seed/gym4c/400/300',
    ],
    description: 'Resort-style gym with indoor pool, spa, and mountain views. Perfect for athletes and families.',
    category: 'Pool',
    amenities: ['Indoor pool', 'Hot tub', 'Sauna', 'Full gym', 'Kids club', 'Café'],
    distanceFromMe: 12.0,
    hoursOfOperation: 'Daily 6am–10pm',
  },
  {
    id: '5',
    title: 'Brooklyn Barbell Club',
    location: 'Brooklyn, NY',
    price: 12,
    rating: 4.85,
    reviewCount: 142,
    imageUrls: [
      'https://picsum.photos/seed/gym5a/400/300',
      'https://picsum.photos/seed/gym5b/400/300',
      'https://picsum.photos/seed/gym5c/400/300',
    ],
    description: 'No-frills strength gym. Powerlifting, Olympic lifting, and strongman equipment. Drop-in friendly.',
    category: 'Budget',
    amenities: ['Squat racks', 'Deadlift platform', 'Strongman implements', 'Chalk', '24/7 key access'],
    distanceFromMe: 2.1,
    hoursOfOperation: '24/7 key fob access',
  },
  {
    id: '6',
    title: 'Cloud Nine Fitness',
    location: 'Austin, TX',
    price: 22,
    rating: 4.91,
    reviewCount: 54,
    imageUrls: [
      'https://picsum.photos/seed/gym6a/400/300',
      'https://picsum.photos/seed/gym6b/400/300',
      'https://picsum.photos/seed/gym6c/400/300',
    ],
    description: 'Boutique fitness with curated classes. Cycling, HIIT, and yoga in a polished, welcoming space.',
    category: 'Boutique',
    amenities: ['Spin classes', 'HIIT', 'Yoga', 'Smoothie bar', 'Locker rooms', 'Towels provided'],
    distanceFromMe: 4.2,
    hoursOfOperation: 'Mon–Fri 6am–8pm, Sat–Sun 8am–4pm',
  },
  {
    id: '7',
    title: 'Sunrise Yoga Studio',
    location: 'San Diego, CA',
    price: 18,
    rating: 4.9,
    reviewCount: 92,
    imageUrls: [
      'https://picsum.photos/seed/gym7a/400/300',
      'https://picsum.photos/seed/gym7b/400/300',
      'https://picsum.photos/seed/gym7c/400/300',
    ],
    description: 'Yoga and mindfulness by the coast. Vinyasa, yin, and restorative classes.',
    category: 'Yoga',
    amenities: ['Yoga classes', 'Meditation', 'Outdoor deck', 'Mats & props', 'Retail'],
    distanceFromMe: 5.7,
    hoursOfOperation: 'Daily 6am–7pm',
  },
  {
    id: '8',
    title: 'Mountain Strong Gym',
    location: 'Aspen, CO',
    price: 30,
    rating: 4.96,
    reviewCount: 78,
    imageUrls: [
      'https://picsum.photos/seed/gym8a/400/300',
      'https://picsum.photos/seed/gym8b/400/300',
      'https://picsum.photos/seed/gym8c/400/300',
      'https://picsum.photos/seed/gym8d/400/300',
    ],
    description: 'CrossFit and functional fitness for outdoor athletes. Ski conditioning and recovery programs.',
    category: 'CrossFit',
    amenities: ['CrossFit', 'Recovery room', 'Outdoor turf', 'PT available', 'Ski prep programs'],
    distanceFromMe: 8.3,
    hoursOfOperation: 'Mon–Sat 5am–9pm, Sun 7am–5pm',
  },
];
