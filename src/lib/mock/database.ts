// Bază de date mock complet pentru platforma Swaply România

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  bio: string;
  rating: number;
  total_swaps: number;
  successful_swaps: number;
  location: string;
  preferences: string[];
  joined_date: string;
  last_active: string;
  verified: boolean;
  premium: boolean;
}

export interface SwapObject {
  id: string;
  title: string;
  description: string;
  category: string;
  subcategory: string;
  condition: 'nou' | 'ca_nou' | 'bun' | 'uzat';
  images: string[];
  user_id: string;
  location: string;
  coordinates: { lat: number; lng: number };
  created_at: string;
  updated_at: string;
  interested_count: number;
  views_count: number;
  tags: string[];
  estimated_value: number;
  available: boolean;
  swap_preferences: string[];
}

export interface SwapRequest {
  id: string;
  requester_id: string;
  owner_id: string;
  object_offered_id: string;
  object_requested_id: string;
  status: 'pending' | 'accepted' | 'declined' | 'completed' | 'cancelled';
  message: string;
  created_at: string;
  updated_at: string;
  meeting_location?: string;
  meeting_date?: string;
  completion_date?: string;
  rating_given?: number;
  rating_received?: number;
}

export interface ChatMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  message: string;
  timestamp: string;
  message_type: 'text' | 'image' | 'system';
  read: boolean;
}

// Locații principale din România cu coordonate
export const ROMANIAN_LOCATIONS = [
  { name: 'București, Sector 1', lat: 44.4394, lng: 26.0961 },
  { name: 'București, Sector 2', lat: 44.4528, lng: 26.1196 },
  { name: 'București, Sector 3', lat: 44.4315, lng: 26.1336 },
  { name: 'Cluj-Napoca', lat: 46.7712, lng: 23.6236 },
  { name: 'Timișoara', lat: 45.7489, lng: 21.2087 },
  { name: 'Iași', lat: 47.1585, lng: 27.6014 },
  { name: 'Constanța', lat: 44.1598, lng: 28.6348 },
  { name: 'Craiova', lat: 44.3302, lng: 23.7949 },
  { name: 'Brașov', lat: 45.6427, lng: 25.5887 },
  { name: 'Galați', lat: 45.4353, lng: 28.0080 },
  { name: 'Ploiești', lat: 44.9403, lng: 26.0250 },
  { name: 'Oradea', lat: 47.0722, lng: 21.9022 },
  { name: 'Brăila', lat: 45.2692, lng: 27.9574 },
  { name: 'Arad', lat: 46.1866, lng: 21.3123 },
  { name: 'Pitești', lat: 44.8565, lng: 24.8692 },
  { name: 'Sibiu', lat: 45.7983, lng: 24.1256 },
  { name: 'Bacău', lat: 46.5670, lng: 26.9146 },
  { name: 'Târgu Mureș', lat: 46.5427, lng: 24.5577 },
  { name: 'Baia Mare', lat: 47.6567, lng: 23.5781 },
  { name: 'Buzău', lat: 45.1500, lng: 26.8333 },
];

// Categorii și subcategorii de obiecte
export const CATEGORIES = {
  'Electronice': ['Telefoane', 'Laptop-uri', 'Tablete', 'Accesorii', 'Audio', 'Gaming'],
  'Gaming': ['Console', 'Jocuri', 'Accesorii Gaming', 'PC Gaming', 'Retro Gaming'],
  'Sport': ['Fitness', 'Fotbal', 'Baschet', 'Tenis', 'Biciclete', 'Sporturi de Iarnă'],
  'Foto/Video': ['Camere Foto', 'Video', 'Obiective', 'Accesorii', 'Drone'],
  'Automobile': ['Piese Auto', 'Accesorii', 'Audio Auto', 'Tuning'],
  'Fashion': ['Haine', 'Încălțăminte', 'Accesorii', 'Ceasuri', 'Bijuterii'],
  'Cărți': ['Ficțiune', 'Non-ficțiune', 'Educaționale', 'Copii', 'Benzi Desenate'],
  'Casa & Grădina': ['Mobilier', 'Decorațiuni', 'Electrocasnice', 'Grădinărit'],
  'Hobby': ['Artă', 'Muzică', 'Colecții', 'DIY', 'Crafting'],
  'Altele': ['Diverse', 'Vintage', 'Handmade', 'Servicii']
};

