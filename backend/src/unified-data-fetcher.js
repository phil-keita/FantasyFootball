// Unified Data Fetcher for Fantasy Football Draft Assistant
import { DataManager } from './data-manager.js';

/**
 * Unified Data Fetcher for Fantasy Football Draft Assistant
 * Handles data from Sleeper API, FantasyData CSVs, and combines everything
 */

async function main() {
  console.log('🏈 Fantasy Football Draft Assistant - Unified Data Fetcher\n');
  console.log('=' .repeat(70));
  
  const dataManager = new DataManager();
  
  try {
    const args = process.argv.slice(2);
    
    if (args.includes('--help') || args.includes('-h')) {
      showHelp();
      return;
    }
    
    if (args.includes('--sleeper-only')) {
      console.log('🌐 Fetching Sleeper API data only...\n');
      await dataManager.fetchSleeperData();
      
    } else if (args.includes('--csv-only')) {
      console.log('📊 Processing FantasyData CSVs only...\n');
      await dataManager.processFantasyDataCSVs();
      
    } else if (args.includes('--combine-only')) {
      console.log('🔄 Combining existing data only...\n');
      await dataManager.combineAllData();
      
    } else {
      // Full pipeline
      console.log('🚀 Running complete data pipeline...\n');
      await dataManager.executeFullDataPipeline();
    }
    
    // Show final data overview
    await showDataOverview(dataManager);
    
  } catch (error) {
    console.error('\n❌ Data fetch failed:', error.message);
    process.exit(1);
  }
}

async function showDataOverview(dataManager) {
  console.log('\n' + '=' .repeat(70));
  console.log('📊 DATA OVERVIEW');
  console.log('=' .repeat(70));
  
  try {
    // Check what data is available
    const summary = await dataManager.loadData('./data-sources/processed/analysis/data-summary.json');
    
    if (summary) {
      console.log(`📋 Total Players: ${summary.total_players}`);
      console.log(`🔗 Fantasy Data Enriched: ${summary.data_source_coverage.fantasy_data_enriched}`);
      console.log(`🌐 Sleeper Only: ${summary.data_source_coverage.sleeper_only}`);
      console.log(`📈 ADP Available: ${summary.data_source_coverage.adp_available}`);
      console.log(`📊 2024 Stats Available: ${summary.data_source_coverage.stats_2024_available}`);
      
      console.log('\n📍 Top Positions:');
      Object.entries(summary.by_position)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 8)
        .forEach(([pos, count]) => {
          console.log(`   ${pos}: ${count}`);
        });
        
      console.log('\n🏟️ Teams with Most Players:');
      Object.entries(summary.by_team)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 6)
        .forEach(([team, count]) => {
          console.log(`   ${team}: ${count}`);
        });
    }
    
    // Show example players
    console.log('\n⭐ SAMPLE ENRICHED PLAYERS:');
    console.log('-' .repeat(50));
    
    const samplePlayers = await dataManager.searchPlayers('mahomes');
    if (samplePlayers.length > 0) {
      const player = samplePlayers[0];
      console.log(`Name: ${player.name} (${player.position}, ${player.team})`);
      console.log(`Data Sources: ${player.analysis.data_sources.join(', ')}`);
      console.log(`ADP: ${player.adp || 'N/A'}`);
      console.log(`FantasyData Categories: ${Object.keys(player.fantasy_data).join(', ') || 'None'}`);
    }
    
  } catch (error) {
    console.log('⚠️ Could not load data summary');
  }
  
  console.log('\n📁 DATA STRUCTURE:');
  console.log('-' .repeat(50));
  console.log('data-sources/');
  console.log('├── sleeper-api/          # Sleeper API data');
  console.log('│   ├── players/          # Player database');
  console.log('│   ├── adp/              # Average Draft Position');
  console.log('│   ├── stats/            # Player statistics');
  console.log('│   └── leagues/          # League data');
  console.log('├── fantasy-data/         # FantasyData CSV files');
  console.log('└── processed/            # Combined & analyzed data');
  console.log('    ├── combined/         # Unified player profiles');
  console.log('    └── analysis/         # Summary statistics');
  
  console.log('\n🚀 NEXT STEPS:');
  console.log('-' .repeat(50));
  console.log('1. Start backend server: npm run server');
  console.log('2. Use interactive mode: npm start');
  console.log('3. Access via API: http://localhost:3001/api/players');
  console.log('4. Build frontend: npm run setup:frontend');
}

function showHelp() {
  console.log(`
🏈 Fantasy Football Draft Assistant - Unified Data Fetcher

Usage: node unified-data-fetcher.js [options]

Options:
  --help, -h         Show this help message
  --sleeper-only     Fetch only Sleeper API data
  --csv-only         Process only FantasyData CSV files
  --combine-only     Combine existing data sources
  
Default: Run complete data pipeline (all sources)

Data Sources:
  📊 FantasyData CSVs  - Advanced metrics, projections, rankings
  🌐 Sleeper API       - Player database, ADP, statistics
  🔄 Combined Data     - Unified player profiles

Examples:
  node unified-data-fetcher.js                 # Full pipeline
  node unified-data-fetcher.js --sleeper-only  # API data only
  node unified-data-fetcher.js --csv-only      # CSV processing only
  node unified-data-fetcher.js --combine-only  # Merge existing data
  `);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
