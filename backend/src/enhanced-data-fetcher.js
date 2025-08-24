#!/usr/bin/env node

import { EnhancedSleeperAPI } from './enhanced-sleeper-api.js';

/**
 * Enhanced Data Fetcher - Comprehensive Fantasy Football Data Collection
 * Now includes trending data, NFL state, league analysis, and more
 */

async function main() {
  console.log('🏈 ENHANCED Fantasy Football Draft Assistant - Data Fetcher\n');
  console.log('🔥 Now with COMPLETE Sleeper API coverage for maximum draft advantage!');
  console.log('=' .repeat(80));
  
  const api = new EnhancedSleeperAPI();
  
  try {
    // Check data freshness
    console.log('🕐 Checking existing data freshness...\n');
    const freshness = await api.getDataFreshness();
    
    let needsUpdate = false;
    for (const [file, info] of Object.entries(freshness)) {
      if (info.error || !info.is_fresh) {
        needsUpdate = true;
        console.log(`📄 ${file}: ${info.error || `${info.age_hours}h old (needs update)`}`);
      } else {
        console.log(`✅ ${file}: Fresh (${info.age_hours}h old)`);
      }
    }
    
    if (!needsUpdate) {
      console.log('\n✨ All data is fresh! Use --force to update anyway.');
      if (!process.argv.includes('--force')) {
        console.log('Run with --force flag to update anyway, or wait 6+ hours for auto-update.');
        return;
      }
    }
    
    // Comprehensive data fetch
    const results = await api.fetchAllDraftData();
    
    // Generate final summary report
    console.log('\n\n📋 COMPREHENSIVE DATA SUMMARY');
    console.log('=' .repeat(80));
    
    if (results.state) {
      console.log(`🏈 NFL State: Week ${results.state.week} of ${results.state.season} ${results.state.season_type} season`);
      console.log(`📅 Season Start: ${results.state.season_start_date}`);
    }
    
    if (results.analysis?.player_summary) {
      const summary = results.analysis.player_summary;
      console.log(`\n📊 Player Database: ${summary.total_players} total, ${summary.active_players} active`);
      
      console.log('\n📍 Top Positions by Player Count:');
      Object.entries(summary.by_position)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 8)
        .forEach(([pos, count]) => {
          console.log(`   ${pos}: ${count}`);
        });
      
      console.log('\n🏟️ Top Teams by Active Players:');
      Object.entries(summary.by_team)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 8)
        .forEach(([team, count]) => {
          console.log(`   ${team}: ${count}`);
        });
    }
    
    // Show trending insights
    if (results.trending?.adds_24h) {
      console.log('\n🔥 HOT TRENDING ADDS (24h):');
      const players = await api.loadData('./data/players/all_players.json');
      results.trending.adds_24h.slice(0, 5).forEach((trend, i) => {
        const player = players?.data?.[trend.player_id];
        console.log(`   ${i+1}. ${player?.full_name || 'Unknown'} (+${trend.count} adds)`);
      });
    }
    
    if (results.trending?.drops_24h) {
      console.log('\n📉 TRENDING DROPS (24h):');
      const players = await api.loadData('./data/players/all_players.json');
      results.trending.drops_24h.slice(0, 5).forEach((trend, i) => {
        const player = players?.data?.[trend.player_id];
        console.log(`   ${i+1}. ${player?.full_name || 'Unknown'} (${trend.count} drops)`);
      });
    }
    
    // Available features
    console.log('\n\n🎯 ENHANCED FEATURES NOW AVAILABLE:');
    console.log('=' .repeat(80));
    console.log('✅ Complete NFL player database (11,000+ players)');
    console.log('✅ Active player filtering and position analysis');
    console.log('✅ Real-time trending data (adds/drops) - KEY for sleepers!');
    console.log('✅ Current NFL state and week context');
    console.log('✅ Complete season statistics (current + previous year)');
    console.log('✅ Weekly stats breakdown for detailed analysis');
    console.log('✅ Position-specific data organization');
    console.log('✅ Team-based player grouping');
    console.log('✅ Draft analysis framework');
    console.log('✅ Rate limiting and smart caching');
    console.log('✅ Data freshness tracking');
    
    console.log('\n\n🚀 NEXT LEVEL DRAFT TOOLS:');
    console.log('=' .repeat(80));
    console.log('🔍 Enhanced player search with filters');
    console.log('📈 Trending analysis for identifying sleepers/busts');
    console.log('🧠 Ready for LLM integration with rich context');
    console.log('📊 League analysis capabilities');
    console.log('🎯 Draft pattern recognition');
    console.log('⚡ Real-time data updates');
    
    console.log('\n\n📂 DATA ORGANIZATION:');
    console.log('=' .repeat(80));
    console.log('├── players/           # Complete player database + organized views');
    console.log('├── trending/          # Hot adds/drops for sleeper identification');
    console.log('├── stats/             # Season + weekly statistics');
    console.log('├── state/             # Current NFL context');
    console.log('├── analysis/          # Generated insights and recommendations');
    console.log('├── leagues/           # League analysis (when available)');
    console.log('└── transactions/      # Trade and waiver data');
    
    console.log('\n\n✅ ENHANCED DATA COLLECTION COMPLETE!');
    console.log('🎮 Run "npm start" for the interactive draft assistant');
    console.log('🔧 Run "npm run api-server" to start the REST API');
    console.log('🏆 You now have the most comprehensive draft data available!');
    console.log('=' .repeat(80));
    
  } catch (error) {
    console.error('\n❌ Enhanced data fetch failed:', error.message);
    console.error('Check your internet connection and Sleeper API availability.');
    process.exit(1);
  }
}

