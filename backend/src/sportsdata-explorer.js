import dotenv from 'dotenv';
import { SportsDataIOAPI } from './sportsdata-io-api.js';

// Load environment variables
dotenv.config();

/**
 * SportsData.io API Explorer and Tester
 * Test and explore the SportsData.io API integration
 */

async function testSportsDataAPI() {
  console.log('🧪 Testing SportsData.io API Integration\n');
  
  // Initialize API client
  const sportsDataAPI = new SportsDataIOAPI();
  
  try {
    // Test 1: Basic API connectivity
    console.log('1️⃣ Testing basic API connectivity...');
    const teams = await sportsDataAPI.getTeams();
    if (teams) {
      console.log(`   ✅ Successfully fetched ${teams.length} NFL teams`);
      console.log(`   📝 Example team: ${teams[0].Name} (${teams[0].Key})`);
    }
    
    // Test 2: Player data
    console.log('\n2️⃣ Testing player data...');
    const players = await sportsDataAPI.getPlayers(2024);
    if (players) {
      console.log(`   ✅ Successfully fetched ${players.length} players`);
      const qbs = players.filter(p => p.Position === 'QB');
      console.log(`   🏈 Found ${qbs.length} quarterbacks`);
      if (qbs.length > 0) {
        console.log(`   📝 Example QB: ${qbs[0].FirstName} ${qbs[0].LastName} (${qbs[0].Team})`);
      }
    }
    
    // Test 3: Projections
    console.log('\n3️⃣ Testing fantasy projections...');
    const projections = await sportsDataAPI.getSeasonProjections(2024);
    if (projections) {
      console.log(`   ✅ Successfully fetched projections for ${projections.length} players`);
      const topProjected = projections
        .filter(p => p.FantasyPoints > 0)
        .sort((a, b) => b.FantasyPoints - a.FantasyPoints)
        .slice(0, 5);
      
      console.log('   🏆 Top 5 projected fantasy performers:');
      topProjected.forEach((player, index) => {
        console.log(`      ${index + 1}. ${player.Name} (${player.Position}) - ${player.FantasyPoints.toFixed(1)} pts`);
      });
    }
    
    // Test 4: Injuries
    console.log('\n4️⃣ Testing injury data...');
    const injuries = await sportsDataAPI.getInjuries();
    if (injuries) {
      console.log(`   ✅ Successfully fetched ${injuries.length} injury reports`);
      const activeInjuries = injuries.filter(i => i.Status !== 'Healthy');
      console.log(`   🏥 Found ${activeInjuries.length} players with injury concerns`);
      
      if (activeInjuries.length > 0) {
        console.log('   ⚠️ Recent injury updates:');
        activeInjuries.slice(0, 3).forEach(injury => {
          console.log(`      • ${injury.Name} (${injury.Team}) - ${injury.Status}: ${injury.BodyPart}`);
        });
      }
    }
    
    // Test 5: Player search
    console.log('\n5️⃣ Testing player search...');
    const mahomesMatches = await sportsDataAPI.findPlayer('Mahomes');
    if (mahomesMatches.length > 0) {
      console.log(`   ✅ Found ${mahomesMatches.length} players matching "Mahomes"`);
      console.log(`   📝 ${mahomesMatches[0].FirstName} ${mahomesMatches[0].LastName} - ${mahomesMatches[0].Position} (${mahomesMatches[0].Team})`);
    }
    
    console.log('\n🎉 SportsData.io API integration test completed successfully!');
    console.log('📂 All test data saved to ./data-sources/sportsdata-io/ directory');
    
  } catch (error) {
    console.error('\n❌ SportsData.io API test failed:', error.message);
    
    if (error.message.includes('API key')) {
      console.log('\n💡 Setup Instructions:');
      console.log('1. Sign up for SportsData.io account: https://sportsdata.io/');
      console.log('2. Get your API key from the dashboard');
      console.log('3. Set environment variable: export SPORTSDATA_API_KEY="your-key-here"');
      console.log('4. Or create .env file with: SPORTSDATA_API_KEY=your-key-here');
    }
  }
}

/**
 * Fetch sample data for LLM analysis
 */
async function fetchSampleData() {
  console.log('📊 Fetching sample SportsData.io data for LLM analysis...\n');
  
  const sportsDataAPI = new SportsDataIOAPI();
  
  try {
    // Get essential data for fantasy analysis
    console.log('🏈 Fetching essential fantasy data...');
    
    const [teams, players, projections, stats, injuries] = await Promise.all([
      sportsDataAPI.getTeams(),
      sportsDataAPI.getPlayers(2024),
      sportsDataAPI.getSeasonProjections(2024),
      sportsDataAPI.getPlayerSeasonStats(2024),
      sportsDataAPI.getInjuries()
    ]);
    
    console.log('\n📈 Data Summary:');
    console.log(`   • Teams: ${teams?.length || 0}`);
    console.log(`   • Players: ${players?.length || 0}`);
    console.log(`   • Projections: ${projections?.length || 0}`);
    console.log(`   • Season Stats: ${stats?.length || 0}`);
    console.log(`   • Injury Reports: ${injuries?.length || 0}`);
    
    console.log('\n✅ Sample data fetched successfully!');
    console.log('🤖 Ready for LLM analysis integration');
    
  } catch (error) {
    console.error('❌ Failed to fetch sample data:', error.message);
  }
}

/**
 * Full data fetch for comprehensive analysis
 */
async function fetchComprehensiveData() {
  console.log('🚀 Starting comprehensive SportsData.io data collection...\n');
  
  const sportsDataAPI = new SportsDataIOAPI();
  
  try {
    const results = await sportsDataAPI.fetchAllFantasyData(2024);
    
    console.log('\n📊 Comprehensive Data Collection Complete!');
    console.log('🤖 All data ready for LLM-powered draft analysis');
    
    return results;
    
  } catch (error) {
    console.error('❌ Comprehensive data fetch failed:', error.message);
  }
}

// Export functions for use in other scripts
export { testSportsDataAPI, fetchSampleData, fetchComprehensiveData };

// Run test if script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const command = process.argv[2] || 'test';
  
  switch (command) {
    case 'test':
      await testSportsDataAPI();
      break;
    case 'sample':
      await fetchSampleData();
      break;
    case 'full':
      await fetchComprehensiveData();
      break;
    default:
      console.log('Usage: node sportsdata-explorer.js [test|sample|full]');
  }
}
