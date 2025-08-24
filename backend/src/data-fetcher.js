#!/usr/bin/env node

import { SleeperAPI } from './sleeper-api.js';

/**
 * Comprehensive data fetcher for Fantasy Football Draft Assistant
 * Fetches all available data from Sleeper API
 */

async function main() {
  console.log('🏈 Fantasy Football Draft Assistant - Data Fetcher\n');
  console.log('=' .repeat(60));
  
  const api = new SleeperAPI();
  
  try {
    // Fetch all data
    const results = await api.fetchAllData();
    
    // Generate and display summary
    console.log('\n' + '=' .repeat(60));
    console.log('📈 DATA SUMMARY');
    console.log('=' .repeat(60));
    
    const summary = await api.generateSummary();
    if (summary) {
      console.log(`📊 Total Players: ${summary.total_players}`);
      console.log(`✅ Active Players: ${summary.active_players}`);
      console.log(`📈 Players with ADP: ${summary.adp_coverage}`);
      
      console.log('\n📍 Players by Position:');
      Object.entries(summary.by_position)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .forEach(([pos, count]) => {
          console.log(`   ${pos}: ${count}`);
        });
      
      console.log('\n🏟️ Top Teams by Player Count:');
      Object.entries(summary.by_team)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 8)
        .forEach(([team, count]) => {
          console.log(`   ${team}: ${count}`);
        });
    }
    
    // Show some example top players
    console.log('\n🌟 TOP PLAYERS BY POSITION (PPR ADP):');
    console.log('-' .repeat(50));
    
    const positions = ['QB', 'RB', 'WR', 'TE'];
    for (const position of positions) {
      const topPlayers = await api.getTopPlayersByPosition(position, 'ppr', 5);
      if (topPlayers && topPlayers.length > 0) {
        console.log(`\n${position}:`);
        topPlayers.forEach((player, index) => {
          console.log(`  ${index + 1}. ${player.name} (${player.team}) - ADP: ${player.adp?.toFixed(1) || 'N/A'}`);
        });
      }
    }
    
    console.log('\n' + '=' .repeat(60));
    console.log('✅ DATA FETCH COMPLETE!');
    console.log('📂 All data saved to ./data/ directory');
    console.log('🚀 Ready for draft analysis!');
    console.log('=' .repeat(60));
    
  } catch (error) {
    console.error('\n❌ Error during data fetch:', error.message);
    process.exit(1);
  }
}

// Handle command line arguments
const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
  console.log(`
🏈 Fantasy Football Draft Assistant - Data Fetcher

Usage: node data-fetcher.js [options]

Options:
  --help, -h     Show this help message
  --quick, -q    Quick fetch (players + current ADP only)
  --stats, -s    Fetch only statistics data
  --news, -n     Fetch only news data

Examples:
  node data-fetcher.js           # Fetch all data
  node data-fetcher.js --quick   # Quick fetch for fast updates
  node data-fetcher.js --stats   # Update statistics only
  `);
  process.exit(0);
}

if (args.includes('--quick') || args.includes('-q')) {
  console.log('🚀 Quick fetch mode - Players and ADP only\n');
  
  const api = new SleeperAPI();
  try {
    await api.getAllPlayers();
    await api.getADP('ppr');
    await api.getADP('half_ppr');
    console.log('\n✅ Quick fetch complete!');
  } catch (error) {
    console.error('❌ Quick fetch failed:', error.message);
    process.exit(1);
  }
} else if (args.includes('--stats') || args.includes('-s')) {
  console.log('📊 Stats only mode\n');
  
  const api = new SleeperAPI();
  try {
    await api.getSeasonStats(2024, 'regular');
    await api.getSeasonStats(2023, 'regular');
    for (let week = 1; week <= 4; week++) {
      await api.getWeeklyStats(week, 2024, 'regular');
    }
    console.log('\n✅ Stats fetch complete!');
  } catch (error) {
    console.error('❌ Stats fetch failed:', error.message);
    process.exit(1);
  }
} else if (args.includes('--news') || args.includes('-n')) {
  console.log('📰 News only mode\n');
  
  const api = new SleeperAPI();
  try {
    await api.getNFLNews();
    console.log('\n✅ News fetch complete!');
  } catch (error) {
    console.error('❌ News fetch failed:', error.message);
    process.exit(1);
  }
} else {
  // Full fetch
  main();
}
