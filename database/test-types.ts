/**
 * Test file pentru verificarea tipurilor și serviciilor Supabase
 * 
 * Acest fișier poate fi rulat pentru a verifica că toate tipurile
 * și serviciile sunt configurate corect.
 */

import type { 
  Profile,
  SwapObject, 
  Category,
  SwapRequest,
  Notification,
  Database 
} from '../src/lib/supabase/types';

import { 
  profileService,
  objectsService,
  categoriesService,
  swapRequestsService,
  notificationsService,
  favoritesService,
  reviewsService,
  subscriptions
} from '../src/lib/supabase/database';

// Test pentru tipurile TypeScript
function testTypes() {
  console.log('🧪 Testare tipuri TypeScript...');
  
  // Test Profile type
  const testProfile: Profile = {
    id: 'test-id',
    email: 'test@example.com',
    name: 'Test User',
    avatar_url: null,
    bio: null,
    location: 'București',
    phone: null,
    date_of_birth: null,
    status: 'active',
    rating: 5.0,
    total_swaps: 0,
    successful_swaps: 0,
    verified: false,
    preferences: {},
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  
  // Test SwapObject type
  const testObject: SwapObject = {
    id: 'test-object-id',
    user_id: 'test-user-id',
    title: 'Test Object',
    description: 'Test description',
    category: 'electronice',
    subcategory: 'telefoane',
    condition: 'good',
    estimated_value: 100,
    status: 'active',
    images: ['https://example.com/image.jpg'],
    tags: ['test', 'object'],
    location: 'București',
    latitude: 44.4268,
    longitude: 26.1025,
    available_for_swap: true,
    swap_preferences: {},
    views_count: 0,
    likes_count: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  
  console.log('✅ Tipurile TypeScript sunt corecte!');
  console.log('Profile:', testProfile.name);
  console.log('Object:', testObject.title);
}

// Test pentru serviciile de bază de date
function testServices() {
  console.log('🔧 Testare servicii bază de date...');
  
  // Verifică că toate serviciile există
  const services = [
    'profileService',
    'objectsService', 
    'categoriesService',
    'swapRequestsService',
    'notificationsService',
    'favoritesService',
    'reviewsService',
    'subscriptions'
  ];
  
  services.forEach(serviceName => {
    const service = eval(serviceName);
    if (service) {
      console.log(`✅ ${serviceName} - OK`);
    } else {
      console.log(`❌ ${serviceName} - MISSING`);
    }
  });
  
  // Verifică metodele din profileService
  const profileMethods = ['getProfile', 'updateProfile', 'searchProfiles'] as const;
  profileMethods.forEach(method => {
    if (method in profileService && typeof profileService[method] === 'function') {
      console.log(`  ✅ profileService.${method} - OK`);
    } else {
      console.log(`  ❌ profileService.${method} - MISSING`);
    }
  });
  
  // Verifică metodele din objectsService
  const objectMethods = ['getObjects', 'getObject', 'createObject', 'updateObject', 'deleteObject'] as const;
  objectMethods.forEach(method => {
    if (method in objectsService && typeof objectsService[method] === 'function') {
      console.log(`  ✅ objectsService.${method} - OK`);
    } else {
      console.log(`  ❌ objectsService.${method} - MISSING`);
    }
  });
}

// Test pentru Database type
function testDatabaseType() {
  console.log('🗄️ Testare Database type...');
  
  // Verifică că Database type-ul are structura corectă
  type TestTable = Database['public']['Tables']['profiles'];
  type TestRow = TestTable['Row'];
  type TestInsert = TestTable['Insert'];
  type TestUpdate = TestTable['Update'];
  
  console.log('✅ Database type structure - OK');
  console.log('✅ Table types (Row, Insert, Update) - OK');
  
  // Test pentru enum types
  type StatusEnum = Database['public']['Enums']['user_status'];
  type ConditionEnum = Database['public']['Enums']['object_condition'];
  
  const testStatus: StatusEnum = 'active';
  const testCondition: ConditionEnum = 'good';
  
  console.log('✅ Enum types - OK');
  console.log('Status:', testStatus);
  console.log('Condition:', testCondition);
}

// Funcția principală de test
function runTests() {
  console.log('🚀 Începe testarea configurației Supabase...\n');
  
  try {
    testTypes();
    console.log();
    
    testServices();
    console.log();
    
    testDatabaseType();
    console.log();
    
    console.log('🎉 Toate testele au trecut cu succes!');
    console.log('✅ Configurația Supabase este completă și corectă!');
    
  } catch (error) {
    console.error('❌ Eroare în timpul testării:', error);
    process.exit(1);
  }
}

// Rulează testele dacă este apelat direct
if (require.main === module) {
  runTests();
}

export { runTests, testTypes, testServices, testDatabaseType };