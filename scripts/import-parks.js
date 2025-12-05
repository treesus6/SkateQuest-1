#!/usr/bin/env node
/**
 * Import parks from parks.json to Supabase
 * 
 * Usage:
 *   SUPABASE_URL=your-url SUPABASE_KEY=your-key node scripts/import-parks.js
 * 
 * Or create a .env file with:
 *   EXPO_PUBLIC_SUPABASE_URL=your-url
 *   EXPO_PUBLIC_SUPABASE_KEY=your-key
 */

const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Simple Supabase REST API client
class SupabaseClient {
  constructor(url, key) {
    this.url = url;
    this.key = key;
  }

  async insert(table, data) {
    const response = await fetch(`${this.url}/rest/v1/${table}`, {
      method: 'POST',
      headers: {
        'apikey': this.key,
        'Authorization': `Bearer ${this.key}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Supabase error: ${response.status} ${error}`);
    }

    return response;
  }
}

async function importParks() {
  // Get Supabase credentials
  const supabaseUrl = process.env.SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_KEY || process.env.EXPO_PUBLIC_SUPABASE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('Error: Supabase credentials not found!');
    console.error('Please set SUPABASE_URL and SUPABASE_KEY environment variables');
    console.error('Or create a .env file with EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_KEY');
    process.exit(1);
  }

  // Read parks data
  const parksPath = path.join(__dirname, '../data/parks.json');
  console.log(`Reading parks from ${parksPath}...`);
  
  const parksData = JSON.parse(fs.readFileSync(parksPath, 'utf8'));
  console.log(`Found ${parksData.length} parks`);

  // Initialize Supabase client
  const supabase = new SupabaseClient(supabaseUrl, supabaseKey);

  // Import in batches of 100
  const batchSize = 100;
  let imported = 0;
  let errors = 0;

  for (let i = 0; i < parksData.length; i += batchSize) {
    const batch = parksData.slice(i, i + batchSize);
    
    try {
      await supabase.insert('parks', batch);
      imported += batch.length;
      console.log(`Imported ${imported}/${parksData.length} parks...`);
    } catch (error) {
      console.error(`Error importing batch ${i}-${i + batch.length}:`, error.message);
      errors++;
    }
  }

  console.log('\nImport complete!');
  console.log(`Successfully imported: ${imported} parks`);
  if (errors > 0) {
    console.log(`Failed batches: ${errors}`);
  }
}

// Run import
importParks().catch(error => {
  console.error('Import failed:', error);
  process.exit(1);
});
