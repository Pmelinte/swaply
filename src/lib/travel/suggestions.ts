// Travel Suggestions API Integration
// Generates travel recommendations for long-distance swaps

export interface Location {
  city: string;
  country: string;
  latitude: number;
  longitude: number;
}

export interface TravelSuggestion {
  destination: Location;
  distance_km: number;
  travel_time_hours: number;
  transport_options: TransportOption[];
  accommodations: Accommodation[];
  attractions: Attraction[];
  activities: Activity[];
  cost_estimate: CostEstimate;
  best_time_to_visit: string;
  weather_info: WeatherInfo;
}

export interface TransportOption {
  type: 'plane' | 'train' | 'bus' | 'car';
  provider?: string;
  duration_hours: number;
  price_range: {
    min: number;
    max: number;
    currency: string;
  };
  booking_url?: string;
  pros: string[];
  cons: string[];
}

export interface Accommodation {
  type: 'hotel' | 'airbnb' | 'hostel' | 'apartment';
  name: string;
  rating: number;
  price_per_night: {
    min: number;
    max: number;
    currency: string;
  };
  amenities: string[];
  location_score: number;
  booking_url?: string;
  image_url?: string;
}

export interface Attraction {
  name: string;
  type: 'museum' | 'landmark' | 'nature' | 'entertainment' | 'cultural';
  rating: number;
  description: string;
  estimated_visit_time: string;
  entry_fee?: {
    amount: number;
    currency: string;
  };
  image_url?: string;
  distance_from_center_km: number;
}

export interface Activity {
  name: string;
  category: 'outdoor' | 'cultural' | 'food' | 'shopping' | 'nightlife' | 'adventure';
  description: string;
  duration: string;
  price_range: {
    min: number;
    max: number;
    currency: string;
  };
  best_time: string;
  difficulty_level: 'easy' | 'moderate' | 'hard';
}

export interface CostEstimate {
  transport: { min: number; max: number };
  accommodation: { min: number; max: number };
  food: { min: number; max: number };
  activities: { min: number; max: number };
  total: { min: number; max: number };
  currency: string;
  duration_days: number;
}

export interface WeatherInfo {
  current_season: string;
  temperature_range: { min: number; max: number };
  precipitation: string;
  best_months: string[];
  what_to_pack: string[];
}

/**
 * Generate travel suggestions for a swap between two locations
 */
export async function generateTravelSuggestions(
  location1: string,
  location2: string,
  preferences?: {
    budget_range?: 'low' | 'medium' | 'high';
    interests?: string[];
    travel_style?: 'adventure' | 'relaxed' | 'cultural' | 'romantic';
    duration_days?: number;
  }
): Promise<TravelSuggestion[]> {
  try {
    // Get coordinates for both locations
    const coords1 = await geocodeLocation(location1);
    const coords2 = await geocodeLocation(location2);
    
    // Calculate midpoint for meeting destination
    const midpoint = calculateMidpoint(coords1, coords2);
    
    // Find interesting destinations near midpoint
    const destinations = await findDestinationsNearMidpoint(midpoint, coords1, coords2);
    
    // Generate detailed suggestions for each destination
    const suggestions: TravelSuggestion[] = [];
    
    for (const destination of destinations) {
      const suggestion = await generateDetailedSuggestion(
        destination,
        coords1,
        coords2,
        preferences
      );
      suggestions.push(suggestion);
    }
    
    // Sort by overall attractiveness score
    return suggestions.sort((a, b) => calculateAttractiveness(b) - calculateAttractiveness(a));
    
  } catch (error) {
    console.error('Error generating travel suggestions:', error);
    
    // Return fallback suggestions
    return generateFallbackSuggestions(location1, location2);
  }
}

/**
 * Geocode a location string to coordinates
 */
async function geocodeLocation(location: string): Promise<Location> {
  // In a real implementation, this would use Google Maps Geocoding API or similar
  // For now, return mock data based on known Romanian cities
  
  const mockCoordinates: Record<string, Location> = {
    'bucuresti': { city: 'București', country: 'România', latitude: 44.4268, longitude: 26.1025 },
    'cluj': { city: 'Cluj-Napoca', country: 'România', latitude: 46.7712, longitude: 23.6236 },
    'timisoara': { city: 'Timișoara', country: 'România', latitude: 45.7489, longitude: 21.2087 },
    'constanta': { city: 'Constanța', country: 'România', latitude: 44.1598, longitude: 28.6348 },
    'brasov': { city: 'Brașov', country: 'România', latitude: 45.6427, longitude: 25.5887 },
    'iasi': { city: 'Iași', country: 'România', latitude: 47.1585, longitude: 27.6014 }
  };
  
  const locationKey = location.toLowerCase().replace(/[^a-z]/g, '');
  
  return mockCoordinates[locationKey] || {
    city: location,
    country: 'România',
    latitude: 45.9432 + Math.random() * 2,
    longitude: 24.9668 + Math.random() * 4
  };
}

