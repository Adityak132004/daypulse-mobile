/**
 * Dummy listing data for the Explore screen.
 * Structured to mimic Airbnb-style listings with core fields.
 */

export type Listing = {
  id: string;
  title: string;
  location: string;
  price: number;
  rating: number;
  reviewCount: number;
  imageUrl: string;
  type: 'entire' | 'private' | 'shared';
};

export const DUMMY_LISTINGS: Listing[] = [
  {
    id: '1',
    title: 'Cozy Apartment in Downtown',
    location: 'San Francisco, CA',
    price: 145,
    rating: 4.92,
    reviewCount: 128,
    imageUrl: 'https://picsum.photos/seed/list1/400/300',
    type: 'entire',
  },
  {
    id: '2',
    title: 'Beachfront Villa with Ocean View',
    location: 'Miami Beach, FL',
    price: 320,
    rating: 4.88,
    reviewCount: 256,
    imageUrl: 'https://picsum.photos/seed/list2/400/300',
    type: 'entire',
  },
  {
    id: '3',
    title: 'Modern Loft in Arts District',
    location: 'Los Angeles, CA',
    price: 189,
    rating: 4.95,
    reviewCount: 89,
    imageUrl: 'https://picsum.photos/seed/list3/400/300',
    type: 'private',
  },
  {
    id: '4',
    title: 'Treehouse in the Redwoods',
    location: 'Santa Cruz, CA',
    price: 215,
    rating: 4.98,
    reviewCount: 67,
    imageUrl: 'https://picsum.photos/seed/list4/400/300',
    type: 'entire',
  },
  {
    id: '5',
    title: 'Historic Townhouse with Garden',
    location: 'Brooklyn, NY',
    price: 275,
    rating: 4.85,
    reviewCount: 142,
    imageUrl: 'https://picsum.photos/seed/list5/400/300',
    type: 'entire',
  },
  {
    id: '6',
    title: 'Lake House with Private Dock',
    location: 'Lake Tahoe, CA',
    price: 399,
    rating: 4.91,
    reviewCount: 54,
    imageUrl: 'https://picsum.photos/seed/list6/400/300',
    type: 'entire',
  },
];