// Mock utilizatori din România
export const MOCK_USERS: User[] = [
  {
    id: 'user_1',
    name: 'Ana-Maria Popescu',
    email: 'ana.popescu@email.com',
    avatar: 'AP',
    bio: 'Pasionată de tech și design. Îmi place să fac schimburi pentru a găsi gadget-uri noi.',
    rating: 4.9,
    total_swaps: 23,
    successful_swaps: 22,
    location: 'București, Sector 1',
    preferences: ['Electronice', 'Fashion', 'Foto/Video'],
    joined_date: '2024-01-15T10:00:00Z',
    last_active: '2024-10-08T14:30:00Z',
    verified: true,
    premium: true
  },
  {
    id: 'user_2',
    name: 'Mihai Ionescu',
    email: 'mihai.ionescu@email.com',
    avatar: 'MI',
    bio: 'Developer și gamer. Mereu în căutarea unor piese noi pentru setup-ul meu.',
    rating: 4.7,
    total_swaps: 18,
    successful_swaps: 17,
    location: 'Cluj-Napoca',
    preferences: ['Gaming', 'Electronice', 'Tech'],
    joined_date: '2024-02-20T09:15:00Z',
    last_active: '2024-10-08T11:45:00Z',
    verified: true,
    premium: false
  },
  {
    id: 'user_3',
    name: 'Elena Georgescu',
    email: 'elena.georgescu@email.com',
    avatar: 'EG',
    bio: 'Fotograf freelancer din Timișoara. Schimb des echipament foto.',
    rating: 4.8,
    total_swaps: 31,
    successful_swaps: 29,
    location: 'Timișoara',
    preferences: ['Foto/Video', 'Art', 'Travel'],
    joined_date: '2023-11-10T16:20:00Z',
    last_active: '2024-10-08T13:15:00Z',
    verified: true,
    premium: true
  },
  {
    id: 'user_4',
    name: 'Radu Munteanu',
    email: 'radu.munteanu@email.com',
    avatar: 'RM',
    bio: 'Sportiv și antreprenor. Îmi place să încerc echipamente sportive noi.',
    rating: 4.6,
    total_swaps: 14,
    successful_swaps: 13,
    location: 'Brașov',
    preferences: ['Sport', 'Fitness', 'Outdoor'],
    joined_date: '2024-03-05T12:00:00Z',
    last_active: '2024-10-08T10:20:00Z',
    verified: true,
    premium: false
  },
  {
    id: 'user_5',
    name: 'Ioana Vasile',
    email: 'ioana.vasile@email.com',
    avatar: 'IV',
    bio: 'Designer de interior cu pasiune pentru vintage și handmade.',
    rating: 4.9,
    total_swaps: 27,
    successful_swaps: 26,
    location: 'Iași',
    preferences: ['Casa & Grădina', 'Vintage', 'Art'],
    joined_date: '2023-12-01T14:30:00Z',
    last_active: '2024-10-08T15:45:00Z',
    verified: true,
    premium: true
  },
  {
    id: 'user_6',
    name: 'Alexandru Dumitrescu',
    email: 'alex.dumitrescu@email.com',
    avatar: 'AD',
    bio: 'Colecționar de cărți și board games. Mereu în căutarea de rarități.',
    rating: 4.5,
    total_swaps: 19,
    successful_swaps: 18,
    location: 'Constanța',
    preferences: ['Cărți', 'Gaming', 'Colecții'],
    joined_date: '2024-01-30T11:15:00Z',
    last_active: '2024-10-08T12:30:00Z',
    verified: false,
    premium: false
  },
  {
    id: 'user_7',
    name: 'Carmen Stoica',
    email: 'carmen.stoica@email.com',
    avatar: 'CS',
    bio: 'Mama activă cu doi copii. Schimb des jucării și cărți pentru copii.',
    rating: 4.8,
    total_swaps: 35,
    successful_swaps: 34,
    location: 'Ploiești',
    preferences: ['Copii', 'Educaționale', 'Familie'],
    joined_date: '2023-09-15T10:45:00Z',
    last_active: '2024-10-08T16:20:00Z',
    verified: true,
    premium: false
  },
  {
    id: 'user_8',
    name: 'Bogdan Popa',
    email: 'bogdan.popa@email.com',
    avatar: 'BP',
    bio: 'Muzician și producer. Colecționez instrumente și echipament audio.',
    rating: 4.7,
    total_swaps: 22,
    successful_swaps: 21,
    location: 'Sibiu',
    preferences: ['Muzică', 'Audio', 'Vintage'],
    joined_date: '2024-02-10T13:00:00Z',
    last_active: '2024-10-08T09:15:00Z',
    verified: true,
    premium: true
  }
];