/**
 * Calculate midpoint between two coordinates
 */
function calculateMidpoint(loc1: Location, loc2: Location): Location {
  const lat = (loc1.latitude + loc2.latitude) / 2;
  const lng = (loc1.longitude + loc2.longitude) / 2;
  
  return {
    city: 'Midpoint',
    country: 'România',
    latitude: lat,
    longitude: lng
  };
}

/**
 * Find interesting destinations near the midpoint
 */
async function findDestinationsNearMidpoint(
  midpoint: Location,
  loc1: Location,
  loc2: Location
): Promise<Location[]> {
  // Mock destinations in Romania that could be good meeting points
  const romanianDestinations: Location[] = [
    { city: 'Sinaia', country: 'România', latitude: 45.3500, longitude: 25.5500 },
    { city: 'Sighișoara', country: 'România', latitude: 46.2206, longitude: 24.7917 },
    { city: 'Sibiu', country: 'România', latitude: 45.7983, longitude: 24.1256 },
    { city: 'Alba Iulia', country: 'România', latitude: 46.0747, longitude: 23.5747 },
    { city: 'Târgu Mureș', country: 'România', latitude: 46.5427, longitude: 24.5577 },
    { city: 'Oradea', country: 'România', latitude: 47.0465, longitude: 21.9189 },
    { city: 'Deva', country: 'România', latitude: 45.8833, longitude: 22.9000 },
    { city: 'Râmnicu Vâlcea', country: 'România', latitude: 45.1000, longitude: 24.3667 }
  ];
  
  // Filter destinations that are roughly equidistant from both locations
  return romanianDestinations
    .map(dest => ({
      ...dest,
      distanceFromLoc1: calculateDistance(dest, loc1),
      distanceFromLoc2: calculateDistance(dest, loc2)
    }))
    .filter(dest => {
      const maxDistance = Math.max(dest.distanceFromLoc1, dest.distanceFromLoc2);
      const minDistance = Math.min(dest.distanceFromLoc1, dest.distanceFromLoc2);
      return maxDistance / minDistance < 2; // Reasonably equidistant
    })
    .sort((a, b) => {
      const balanceA = Math.abs(a.distanceFromLoc1 - a.distanceFromLoc2);
      const balanceB = Math.abs(b.distanceFromLoc1 - b.distanceFromLoc2);
      return balanceA - balanceB;
    })
    .slice(0, 5)
    .map(({ distanceFromLoc1, distanceFromLoc2, ...dest }) => dest);
}

/**
 * Calculate distance between two coordinates (Haversine formula)
 */
