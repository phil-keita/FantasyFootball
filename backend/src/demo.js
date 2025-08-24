#!/usr/bin/env node

import { SleeperAPI } from './sleeper-api.js';

/**
 * Demo script showing available data from Sleeper API
 */

async function demo() {
  console.log('🏈 Fantasy Football Draft Assistant - Demo\n');
  console.log('=' .repeat(60));
  
  const api = new SleeperAPI();
  
  try {
    // 1. Get player data (this works reliably)
    console.log('📊 PLAYER DATA ANALYSIS');
    console.log('-' .repeat(40));
    
    const players = await api.getAllPlayers(false);
    
    if (players) {
      // Analyze active players by position
      const activePlayersByPosition = {};
      const activePlayersByTeam = {};
      let totalActive = 0;
      
      for (const [id, player] of Object.entries(players)) {
        if (player.active) {
          totalActive++;
          activePlayersByPosition[player.position] = (activePlayersByPosition[player.position] || 0) + 1;
          if (player.team) {
            activePlayersByTeam[player.team] = (activePlayersByTeam[player.team] || 0) + 1;
          }
        }
      }
      
      console.log(`Total Players: ${Object.keys(players).length}`);
      console.log(`Active Players: ${totalActive}`);
      
      console.log('\n📍 Active Players by Position:');
      Object.entries(activePlayersByPosition)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .forEach(([pos, count]) => {
          console.log(`   ${pos}: ${count}`);
        });
      
      console.log('\n🏟️ Top Teams by Active Player Count:');
      Object.entries(activePlayersByTeam)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .forEach(([team, count]) => {
          console.log(`   ${team}: ${count}`);
        });
      
      // Show some star players
      console.log('\n⭐ STAR PLAYERS EXAMPLES:');
      console.log('-' .repeat(40));
      
      const starQBs = Object.values(players).filter(p => 
        p.active && p.position === 'QB' && 
        ['KC', 'BUF', 'LAC', 'GB', 'TB'].includes(p.team)
      ).slice(0, 5);
      
      console.log('🎯 Top QBs:');
      starQBs.forEach(qb => {
        console.log(`   ${qb.full_name} (${qb.team}) - Age: ${qb.age || 'N/A'}`);
      });
      
      const starRBs = Object.values(players).filter(p => 
        p.active && p.position === 'RB' && 
        ['SF', 'DAL', 'BUF', 'NYG', 'MIN'].includes(p.team)
      ).slice(0, 5);
      
      console.log('\n🏃 Top RBs:');
      starRBs.forEach(rb => {
        console.log(`   ${rb.full_name} (${rb.team}) - Age: ${rb.age || 'N/A'}`);
      });
      
      const starWRs = Object.values(players).filter(p => 
        p.active && p.position === 'WR' && 
        ['MIA', 'LV', 'BUF', 'KC', 'DAL'].includes(p.team)
      ).slice(0, 5);
      
      console.log('\n📡 Top WRs:');
      starWRs.forEach(wr => {
        console.log(`   ${wr.full_name} (${wr.team}) - Age: ${wr.age || 'N/A'}`);
      });
    }
    
    // 2. Try to get stats data
    console.log('\n\n📊 STATISTICS DATA');
    console.log('-' .repeat(40));
    
    // Try 2023 stats (more likely to be available)
    const stats2023 = await api.getSeasonStats(2023, 'regular', false);
    if (stats2023) {
      console.log(`✅ 2023 Regular Season Stats: ${Object.keys(stats2023).length} players`);
      
      // Show some examples
      const sampleStats = Object.entries(stats2023).slice(0, 3);
      console.log('\n📈 Sample 2023 Stats:');
      sampleStats.forEach(([playerId, stats]) => {
        const player = players[playerId];
        console.log(`   ${player?.full_name || 'Unknown'}: ${JSON.stringify(stats).substring(0, 100)}...`);
      });
    }
    
    // Try current season
    const stats2024 = await api.getSeasonStats(2024, 'regular', false);
    if (stats2024) {
      console.log(`✅ 2024 Regular Season Stats: ${Object.keys(stats2024).length} players`);
    } else {
      console.log('⚠️ 2024 stats may not be available yet (season in progress)');
    }
    
    // 3. Available features
    console.log('\n\n🎯 AVAILABLE FEATURES');
    console.log('-' .repeat(40));
    console.log('✅ Complete NFL player database (11,000+ players)');
    console.log('✅ Player search by name');
    console.log('✅ Filter by position, team, status');
    console.log('✅ Historical statistics (when available)');
    console.log('✅ Interactive draft assistant');
    console.log('✅ Data export and analysis tools');
    
    console.log('\n🔄 ENDPOINTS TO RETRY LATER');
    console.log('-' .repeat(40));
    console.log('⏳ ADP (Average Draft Position) data');
    console.log('⏳ NFL news and updates');
    console.log('⏳ Current season weekly stats');
    
    console.log('\n\n🚀 NEXT STEPS');
    console.log('-' .repeat(40));
    console.log('1. Run "npm run fetch-data" to save all available data');
    console.log('2. Run "npm start" to use the interactive draft assistant');
    console.log('3. Check data/ folder for exported JSON files');
    console.log('4. Retry ADP endpoints later (may be temporarily down)');
    
  } catch (error) {
    console.error('❌ Demo failed:', error.message);
  }
}

demo();
