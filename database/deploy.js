#!/usr/bin/env node

/**
 * Automated Database Setup Script
 * 
 * Verifica starea database-ului și oferă instrucțiuni pentru setup complet
 * 
 * Rulează cu: node database/deploy.js
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

const databaseDir = path.join(__dirname);

async function deploySQLFiles() {
  console.log('🚀 Începe deployment-ul bazei de date Supabase...\n');
  
  for (const sqlFile of sqlFiles) {
    const filePath = path.join(databaseDir, sqlFile);
    
    if (!fs.existsSync(filePath)) {
      console.error(`❌ Fișierul ${sqlFile} nu există!`);
      process.exit(1);
    }
    
    const content = fs.readFileSync(filePath, 'utf8');
    
    console.log(`📄 Conținutul fișierului ${sqlFile}:`);
    console.log('─'.repeat(50));
    console.log(content);
    console.log('─'.repeat(50));
    console.log();
  }
  
  console.log('✅ Toate fișierele SQL sunt pregătite pentru deployment!');
  console.log();
  console.log('📋 Pașii pentru deployment manual în Supabase:');
  console.log('1. Intră în dashboard-ul Supabase');
  console.log('2. Navighează la SQL Editor');
  console.log('3. Copiază și execută fișierele în această ordine:');
  
  sqlFiles.forEach((file, index) => {
    console.log(`   ${index + 1}. ${file}`);
  });
  
  console.log();
  console.log('🔑 Nu uita să configurezi variabilele de mediu:');
  console.log('   - NEXT_PUBLIC_SUPABASE_URL');
  console.log('   - NEXT_PUBLIC_SUPABASE_ANON_KEY');
}

if (require.main === module) {
  deploySQLFiles().catch(console.error);
}

module.exports = { deploySQLFiles };