#!/usr/bin/env node

import { MultiSourceAnalyzer } from './multi-source-analyzer.js';
import { testSportsDataAPI, fetchSampleData } from './sportsdata-explorer.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Demo script showcasing complete multi-source fantasy football analysis
 * Combines Sleeper API + SportsData.io API + FantasyData CSVs
 */

async function demoMultiSourceAnalysis() {
  console.log('🚀 Multi-Source Fantasy Football Analysis Demo');
  console.log('=' .repeat(60));
  console.log('📊 Data Sources: Sleeper API, SportsData.io API, FantasyData CSVs\n');

  const analyzer = new MultiSourceAnalyzer();

  // Test top fantasy players
  const topPlayers = [
    'Josh Allen',
    'Christian McCaffrey', 
    'Cooper Kupp',
    'Travis Kelce',
    'Stefon Diggs'
  ];

  try {
    console.log('🧪 Step 1: Testing SportsData.io API connection...\n');
    
    // First test the SportsData.io connection
    if (process.env.SPORTSDATA_API_KEY) {
      await testSportsDataAPI();
      console.log('\n📦 Fetching sample data...\n');
      await fetchSampleData();
    } else {
      console.log('⚠️ SPORTSDATA_API_KEY not found. Continuing with Sleeper + FantasyData only...\n');
    }

    console.log('\n🔍 Step 2: Creating comprehensive player profiles...\n');

    // Analyze first player in detail
    const demoPlayer = topPlayers[0];
    console.log(`📋 Creating super profile for ${demoPlayer}...`);
    const profile = await analyzer.createSuperProfile(demoPlayer);
    
    console.log('\n📊 DEMO PROFILE RESULTS:');
    console.log('=' .repeat(40));
    console.log(`Player: ${profile.player_name}`);
    console.log(`Data Completeness: ${profile.analysis.data_quality.completeness_score}%`);
    
    if (profile.data_sources.sleeper) {
      console.log(`✅ Sleeper: ${profile.data_sources.sleeper.full_name} (${profile.data_sources.sleeper.position}, ${profile.data_sources.sleeper.team})`);
    }
    
    if (profile.data_sources.sportsdata?.basic) {
      console.log(`✅ SportsData.io: ${profile.data_sources.sportsdata.basic.FirstName} ${profile.data_sources.sportsdata.basic.LastName}`);
    }
    
    if (profile.data_sources.fantasydata.adp) {
      console.log(`✅ FantasyData: ADP Rank ${profile.data_sources.fantasydata.adp['Overall Rank']}`);
    }

    if (profile.analysis.consensus_projection) {
      console.log(`📈 Projected Points: ${profile.analysis.consensus_projection.average_points.toFixed(1)}`);
    }

    if (profile.analysis.draft_recommendation) {
      console.log(`🎯 Draft Grade: ${profile.analysis.draft_recommendation.overall_grade}`);
      console.log(`📝 Summary: ${profile.analysis.draft_recommendation.llm_summary}`);
    }

    console.log('\n🏆 Step 3: Generating comprehensive draft report...\n');
    
    const report = await analyzer.generateDraftReport(topPlayers.slice(0, 3)); // Analyze first 3 players
    
    console.log('\n📋 DRAFT REPORT SUMMARY:');
    console.log('=' .repeat(40));
    console.log(`Total Players Analyzed: ${report.total_players}`);
    console.log(`Data Sources Used: ${report.data_sources.join(', ')}`);
    
    if (report.summary.top_grades.length > 0) {
      console.log('\n🏆 Top Graded Players:');
      report.summary.top_grades.forEach((player, index) => {
        console.log(`   ${index + 1}. ${player.name} (${player.position}) - Grade: ${player.grade}`);
      });
    }

    if (report.summary.best_values.length > 0) {
      console.log('\n💎 Best Values:');
      report.summary.best_values.forEach((player, index) => {
        console.log(`   ${index + 1}. ${player.name} - ${player.value} (ADP: ${player.adp})`);
      });
    }

    console.log('\n🤖 Step 4: LLM Integration Ready!');
    console.log('=' .repeat(40));
    console.log('✅ Multi-source data collection complete');
    console.log('✅ Comprehensive player profiles generated');
    console.log('✅ Draft recommendations calculated');
    console.log('✅ LLM-ready JSON reports created');
    console.log('\n📁 All data saved in structured format for LLM analysis');
    console.log('🎯 Ready to feed comprehensive player data to your LLM for draft decisions!');

  } catch (error) {
    console.error('\n❌ Demo failed:', error.message);
    console.log('\n💡 Troubleshooting:');
    console.log('1. Check if FantasyData CSV files are in ./data-sources/fantasy-data/');
    console.log('2. Verify SPORTSDATA_API_KEY environment variable');
    console.log('3. Ensure internet connection for API calls');
  }
}

/**
 * Quick test of individual data sources
 */
async function testDataSources() {
  console.log('🧪 Testing Individual Data Sources\n');
  
  const analyzer = new MultiSourceAnalyzer();
  
  try {
    // Test 1: Sleeper API
    console.log('1️⃣ Testing Sleeper API...');
    const sleeperPlayers = await analyzer.sleeperAPI.findPlayer('Mahomes');
    if (sleeperPlayers.length > 0) {
      console.log(`   ✅ Found ${sleeperPlayers[0].full_name} in Sleeper`);
    }

    // Test 2: SportsData.io API
    console.log('\n2️⃣ Testing SportsData.io API...');
    if (process.env.SPORTSDATA_API_KEY) {
      const sportsDataPlayers = await analyzer.sportsDataAPI.findPlayer('Mahomes');
      if (sportsDataPlayers.length > 0) {
        console.log(`   ✅ Found ${sportsDataPlayers[0].FirstName} ${sportsDataPlayers[0].LastName} in SportsData.io`);
      }
    } else {
      console.log('   ⚠️ SportsData.io API key not configured');
    }

    // Test 3: FantasyData CSVs
    console.log('\n3️⃣ Testing FantasyData CSVs...');
    const csvData = await analyzer.loadFantasyDataCSVs();
    if (csvData.adp && csvData.adp.length > 0) {
      console.log(`   ✅ Loaded ${csvData.adp.length} ADP records from CSV`);
    }

    console.log('\n✅ Data source testing complete!');

  } catch (error) {
    console.error('❌ Data source test failed:', error.message);
  }
}

/**
 * Main execution
 */
async function main() {
  const command = process.argv[2] || 'demo';
  
  switch (command) {
    case 'demo':
      await demoMultiSourceAnalysis();
      break;
    case 'test':
      await testDataSources();
      break;
    case 'quick':
      console.log('🚀 Quick Analysis Demo\n');
      const analyzer = new MultiSourceAnalyzer();
      const profile = await analyzer.createSuperProfile('Josh Allen');
      console.log('\n📊 Quick Profile Results:');
      console.log(`Data Quality: ${profile.analysis.data_quality.completeness_score}%`);
      if (profile.analysis.draft_recommendation) {
        console.log(`Grade: ${profile.analysis.draft_recommendation.overall_grade}`);
      }
      break;
    default:
      console.log('Fantasy Football Multi-Source Analyzer');
      console.log('Usage: node multi-source-demo.js [demo|test|quick]');
      console.log('');
      console.log('Commands:');
      console.log('  demo  - Full demonstration of multi-source analysis');
      console.log('  test  - Test individual data source connections');
      console.log('  quick - Quick single player analysis');
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { demoMultiSourceAnalysis, testDataSources };