// Mock obiecte cu varietate mare
export const MOCK_OBJECTS: SwapObject[] = [
  {
    id: 'obj_1',
    title: 'iPhone 15 Pro Max 256GB Space Black',
    description: 'iPhone 15 Pro Max în stare perfectă, folosit 6 luni. Include toate accesoriile originale, cutia, căști și documentele. Fără zgârieturi, garanție până în septembrie 2025.',
    category: 'Electronice',
    subcategory: 'Telefoane',
    condition: 'ca_nou',
    images: [
      'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=400',
      'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400'
    ],
    user_id: 'user_1',
    location: 'București, Sector 1',
    coordinates: { lat: 44.4394, lng: 26.0961 },
    created_at: '2024-10-05T10:30:00Z',
    updated_at: '2024-10-05T10:30:00Z',
    interested_count: 15,
    views_count: 234,
    tags: ['apple', 'iphone', 'flagship', 'camera', 'premium'],
    estimated_value: 5500,
    available: true,
    swap_preferences: ['MacBook', 'iPad Pro', 'Camera foto', 'Console gaming']
  },
  {
    id: 'obj_2',
    title: 'MacBook Pro M3 14" 512GB Silver',
    description: 'MacBook Pro M3 14 inch cu 512GB SSD și 16GB RAM. Folosit pentru dezvoltare software, în stare impecabilă. Include încărcătorul original și geanta de transport.',
    category: 'Electronice',
    subcategory: 'Laptop-uri',
    condition: 'ca_nou',
    images: [
      'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400',
      'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=400'
    ],
    user_id: 'user_2',
    location: 'Cluj-Napoca',
    coordinates: { lat: 46.7712, lng: 23.6236 },
    created_at: '2024-10-04T14:20:00Z',
    updated_at: '2024-10-04T14:20:00Z',
    interested_count: 22,
    views_count: 445,
    tags: ['apple', 'macbook', 'development', 'm3', 'professional'],
    estimated_value: 9500,
    available: true,
    swap_preferences: ['Gaming laptop', 'Desktop PC', 'Monitor 4K', 'Audio equipment']
  },
  {
    id: 'obj_3',
    title: 'Canon EOS R6 Mark II Body',
    description: 'Cameră foto Canon EOS R6 Mark II body-only, folosită profesional dar cu grijă. Include baterie extra, card SD 128GB și geanta de transport profesională.',
    category: 'Foto/Video',
    subcategory: 'Camere Foto',
    condition: 'bun',
    images: [
      'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=400',
      'https://images.unsplash.com/photo-1606983340126-99ab4feaa64a?w=400'
    ],
    user_id: 'user_3',
    location: 'Timișoara',
    coordinates: { lat: 45.7489, lng: 21.2087 },
    created_at: '2024-10-03T09:15:00Z',
    updated_at: '2024-10-03T09:15:00Z',
    interested_count: 8,
    views_count: 167,
    tags: ['canon', 'camera', 'professional', 'photography', 'mirrorless'],
    estimated_value: 11000,
    available: true,
    swap_preferences: ['Obiective Canon RF', 'Laptop pentru editare', 'Drone profesional']
  },
  {
    id: 'obj_4',
    title: 'PlayStation 5 Slim + 5 Jocuri',
    description: 'PlayStation 5 Slim în cutia originală cu 2 controllere DualSense și 5 jocuri fizice: Spider-Man 2, God of War Ragnarök, FIFA 24, Gran Turismo 7, Horizon Forbidden West.',
    category: 'Gaming',
    subcategory: 'Console',
    condition: 'bun',
    images: [
      'https://images.unsplash.com/photo-1607853202273-797f1c22a38e?w=400',
      'https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=400'
    ],
    user_id: 'user_4',
    location: 'Brașov',
    coordinates: { lat: 45.6427, lng: 25.5887 },
    created_at: '2024-10-02T16:45:00Z',
    updated_at: '2024-10-02T16:45:00Z',
    interested_count: 28,
    views_count: 521,
    tags: ['playstation', 'ps5', 'gaming', 'console', 'exclusive games'],
    estimated_value: 3200,
    available: true,
    swap_preferences: ['PC Gaming', 'Nintendo Switch OLED', 'Xbox Series X', 'VR Headset']
  },
  {
    id: 'obj_5',
    title: 'Bicicletă Cube Analog 29" Mărimea L',
    description: 'Bicicletă de munte Cube Analog 29" mărimea L, perfectă pentru trail-uri medii. Recent revizuită, anvelope noi Maxxis, frâne hidraulice Shimano.',
    category: 'Sport',
    subcategory: 'Biciclete',
    condition: 'bun',
    images: [
      'https://images.unsplash.com/photo-1558618047-5c640c3b3d5c?w=400',
      'https://images.unsplash.com/photo-1571068316344-75bc76f77890?w=400'
    ],
    user_id: 'user_4',
    location: 'Brașov',
    coordinates: { lat: 45.6427, lng: 25.5887 },
    created_at: '2024-10-01T11:30:00Z',
    updated_at: '2024-10-01T11:30:00Z',
    interested_count: 12,
    views_count: 189,
    tags: ['bicicleta', 'cube', 'mountain bike', 'trail', '29er'],
    estimated_value: 2800,
    available: true,
    swap_preferences: ['Road bike', 'E-bike', 'Echipament ski', 'Kayak']
  },
  {
    id: 'obj_6',
    title: 'Set Mobilier Vintage Scandinav',
    description: 'Set complet mobilier living: canapea 3 locuri, fotoliu, masă de cafea și comodă. Design scandinav vintage anii 70, restaurat profesional.',
    category: 'Casa & Grădina',
    subcategory: 'Mobilier',
    condition: 'ca_nou',
    images: [
      'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400',
      'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400'
    ],
    user_id: 'user_5',
    location: 'Iași',
    coordinates: { lat: 47.1585, lng: 27.6014 },
    created_at: '2024-09-30T13:20:00Z',
    updated_at: '2024-09-30T13:20:00Z',
    interested_count: 6,
    views_count: 134,
    tags: ['mobilier', 'vintage', 'scandinav', 'design', 'living'],
    estimated_value: 4500,
    available: true,
    swap_preferences: ['Mobilier modern', 'Echipament foto', 'Artă contemporană']
  },
  {
    id: 'obj_7',
    title: 'Colecție Benzi Desenate Marvel (200+ volume)',
    description: 'Colecție impresionantă de benzi desenate Marvel în română și engleză. Include serii complete: X-Men, Spider-Man, Avengers. Majoritatea în stare mint.',
    category: 'Cărți',
    subcategory: 'Benzi Desenate',
    condition: 'ca_nou',
    images: [
      'https://images.unsplash.com/photo-1612198188060-c7c2a3b66eae?w=400',
      'https://images.unsplash.com/photo-1621351183012-e2f9972dd9bf?w=400'
    ],
    user_id: 'user_6',
    location: 'Constanța',
    coordinates: { lat: 44.1598, lng: 28.6348 },
    created_at: '2024-09-28T15:45:00Z',
    updated_at: '2024-09-28T15:45:00Z',
    interested_count: 19,
    views_count: 287,
    tags: ['marvel', 'comics', 'colectie', 'benzi desenate', 'rare'],
    estimated_value: 3500,
    available: true,
    swap_preferences: ['Gaming setup', 'Figuri de colecție', 'Board games', 'Tech gadgets']
  },
  {
    id: 'obj_8',
    title: 'Chitară Electrică Fender Stratocaster',
    description: 'Fender Player Stratocaster MIM în Polar White cu pick-up-uri Player Series. Include amplificator Fender Champion 40 și accesorii complete.',
    category: 'Hobby',
    subcategory: 'Muzică',
    condition: 'bun',
    images: [
      'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400',
      'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=400'
    ],
    user_id: 'user_8',
    location: 'Sibiu',
    coordinates: { lat: 45.7983, lng: 24.1256 },
    created_at: '2024-09-25T12:15:00Z',
    updated_at: '2024-09-25T12:15:00Z',
    interested_count: 14,
    views_count: 198,
    tags: ['fender', 'stratocaster', 'guitara', 'muzica', 'amplificator'],
    estimated_value: 4200,
    available: true,
    swap_preferences: ['Bass guitar', 'Keyboard sintezator', 'Audio interface', 'Studio monitors']
  }
];

