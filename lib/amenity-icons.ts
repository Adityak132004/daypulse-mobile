/**
 * Map amenity text to MaterialIcons name for listing detail.
 * Uses lowercase match so "24/7 access" -> schedule, "Pool" -> pool.
 */
const AMENITY_ICONS: Record<string, string> = {
  '24/7': 'schedule',
  '24/7 access': 'schedule',
  'pool': 'pool',
  'indoor pool': 'pool',
  'wifi': 'wifi',
  'wi-fi': 'wifi',
  'showers': 'shower',
  'locker rooms': 'lock',
  'locker room': 'lock',
  'parking': 'local-parking',
  'free parking': 'local-parking',
  'weights': 'fitness-center',
  'free weights': 'fitness-center',
  'cardio': 'directions-run',
  'cardio machines': 'directions-run',
  'personal training': 'person',
  'pt': 'person',
  'yoga': 'self-improvement',
  'yoga classes': 'self-improvement',
  'pilates': 'self-improvement',
  'crossfit': 'fitness-center',
  'crossfit classes': 'fitness-center',
  'open gym': 'sports-gymnastics',
  'sauna': 'hot-tub',
  'hot tub': 'hot-tub',
  'towel': 'checkroom',
  'towels': 'checkroom',
  'towels provided': 'checkroom',
  'mats': 'grid-on',
  'mats provided': 'grid-on',
  'café': 'restaurant',
  'cafe': 'restaurant',
  'smoothie': 'local-cafe',
  'smoothie bar': 'local-cafe',
  'retail': 'store',
  'meditation': 'self-improvement',
  'meditation room': 'self-improvement',
  'kids': 'child-care',
  'kids club': 'child-care',
  'outdoor': 'outdoor-grill',
  'outdoor deck': 'outdoor-grill',
  'outdoor turf': 'grass',
  'recovery': 'healing',
  'recovery room': 'healing',
  'spin': 'directions-bike',
  'spin classes': 'directions-bike',
  'hiit': 'timer',
  'chalk': 'brush',
  'equipment rental': 'build',
  'strongman': 'fitness-center',
  'squat racks': 'fitness-center',
  'deadlift': 'fitness-center',
};

export function getAmenityIcon(amenity: string): string {
  const key = amenity.toLowerCase().trim();
  if (AMENITY_ICONS[key]) return AMENITY_ICONS[key];
  // Partial match
  for (const [k, icon] of Object.entries(AMENITY_ICONS)) {
    if (key.includes(k) || k.includes(key)) return icon;
  }
  return 'check-circle';
}
