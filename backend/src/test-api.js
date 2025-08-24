#!/usr/bin/env node

import { SleeperAPI } from './sleeper-api.js';
import { FantasyAnalyzer } from './fantasy-analyzer.js';

/**
 * Quick test script to demonstrate the Sleeper API functionality
 */

async function testAPI() {
  console.log('🏈 Testing Fantasy Football Draft Assistant\n');
  
  const api = new SleeperAPI();
  const analyzer = new FantasyAnalyzer(api);
  
  try {
    // Test 1: Fetch a small sample of players
    console.log('1️⃣ Testing player data fetch...');
    const players = await api.getAllPlayers(false); // Don't save to file for test
    
    if (players) {
      const playerCount = Object.keys(players).length;
      console.log(`✅ Successfully fetched ${playerCount} players`);
      
      // Show a few example players
      const samplePlayers = Object.entries(players).slice(0, 3);
      console.log('\n📋 Sample players:');
      samplePlayers.forEach(([id, player]) => {
        console.log(`   ${player.full_name} (${player.position}, ${player.team})`);
      });
    }
    
    // Test 2: Fetch ADP data
    console.log('\n2️⃣ Testing ADP data fetch...');
    const adp = await api.getADP('ppr', false);
    
    if (adp) {
      const adpCount = Object.keys(adp).length;
      console.log(`✅ Successfully fetched ADP for ${adpCount} players`);
      
      // Show top 3 ADP
      const sortedADP = Object.entries(adp)
        .map(([id, data]) => ({ id, ...data }))
        .sort((a, b) => a.average_position - b.average_position)
        .slice(0, 3);
      
      console.log('\n📈 Top 3 ADP:');
      sortedADP.forEach((player, index) => {
        const playerInfo = players[player.id];
        console.log(`   ${index + 1}. ${playerInfo?.full_name || 'Unknown'} - ADP: ${player.average_position?.toFixed(1)}`);
      });
    }
    
    // Test 3: Test player search
    console.log('\n3️⃣ Testing player search...');
    const testPlayer = await api.findPlayer('mahomes');
    if (testPlayer) {
      console.log(`✅ Found: ${testPlayer.full_name} (${testPlayer.position}, ${testPlayer.team})`);
    }
    
    // Test 4: Test news fetch (might not always work)
    console.log('\n4️⃣ Testing news fetch...');
    try {
      const news = await api.getNFLNews(false);
      if (news && news.length > 0) {
        console.log(`✅ Successfully fetched ${news.length} news articles`);
      } else {
        console.log('⚠️ No news data available or endpoint unavailable');
      }
    } catch (error) {
      console.log('⚠️ News endpoint may not be available:', error.message);
    }
    
    console.log('\n' + '='.repeat(50));
    console.log('✅ API TEST COMPLETED SUCCESSFULLY!');
    console.log('🚀 Ready to fetch full dataset with: npm run fetch-data');
    console.log('🎮 Start interactive mode with: npm start');
    console.log('='.repeat(50));
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error('Please check your internet connection and try again.');
  }
}

testAPI();
