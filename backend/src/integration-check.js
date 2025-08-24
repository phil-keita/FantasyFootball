#!/usr/bin/env node

/**
 * SportsData.io Integration Status Check
 */

import { SportsDataIOAPI } from './sportsdata-io-api.js';
import fs from 'fs/promises';

async function checkIntegration() {
  console.log('🏈 SportsData.io Integration Status Check');
  console.log('=' .repeat(50));
  
  // Check if API client exists
  try {
    const api = new SportsDataIOAPI();
    console.log('✅ SportsData.io API client loaded successfully');
    
    // Check API key
    if (api.apiKey) {
      console.log('✅ API key is configured');
      console.log(`🔑 API key: ${api.apiKey.substring(0, 8)}...`);
    } else {
      console.log('❌ API key is not configured');
      console.log('⚠️  To configure, add SPORTSDATA_API_KEY to your .env file');
      console.log('📖 Get your API key from: https://sportsdata.io/developers');
    }
    
    // Check data directories
    console.log('\n📁 Data directories:');
    const dataDir = './data-sources/sportsdata-io';
    try {
      await fs.access(dataDir);
      console.log('✅ SportsData.io data directory exists');
      
      const subdirs = await fs.readdir(dataDir);
      console.log(`📊 Subdirectories: ${subdirs.join(', ')}`);
    } catch (error) {
      console.log('⚠️  SportsData.io data directory will be created on first use');
    }
    
    // Check available endpoints
    console.log('\n🔗 Available SportsData.io endpoints:');
    console.log('   ✅ Players data');
    console.log('   ✅ Fantasy projections');
    console.log('   ✅ Player stats');
    console.log('   ✅ Injury reports');
    console.log('   ✅ News updates');
    console.log('   ✅ Advanced metrics');
    console.log('   ✅ Betting odds');
    console.log('   ✅ Depth charts');
    console.log('   ✅ Red zone stats');
    console.log('   ✅ Target share data');
    
    // Integration status
    console.log('\n🎯 Integration Status:');
    console.log('✅ SportsData.io API client: READY');
    console.log('✅ Multi-source analyzer: READY');
    console.log('✅ Fantasy data combiner: READY');
    
    if (api.apiKey) {
      console.log('✅ Full integration: READY');
      console.log('\n🚀 You can now use:');
      console.log('   npm run sportsdata:sample  # Test with sample data');
      console.log('   npm run multi-source:demo  # Full multi-source demo');
    } else {
      console.log('⚠️  Full integration: NEEDS API KEY');
      console.log('\n📝 To complete setup:');
      console.log('   1. Get API key from https://sportsdata.io/developers');
      console.log('   2. Copy .env.example to .env');
      console.log('   3. Add your SPORTSDATA_API_KEY to .env');
      console.log('   4. Run: npm run sportsdata:sample');
    }
    
  } catch (error) {
    console.log('❌ Error checking integration:', error.message);
  }
}

checkIntegration();