// Command line arguments
const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
  console.log(`
🏈 Enhanced Fantasy Football Draft Assistant - Data Fetcher

Usage: node enhanced-data-fetcher.js [options]

Options:
  --help, -h          Show this help message
  --force, -f         Force update even if data is fresh
  --trending-only     Fetch only trending data (fast update)
  --stats-only        Fetch only statistics data  
  --players-only      Fetch only player data
  --analyze <id>      Analyze specific league by ID

Examples:
  node enhanced-data-fetcher.js                    # Full comprehensive fetch
  node enhanced-data-fetcher.js --force            # Force complete refresh
  node enhanced-data-fetcher.js --trending-only    # Quick trending update
  node enhanced-data-fetcher.js --analyze 123456   # Analyze specific league
  `);
  process.exit(0);
}

// Handle specific modes
if (args.includes('--trending-only')) {
  console.log('📈 Trending data only mode\n');
  const api = new EnhancedSleeperAPI();
  try {
    await api.getAllTrendingData();
    await api.getNFLState();
    console.log('\n✅ Trending data update complete!');
  } catch (error) {
    console.error('❌ Trending fetch failed:', error.message);
    process.exit(1);
  }
} else if (args.includes('--stats-only')) {
  console.log('📊 Statistics only mode\n');
  const api = new EnhancedSleeperAPI();
  try {
    const state = await api.getNFLState();
    if (state) {
      await api.getEnhancedSeasonStats(state.season, 'regular');
      await api.getAllWeeklyStats(state.season, 'regular');
    }
    console.log('\n✅ Statistics update complete!');
  } catch (error) {
    console.error('❌ Stats fetch failed:', error.message);
    process.exit(1);
  }
} else if (args.includes('--players-only')) {
  console.log('👥 Players only mode\n');
  const api = new EnhancedSleeperAPI();
  try {
    await api.getAllPlayers();
    console.log('\n✅ Player data update complete!');
  } catch (error) {
    console.error('❌ Player fetch failed:', error.message);
    process.exit(1);
  }
} else if (args.includes('--analyze')) {
  const leagueIndex = args.indexOf('--analyze') + 1;
  const leagueId = args[leagueIndex];
  if (!leagueId) {
    console.error('❌ Please provide a league ID after --analyze');
    process.exit(1);
  }
  
  console.log(`🏆 Analyzing league ${leagueId}\n`);
  const api = new EnhancedSleeperAPI();
  try {
    const analysis = await api.analyzeLeague(leagueId);
    if (analysis) {
      console.log(`✅ League analysis complete for: ${analysis.league?.name || 'Unknown League'}`);
      if (analysis.draftAnalysis) {
        console.log(`📊 Draft had ${analysis.draftAnalysis.totalPicks} picks across ${analysis.draftAnalysis.rounds} rounds`);
      }
    }
  } catch (error) {
    console.error('❌ League analysis failed:', error.message);
    process.exit(1);
  }
} else {
  // Full comprehensive fetch
  main();
}
