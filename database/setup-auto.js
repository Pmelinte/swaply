#!/usr/bin/env node

/**
 * Automated Database Setup and Verification Script
 * 
 * Verifica starea database-ului și oferă instrucțiuni pentru setup complet
 * 
 * Rulează cu: node database/setup-auto.js
 */

import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ooebonjoqrpouzfjiiiz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9vZWJvbmpvcXJwb3V6ZmppaWl6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1Nzc3ODEsImV4cCI6MjA3MDE1Mzc4MX0.WKGYWq8DVmm0tJfJMJEYPbZ4Z4Y-RnCxyrI2BOtn80o';

const supabase = createClient(supabaseUrl, supabaseKey);

// Lista fișierelor SQL în ordinea de execuție
const sqlFiles = [
  'schema-complete.sql',
  'rls-policies.sql', 
  'functions-triggers.sql',
  'seed-data.sql'
];

async function setupDatabase() {
  console.log('🚀 Starting automated database setup...\n');
  
  // Step 1: Check current state
  console.log('📊 Current database state:');
  const tables = ['profiles', 'objects', 'categories', 'swap_requests', 'conversations', 'messages', 'notifications', 'reviews'];
  let missingTables = [];
  
  for (const table of tables) {
    try {
      const { error } = await supabase.from(table).select('*').limit(1);
      if (error) throw error;
      console.log(`✅ ${table}: EXISTS`);
    } catch (err) {
      console.log(`❌ ${table}: MISSING`);
      missingTables.push(table);
    }
  }
  
  // Step 2: Read and show SQL files
  console.log('\n📋 SQL Scripts to execute:');
  
  for (const file of sqlFiles) {
    const filePath = `database/${file}`;
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n').length;
      console.log(`📄 ${file}: ${lines} lines`);
    } catch (err) {
      console.log(`❌ ${file}: NOT FOUND`);
    }
  }
  
  if (missingTables.length > 0) {
    console.log('\n⚠️  MANUAL EXECUTION REQUIRED:');
    console.log('🔗 Go to: https://supabase.com/dashboard/project/ooebonjoqrpouzfjiiiz/sql');
    console.log('📝 Execute each SQL file in order in the SQL Editor');
    console.log(`🎯 Missing tables: ${missingTables.join(', ')}`);
  } else {
    console.log('\n✅ All tables exist! Database setup complete.');
  }
  
  // Step 3: Test signup 
  console.log('\n🧪 Testing signup functionality...');
  try {
    const testEmail = `test-${Date.now()}@example.com`;
    const { data, error } = await supabase.auth.signUp({
      email: testEmail,
      password: 'testpass123',
      options: {
        data: {
          name: 'Test User',
          location: 'București'
        }
      }
    });
    
    if (error) {
      console.log('❌ Signup error:', error.message);
      return false;
    } else {
      console.log('✅ Signup working!', testEmail);
      return true;
    }
  } catch (err) {
    console.log('💥 Signup test failed:', err.message);
    return false;
  }
}

setupDatabase();