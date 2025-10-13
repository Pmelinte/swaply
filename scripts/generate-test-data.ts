/**
 * Generate Test Data with Faker.js
 * Creates realistic seed data for testing and development
 */

import { faker } from '@faker-js/faker/locale/ro';
import { createClient } from '@supabase/supabase-js';

// Configure for Romanian locale
faker.setDefaultRefDate('2024-01-01');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Missing environment variables');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = {
  USERS_COUNT: 5000,
  OBJECTS_PER_USER_AVG: 10,
  ROMANIA_PERCENTAGE: 0.7,
  
  // Romanian cities distribution
  CITIES: [
    { name: 'București', weight: 0.20, region: 'București', lat: 44.4268, lng: 26.1025 },
    { name: 'Cluj-Napoca', weight: 0.10, region: 'Cluj', lat: 46.7712, lng: 23.6236 },
    { name: 'Timișoara', weight: 0.08, region: 'Timiș', lat: 45.7489, lng: 21.2087 },
    { name: 'Iași', weight: 0.08, region: 'Iași', lat: 47.1585, lng: 27.6014 },
    { name: 'Constanța', weight: 0.07, region: 'Constanța', lat: 44.1598, lng: 28.6348 },
    { name: 'Brașov', weight: 0.06, region: 'Brașov', lat: 45.6427, lng: 25.5887 },
    { name: 'Craiova', weight: 0.05, region: 'Dolj', lat: 44.3302, lng: 23.7949 },
    { name: 'Ploiești', weight: 0.04, region: 'Prahova', lat: 44.9389, lng: 26.0229 },
    { name: 'Oradea', weight: 0.04, region: 'Bihor', lat: 47.0465, lng: 21.9189 },
    { name: 'Sibiu', weight: 0.03, region: 'Sibiu', lat: 45.7983, lng: 24.1256 },
    { name: 'Bacău', weight: 0.03, region: 'Bacău', lat: 46.5670, lng: 26.9146 },
    { name: 'Arad', weight: 0.03, region: 'Arad', lat: 46.1866, lng: 21.3123 },
    { name: 'Pitești', weight: 0.02, region: 'Argeș', lat: 44.8565, lng: 24.8692 },
    { name: 'Târgu Mureș', weight: 0.02, region: 'Mureș', lat: 46.5428, lng: 24.5574 },
    { name: 'Baia Mare', weight: 0.02, region: 'Maramureș', lat: 47.6567, lng: 23.5856 },
  ],
  
  // Category distribution
  CATEGORIES: [
    { id: 'electronics', weight: 0.25 },
    { id: 'home', weight: 0.20 },
    { id: 'fashion', weight: 0.15 },
    { id: 'sports', weight: 0.10 },
    { id: 'vehicles', weight: 0.08 },
    { id: 'books', weight: 0.07 },
    { id: 'toys', weight: 0.05 },
    { id: 'tools', weight: 0.05 },
    { id: 'services', weight: 0.03 },
    { id: 'housing', weight: 0.02 },
  ],
  
  // Object status distribution
  STATUS_DISTRIBUTION: {
    available: 0.75,
    swapped: 0.15,
    pending: 0.05,
    deleted: 0.05,
  },
};

// ============================================================================
// WEIGHTED RANDOM
// ============================================================================

function weightedRandom<T extends { weight: number }>(items: T[]): T {
  const total = items.reduce((sum, item) => sum + item.weight, 0);
  let random = Math.random() * total;
  
  for (const item of items) {
    random -= item.weight;
    if (random <= 0) return item;
  }
  
  return items[items.length - 1];
}

// ============================================================================
// USER GENERATION
// ============================================================================

async function generateUsers(count: number) {
  console.log(`Generating ${count} users...`);
  const users = [];
  
  for (let i = 0; i < count; i++) {
    const isRomanian = Math.random() < CONFIG.ROMANIA_PERCENTAGE;
    const city = isRomanian 
      ? weightedRandom(CONFIG.CITIES)
      : { name: faker.location.city(), region: faker.location.state(), lat: parseFloat(faker.location.latitude()), lng: parseFloat(faker.location.longitude()) };
    
    // Add some location noise (±0.05 degrees)
    const lat = city.lat + (Math.random() - 0.5) * 0.1;
    const lng = city.lng + (Math.random() - 0.5) * 0.1;
    
    const user = {
      // Auth handled separately - we'll use email as identifier
      email: faker.internet.email().toLowerCase(),
      full_name: faker.person.fullName(),
      phone: faker.helpers.maybe(() => faker.phone.number('+407########'), { probability: 0.7 }),
      avatar_url: faker.helpers.maybe(() => faker.image.avatar(), { probability: 0.6 }),
      bio: faker.helpers.maybe(() => faker.person.bio(), { probability: 0.4 }),
      
      // Location
      location: city.name,
      address: faker.helpers.maybe(() => faker.location.streetAddress(), { probability: 0.3 }),
      latitude: lat,
      longitude: lng,
      
      // Trust score: normal distribution around 70
      trust_score: Math.max(0, Math.min(100, Math.round(faker.number.float({ min: 40, max: 100, fractionDigits: 1 })))),
      
      // Account status
      account_status: faker.helpers.weightedArrayElement([
        { weight: 0.90, value: 'active' },
        { weight: 0.05, value: 'suspended' },
        { weight: 0.03, value: 'deleted' },
        { weight: 0.02, value: 'pending_verification' },
      ]),
      
      // Role
      role: faker.helpers.weightedArrayElement([
        { weight: 0.97, value: 'user' },
        { weight: 0.025, value: 'moderator' },
        { weight: 0.005, value: 'admin' },
      ]),
      
      // Timestamps: created in last 2 years
      created_at: faker.date.between({ from: '2022-01-01', to: new Date() }).toISOString(),
      last_login_at: faker.date.recent({ days: 30 }).toISOString(),
    };
    
    users.push(user);
    
    if ((i + 1) % 100 === 0) {
      console.log(`  Generated ${i + 1}/${count} users`);
    }
  }
  
  // Insert in batches
  console.log('Inserting users...');
  const BATCH_SIZE = 100;
  for (let i = 0; i < users.length; i += BATCH_SIZE) {
    const batch = users.slice(i, i + BATCH_SIZE);
    const { error } = await supabase.from('users').insert(batch);
    if (error) {
      console.error(`Error inserting batch ${i / BATCH_SIZE}:`, error);
    }
  }
  
  console.log(`✓ Generated ${users.length} users`);
  return users;
}