function calculateDistance(loc1: Location, loc2: Location): number {
  const R = 6371; // Earth's radius in km
  const dLat = (loc2.latitude - loc1.latitude) * Math.PI / 180;
  const dLon = (loc2.longitude - loc1.longitude) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(loc1.latitude * Math.PI / 180) * Math.cos(loc2.latitude * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

/**
 * Generate detailed suggestion for a destination
 */
async function generateDetailedSuggestion(
  destination: Location,
  loc1: Location,
  loc2: Location,
  preferences?: any
): Promise<TravelSuggestion> {
  const distance1 = calculateDistance(destination, loc1);
  const distance2 = calculateDistance(destination, loc2);
  const avgDistance = (distance1 + distance2) / 2;
  
  // Mock detailed data - in reality this would come from various APIs
  return {
    destination,
    distance_km: Math.round(avgDistance),
    travel_time_hours: avgDistance / 80, // Assume 80 km/h average speed
    transport_options: generateTransportOptions(destination, avgDistance),
    accommodations: generateAccommodations(destination),
    attractions: generateAttractions(destination),
    activities: generateActivities(destination),
    cost_estimate: generateCostEstimate(avgDistance, preferences?.duration_days || 2),
    best_time_to_visit: getBestTimeToVisit(destination),
    weather_info: getWeatherInfo(destination)
  };
}

/**
 * Generate transport options for a destination
 */
function generateTransportOptions(destination: Location, distance: number): TransportOption[] {
  const options: TransportOption[] = [];
  
  // Car option (always available)
  options.push({
    type: 'car',
    duration_hours: distance / 80,
    price_range: { min: distance * 0.5, max: distance * 0.8, currency: 'RON' },
    pros: ['Flexibilitate maximă', 'Poți transporta bagaje mari'],
    cons: ['Oboseală la volan', 'Costuri parcare și combustibil']
  });
  
  // Train option (for major cities)
  if (['Sinaia', 'Sibiu', 'Alba Iulia', 'Târgu Mureș'].includes(destination.city)) {
    options.push({
      type: 'train',
      provider: 'CFR Călători',
      duration_hours: distance / 60,
      price_range: { min: 25, max: 80, currency: 'RON' },
      pros: ['Relaxant', 'Priveliști frumoase', 'Nu te obosești'],
      cons: ['Program fix', 'Posibile întârzieri']
    });
  }
  
  // Bus option
  options.push({
    type: 'bus',
    provider: 'FlixBus / Atlassib',
    duration_hours: distance / 70,
    price_range: { min: 20, max: 50, currency: 'RON' },
    pros: ['Cea mai economică opțiune', 'Stații în multe orașe'],
    cons: ['Poate fi neconfortabil', 'Trafic încărcat']
  });
  
  return options;
}

/**
 * Generate accommodation options
 */
function generateAccommodations(destination: Location): Accommodation[] {
  const basePrice = destination.city === 'Sinaia' ? 200 : 150;
  
  return [
    {
      type: 'hotel',
      name: `Hotel Central ${destination.city}`,
      rating: 4.2,
      price_per_night: { min: basePrice, max: basePrice + 100, currency: 'RON' },
      amenities: ['WiFi gratuit', 'Parcare', 'Restaurant', 'Room service'],
      location_score: 9,
      image_url: '/hotel-placeholder.jpg'
    },
    {
      type: 'airbnb',
      name: 'Apartament cozy în centru',
      rating: 4.8,
      price_per_night: { min: basePrice - 50, max: basePrice + 50, currency: 'RON' },
      amenities: ['Bucătărie completă', 'WiFi', 'Washing machine', 'Balcon'],
      location_score: 8,
      image_url: '/airbnb-placeholder.jpg'
    },
    {
      type: 'hostel',
      name: 'Youth Hostel',
      rating: 4.0,
      price_per_night: { min: 40, max: 80, currency: 'RON' },
      amenities: ['WiFi gratuit', 'Bucătărie comună', 'Lounge', 'Păstrare bagaje'],
      location_score: 7,
      image_url: '/hostel-placeholder.jpg'
    }
  ];
}

/**
 * Generate attractions for a destination
 */
function generateAttractions(destination: Location): Attraction[] {
  const attractions: Record<string, Attraction[]> = {
    'Sinaia': [
      {
        name: 'Castelul Peleș',
        type: 'landmark',
        rating: 4.8,
        description: 'Castel regal din secolul XIX, arhitectură neo-renascentistă',
        estimated_visit_time: '2-3 ore',
        entry_fee: { amount: 30, currency: 'RON' },
        distance_from_center_km: 2
      },
      {
        name: 'Castelul Pelișor',
        type: 'landmark',
        rating: 4.5,
        description: 'Castel în stil Art Nouveau, reședința Regelui Ferdinand',
        estimated_visit_time: '1-2 ore',
        entry_fee: { amount: 20, currency: 'RON' },
        distance_from_center_km: 2.5
      }
    ],
    'Sibiu': [
      {
        name: 'Centrul Istoric Sibiu',
        type: 'cultural',
        rating: 4.7,
        description: 'Centru medieval cu arhitectură săsească autentică',
        estimated_visit_time: '3-4 ore',
        distance_from_center_km: 0
      },
      {
        name: 'Muzeul ASTRA',
        type: 'museum',
        rating: 4.6,
        description: 'Cel mai mare muzeu în aer liber din România',
        estimated_visit_time: '4-5 ore',
        entry_fee: { amount: 15, currency: 'RON' },
        distance_from_center_km: 10
      }
    ]
  };
  
  return attractions[destination.city] || [
    {
      name: `Centrul Istoric ${destination.city}`,
      type: 'cultural',
      rating: 4.0,
      description: 'Centrul istoric al orașului cu arhitectură tradițională',
      estimated_visit_time: '2-3 ore',
      distance_from_center_km: 0
    }
  ];
}

/**
 * Generate activities for a destination
 */
function generateActivities(destination: Location): Activity[] {
  return [
    {
      name: 'Plimbare în centrul istoric',
      category: 'cultural',
      description: 'Explorează străzile vechi și arhitectura locală',
      duration: '2-3 ore',
      price_range: { min: 0, max: 0, currency: 'RON' },
      best_time: 'Dimineața sau după-amiaza',
      difficulty_level: 'easy'
    },
    {
      name: 'Degustare de specialități locale',
      category: 'food',
      description: 'Încearcă mâncarea tradițională din zonă',
      duration: '1-2 ore',
      price_range: { min: 50, max: 120, currency: 'RON' },
      best_time: 'Prânz sau cină',
      difficulty_level: 'easy'
    },
    {
      name: 'Drumeție în împrejurimi',
      category: 'outdoor',
      description: 'Explorează natura din jurul orașului',
      duration: '3-5 ore',
      price_range: { min: 0, max: 20, currency: 'RON' },
      best_time: 'Dimineața',
      difficulty_level: 'moderate'
    }
  ];
}

/**
 * Generate cost estimate
 */
function generateCostEstimate(distance: number, days: number): CostEstimate {
  const transportCost = { min: distance * 0.5, max: distance * 0.8 };
  const accommodationCost = { min: 100 * days, max: 300 * days };
  const foodCost = { min: 80 * days, max: 150 * days };
  const activitiesCost = { min: 50 * days, max: 200 * days };
  
  return {
    transport: transportCost,
    accommodation: accommodationCost,
    food: foodCost,
    activities: activitiesCost,
    total: {
      min: transportCost.min + accommodationCost.min + foodCost.min + activitiesCost.min,
      max: transportCost.max + accommodationCost.max + foodCost.max + activitiesCost.max
    },
    currency: 'RON',
    duration_days: days
  };
}

/**
 * Get best time to visit
 */
function getBestTimeToVisit(destination: Location): string {
  // Mock data based on Romanian seasons
  return 'Aprilie - Octombrie (vreme plăcută pentru turism)';
}

/**
 * Get weather information
 */
function getWeatherInfo(destination: Location): WeatherInfo {
  return {
    current_season: 'Toamnă',
    temperature_range: { min: 5, max: 15 },
    precipitation: 'Moderat (ploaie ocazională)',
    best_months: ['Mai', 'Iunie', 'Septembrie', 'Octombrie'],
    what_to_pack: ['Jachetă', 'Pantaloni lungi', 'Încălțăminte confortabilă', 'Umbrelă']
  };
}

/**
 * Calculate attractiveness score for sorting
 */
function calculateAttractiveness(suggestion: TravelSuggestion): number {
  let score = 0;
  
  // Prefer shorter distances
  score += Math.max(0, 100 - suggestion.distance_km);
  
  // Prefer destinations with more attractions
  score += suggestion.attractions.length * 10;
  
  // Prefer destinations with higher-rated attractions
  const avgAttractionRating = suggestion.attractions.reduce((sum, attr) => sum + attr.rating, 0) / suggestion.attractions.length;
  score += avgAttractionRating * 20;
  
  // Prefer more affordable options
  const costScore = Math.max(0, 500 - suggestion.cost_estimate.total.min) / 10;
  score += costScore;
  
  return score;
}

/**
 * Generate fallback suggestions when APIs fail
 */
function generateFallbackSuggestions(location1: string, location2: string): TravelSuggestion[] {
  // Return popular Romanian destinations as fallback
  const fallbackDestinations = [
    { city: 'Brașov', country: 'România', latitude: 45.6427, longitude: 25.5887 },
    { city: 'Sibiu', country: 'România', latitude: 45.7983, longitude: 24.1256 },
    { city: 'Sinaia', country: 'România', latitude: 45.3500, longitude: 25.5500 }
  ];
  
  return fallbackDestinations.map(dest => ({
    destination: dest,
    distance_km: 150,
    travel_time_hours: 2.5,
    transport_options: generateTransportOptions(dest, 150),
    accommodations: generateAccommodations(dest),
    attractions: generateAttractions(dest),
    activities: generateActivities(dest),
    cost_estimate: generateCostEstimate(150, 2),
    best_time_to_visit: getBestTimeToVisit(dest),
    weather_info: getWeatherInfo(dest)
  }));
}