// Mock cereri de schimb
export const MOCK_SWAP_REQUESTS: SwapRequest[] = [
  {
    id: 'swap_1',
    requester_id: 'user_2',
    owner_id: 'user_1',
    object_offered_id: 'obj_2',
    object_requested_id: 'obj_1',
    status: 'pending',
    message: 'Salut Ana! Sunt foarte interesat de iPhone-ul tău. MacBook-ul meu este perfect pentru development și are specificații excelente. Când ne putem întâlni?',
    created_at: '2024-10-07T10:30:00Z',
    updated_at: '2024-10-07T10:30:00Z'
  },
  {
    id: 'swap_2',
    requester_id: 'user_4',
    owner_id: 'user_2',
    object_offered_id: 'obj_4',
    object_requested_id: 'obj_2',
    status: 'accepted',
    message: 'Perfect! PS5-ul este în stare excelentă și vine cu jocuri grozave. Accepti schimbul?',
    created_at: '2024-10-06T14:20:00Z',
    updated_at: '2024-10-07T09:15:00Z',
    meeting_location: 'Piața Unirii, Cluj-Napoca',
    meeting_date: '2024-10-10T15:00:00Z'
  },
  {
    id: 'swap_3',
    requester_id: 'user_3',
    owner_id: 'user_5',
    object_offered_id: 'obj_3',
    object_requested_id: 'obj_6',
    status: 'completed',
    message: 'Mulțumesc pentru mobilierul superb! Camera foto este acum la tine. A fost o plăcere!',
    created_at: '2024-10-02T11:15:00Z',
    updated_at: '2024-10-05T16:30:00Z',
    completion_date: '2024-10-05T16:30:00Z',
    rating_given: 5,
    rating_received: 5
  }
];

