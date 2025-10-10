#!/usr/bin/env node

/**
 * Script pentru deployment-ul bazei de date Supabase
 * 
 * Acest script execută în ordine fișierele SQL pentru a crea
 * întreaga structură a bazei de date.
 * 
 * Rulează cu: node database/deploy.js
 */

const fs = require('fs');
const path = require('path');

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