// ============================================================================
// OBJECT GENERATION
// ============================================================================

// Title templates per category
const TITLE_TEMPLATES = {
  electronics: [
    'Laptop {brand} {model}',
    'Telefon {brand} {model}',
    'Televizor {brand} {size}"',
    'Tableta {brand}',
    'Casti {brand}',
    'Camera foto {brand}',
  ],
  home: [
    '{item} pentru bucătărie',
    'Canapea {style}',
    'Masă {material}',
    'Scaun {type}',
    'Dulap {size}',
  ],
  fashion: [
    'Geacă {brand} mărimea {size}',
    'Pantofi {brand} nr. {size}',
    'Rochie {style}',
    'Geantă {brand}',
    'Ceas {brand}',
  ],
  // Add more as needed
};

async function generateObjects(users: any[], totalCount: number) {
  console.log(`Generating ~${totalCount} objects...`);
  const objects = [];
  
  // Fetch category IDs
  const { data: categories } = await supabase
    .from('categories')
    .select('id, slug');
  
  const categoryMap = new Map(categories?.map(c => [c.slug, c.id]) || []);
  
  for (let i = 0; i < totalCount; i++) {
    const user = faker.helpers.arrayElement(users);
    const category = weightedRandom(CONFIG.CATEGORIES);
    const categoryId = categoryMap.get(category.id);
    
    if (!categoryId) continue;
    
    // Generate title
    const titleTemplate = faker.helpers.arrayElement(
      TITLE_TEMPLATES[category.id as keyof typeof TITLE_TEMPLATES] || ['{item}']
    );
    const title = titleTemplate
      .replace('{brand}', faker.company.name())
      .replace('{model}', faker.commerce.productName())
      .replace('{size}', faker.helpers.arrayElement(['S', 'M', 'L', 'XL', '42', '50"', '65"']))
      .replace('{style}', faker.helpers.arrayElement(['modern', 'clasic', 'vintage', 'minimalist']))
      .replace('{material}', faker.helpers.arrayElement(['lemn', 'metal', 'sticlă', 'plastic']))
      .replace('{type}', faker.helpers.arrayElement(['de birou', 'de bar', 'gaming', 'ergonomic']))
      .replace('{item}', faker.commerce.product());
    
    // Generate description
    const description = faker.helpers.multiple(() => faker.commerce.productDescription(), { count: { min: 1, max: 3 } }).join(' ');
    
    // Value: log-normal distribution
    const estimatedValue = Math.round(Math.exp(faker.number.float({ min: 2, max: 7, fractionDigits: 2 })));
    
    // Images: 1-6 images
    const imageCount = faker.number.int({ min: 1, max: 6 });
    const images = Array.from({ length: imageCount }, () => 
      faker.image.urlLoremFlickr({ category: category.id, width: 800, height: 600 })
    );
    
    // Status
    const status = faker.helpers.weightedArrayElement([
      { weight: 0.75, value: 'available' },
      { weight: 0.15, value: 'swapped' },
      { weight: 0.05, value: 'pending' },
      { weight: 0.05, value: 'deleted' },
    ]);
    
    // Timestamps
    const createdAt = faker.date.between({ 
      from: new Date(user.created_at),
      to: new Date()
    });
    
    const object = {
      user_id: user.id,
      category_id: categoryId,
      title,
      description,
      images,
      estimated_value: estimatedValue,
      currency: 'RON',
      condition: faker.helpers.arrayElement(['new', 'like_new', 'good', 'fair', 'poor']),
      status,
      views_count: faker.number.int({ min: 0, max: 500 }),
      likes_count: faker.number.int({ min: 0, max: 50 }),
      created_at: createdAt.toISOString(),
      updated_at: faker.date.between({ from: createdAt, to: new Date() }).toISOString(),
    };
    
    objects.push(object);
    
    if ((i + 1) % 1000 === 0) {
      console.log(`  Generated ${i + 1}/${totalCount} objects`);
    }
  }
  
  // Insert in batches
  console.log('Inserting objects...');
  const BATCH_SIZE = 100;
  for (let i = 0; i < objects.length; i += BATCH_SIZE) {
    const batch = objects.slice(i, i + BATCH_SIZE);
    const { error } = await supabase.from('objects').insert(batch);
    if (error) {
      console.error(`Error inserting batch ${i / BATCH_SIZE}:`, error);
    }
  }
  
  console.log(`✓ Generated ${objects.length} objects`);
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  console.log('🌱 Generating test data...\n');
  
  const startTime = Date.now();
  
  // Generate users
  const users = await generateUsers(CONFIG.USERS_COUNT);
  
  // Generate objects
  const objectsCount = CONFIG.USERS_COUNT * CONFIG.OBJECTS_PER_USER_AVG;
  await generateObjects(users, objectsCount);
  
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\n✅ Done in ${elapsed}s`);
}

main().catch(console.error);