// Funcții helper pentru generarea de date
export function getRandomLocation() {
  return ROMANIAN_LOCATIONS[Math.floor(Math.random() * ROMANIAN_LOCATIONS.length)];
}

export function getRandomUser() {
  return MOCK_USERS[Math.floor(Math.random() * MOCK_USERS.length)];
}

export function getRandomObject() {
  return MOCK_OBJECTS[Math.floor(Math.random() * MOCK_OBJECTS.length)];
}

export function getUserById(id: string) {
  return MOCK_USERS.find(user => user.id === id);
}

export function getObjectById(id: string) {
  return MOCK_OBJECTS.find(obj => obj.id === id);
}

export function getObjectsByUserId(userId: string) {
  return MOCK_OBJECTS.filter(obj => obj.user_id === userId);
}

export function getSwapRequestsByUserId(userId: string) {
  return MOCK_SWAP_REQUESTS.filter(req => 
    req.requester_id === userId || req.owner_id === userId
  );
}

// Date pentru harti și gesturi
export const MAP_SETTINGS = {
  defaultCenter: { lat: 45.9432, lng: 24.9668 }, // Centrul României
  defaultZoom: 6,
  styles: [
    {
      featureType: "administrative",
      elementType: "geometry",
      stylers: [{ visibility: "off" }]
    },
    {
      featureType: "poi",
      stylers: [{ visibility: "off" }]
    }
  ]
};

export const GESTURE_HINTS = [
  '👆 Swipe în sus pentru mai multe detalii',
  '👈 Swipe la stânga pentru a marca ca favorit',
  '👉 Swipe la dreapta pentru a propune schimb',
  '🤏 Pinch pentru zoom pe hartă',
  '👆👆 Double tap pentru preview rapid'
];