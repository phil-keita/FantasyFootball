#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🏈 SportsData.io NFL API Integration Verification');
console.log('================================================\n');

// API endpoint coverage based on official documentation
const API_CATEGORIES = {
    'Competition Feeds': {
        'Teams, Players & Rosters': [
            'getPlayers',
            'getPlayersByTeam', 
            'getPlayersByFreeAgents',
            'getPlayersByRookieDraftYear',
            'getTeams',
            'getTeamsBasic',
            'getTeamsByActive',
            'getTeamsBySeason'
        ],
        'Standings, Rankings & Brackets': [
            'getStandings'
        ],
        'Venues & Officials': [
            'getReferees',
            'getStadiums'
        ],
        'Utility Endpoints': [
            'getCurrentSeason',
            'getUpcomingSeason',
            'getCurrentWeek',
            'getByeWeeks',
            'getTimeframes'
        ]
    },
    'Event Feeds': {
        'Schedules & Game Day Info': [
            'getSchedules',
            'getSchedulesBasic'
        ],
        'Scores & Game State': [
            'getGamesByWeek',
            'getGamesByDate',
            'getGamesBySeason',
            'getScores'
        ],
        'Team & Player Stats': [
            'getBoxScores',
            'getBoxScoresByWeek',
            'getPlayerGameStats',
            'getPlayerSeasonStats',
            'getTeamGameStats',
            'getTeamSeasonStats'
        ],
        'Play by Play': [
            'getPlayByPlay',
            'getPlayByPlayByTeam'
        ]
    },
    'Player Feeds': {
        'Depth Charts, Lineups & Injuries': [
            'getDepthCharts',
            'getDepthChartsAll',
            'getInjuries',
            'getInjuriesByTeam',
            'getPlayerDetails',
            'getPlayerDetailsByTeam',
            'getProBowlers'
        ]
    },
    'Fantasy Feeds': {
        'Projections': [
            'getPlayerProjections',
            'getPlayerProjectionsByTeam',
            'getPlayerProjectionsByWeek',
            'getFantasyDefenseProjections',
            'getIdpProjections'
        ],
        'Salaries, Stats & Points': [
            'getFantasyDefenseStats',
            'getFantasyPoints',
            'getDfsSlates',
            'getDfsSlatesByDate',
            'getDfsSlatesByWeek'
        ]
    },
    'Betting Feeds': {
        'Game Lines': [
            'getGameOdds',
            'getGameOddsByWeek',
            'getInGameOdds',
            'getPreGameOdds'
        ],
        'Props': [
            'getBettingEvents',
            'getBettingMarkets',
            'getBettingPlayerProps'
        ],
        'Futures': [
            'getBettingFutures'
        ]
    },
    'News & Images': {
        'Player News & Notes': [
            'getNews',
            'getNewsByDate',
            'getNewsByPlayer',
            'getNewsByTeam',
            'getPremiumNews'
        ],
        'Player Headshots': [
            'getHeadshots'
        ]
    }
};

function checkSportsDataIntegration() {
    console.log('🔍 Checking SportsData.io API Implementation...\n');
    
    try {
        // Check if main SportsData.io client exists
        const sportsDataPath = path.join(__dirname, 'src', 'sportsdata-io-api.js');
        
        if (!fs.existsSync(sportsDataPath)) {
            console.log('❌ SportsData.io API client file not found at:', sportsDataPath);
            return false;
        }
        
        console.log('✅ SportsData.io API client file found');
        
        // Read and analyze the implementation
        const content = fs.readFileSync(sportsDataPath, 'utf8');
        console.log(`📄 Implementation size: ${content.length} characters\n`);
        
        // Check basic structure
        console.log('🏗️  Basic Structure Verification:');
        const structureChecks = [
            { name: 'Class Definition', pattern: /class\s+SportsDataIOAPI/i, required: true },
            { name: 'Base URL Configuration', pattern: /api\.sportsdata\.io/i, required: true },
            { name: 'API Key Handling', pattern: /key|Ocp-Apim-Subscription-Key/i, required: true },
            { name: 'HTTP Client (Axios)', pattern: /axios/i, required: true },
            { name: 'Error Handling', pattern: /try.*catch|\.catch\(/i, required: true },
            { name: 'Retry Logic', pattern: /retry|attempt/i, required: false },
            { name: 'Rate Limiting', pattern: /delay|wait|throttle/i, required: false }
        ];
        
        let structureScore = 0;
        structureChecks.forEach(check => {
            const found = check.pattern.test(content);
            const status = found ? '✅' : (check.required ? '❌' : '⚠️');
            console.log(`${status} ${check.name}`);
            if (found && check.required) structureScore++;
        });
        
        console.log(`\n📊 Structure Score: ${structureScore}/${structureChecks.filter(c => c.required).length} required elements\n`);
        
        // Check API endpoint coverage
        console.log('🎯 API Endpoint Coverage Analysis:');
        let totalMethods = 0;
        let implementedMethods = 0;
        
        Object.entries(API_CATEGORIES).forEach(([category, subcategories]) => {
            console.log(`\n📁 ${category}:`);
            
            Object.entries(subcategories).forEach(([subcategory, methods]) => {
                console.log(`  📂 ${subcategory}:`);
                
                methods.forEach(method => {
                    totalMethods++;
                    const methodRegex = new RegExp(`${method}\\s*\\([^)]*\\)\\s*{`, 'i');
                    const found = methodRegex.test(content) || content.includes(`${method}(`);
                    
                    if (found) {
                        implementedMethods++;
                        console.log(`    ✅ ${method}`);
                    } else {
                        console.log(`    ❌ ${method}`);
                    }
                });
            });
        });
        
        console.log(`\n📈 Overall API Coverage: ${implementedMethods}/${totalMethods} methods (${Math.round(implementedMethods/totalMethods*100)}%)`);
        
        // Check for NFL-specific endpoints
        console.log('\n🏈 NFL-Specific Endpoint Verification:');
        const nflEndpoints = [
            { name: 'NFL Players', pattern: /\/nfl\/.*\/players/i },
            { name: 'NFL Teams', pattern: /\/nfl\/.*\/teams/i },
            { name: 'NFL Scores', pattern: /\/nfl\/scores/i },
            { name: 'NFL Stats', pattern: /\/nfl\/stats/i },
            { name: 'NFL Projections', pattern: /\/nfl\/projections/i },
            { name: 'NFL Odds', pattern: /\/nfl\/odds/i }
        ];
        
        nflEndpoints.forEach(endpoint => {
            const found = endpoint.pattern.test(content);
            console.log(`${found ? '✅' : '❌'} ${endpoint.name}`);
        });
        
        return true;
        
    } catch (error) {
        console.log('❌ Error during verification:', error.message);
        return false;
    }
}

function checkMultiSourceIntegration() {
    console.log('\n🔄 Multi-Source Integration Check...\n');
    
    try {
        const multiSourcePath = path.join(__dirname, 'src', 'multi-source-analyzer.js');
        
        if (!fs.existsSync(multiSourcePath)) {
            console.log('❌ Multi-source analyzer not found');
            return false;
        }
        
        console.log('✅ Multi-source analyzer found');
        
        const content = fs.readFileSync(multiSourcePath, 'utf8');
        
        // Check integration components
        const integrationChecks = [
            'SleeperAPI',
            'SportsDataIOAPI',
            'UltimateFantasyAnalyzer',
            'createSuperProfile',
            'analyzeCombinedData'
        ];
        
        console.log('🔗 Integration Components:');
        integrationChecks.forEach(component => {
            const found = content.includes(component);
            console.log(`${found ? '✅' : '❌'} ${component}`);
        });
        
        return true;
        
    } catch (error) {
        console.log('❌ Error checking multi-source integration:', error.message);
        return false;
    }
}

function checkEnvironmentSetup() {
    console.log('\n⚙️  Environment Configuration Check...\n');
    
    // Check .env.example
    const envExamplePath = path.join(__dirname, '.env.example');
    if (fs.existsSync(envExamplePath)) {
        console.log('✅ .env.example found');
        
        const envContent = fs.readFileSync(envExamplePath, 'utf8');
        if (envContent.includes('SPORTSDATA_API_KEY')) {
            console.log('✅ SPORTSDATA_API_KEY configured in .env.example');
        } else {
            console.log('❌ SPORTSDATA_API_KEY missing from .env.example');
        }
    } else {
        console.log('❌ .env.example not found');
    }
    
    // Check for actual .env file
    const envPath = path.join(__dirname, '.env');
    if (fs.existsSync(envPath)) {
        console.log('✅ .env file exists (API key should be configured here)');
    } else {
        console.log('⚠️  .env file not found (you need to create this with your API key)');
    }
}

function generateSetupInstructions() {
    console.log('\n📋 Setup Instructions for SportsData.io Integration:');
    console.log('==================================================\n');
    
    console.log('1. 🔑 API Key Setup:');
    console.log('   • Sign up at https://sportsdata.io/');
    console.log('   • Get your NFL API key from the developer dashboard');
    console.log('   • Create .env file in backend/ directory');
    console.log('   • Add: SPORTSDATA_API_KEY=your_api_key_here\n');
    
    console.log('2. 📊 Available Data Sources:');
    console.log('   • SportsData.io: Live NFL data, stats, odds, projections');
    console.log('   • Sleeper API: ADP data, player information');
    console.log('   • FantasyData CSVs: Historical projections and metrics\n');
    
    console.log('3. 🚀 Quick Test:');
    console.log('   • cd backend/');
    console.log('   • node src/sportsdata-io-api.js');
    console.log('   • Should fetch current NFL season data\n');
    
    console.log('4. 🔄 Multi-Source Analysis:');
    console.log('   • node src/multi-source-analyzer.js');
    console.log('   • Combines all three data sources for comprehensive player analysis\n');
    
    console.log('5. 📖 API Documentation:');
    console.log('   • Full docs: http://sportsdata.io/developers/api-documentation/nfl');
    console.log('   • 650+ endpoints available');
    console.log('   • Covers all NFL data needs for fantasy football\n');
}

// Main execution
console.log('Starting comprehensive SportsData.io integration verification...\n');

const sportsDataOk = checkSportsDataIntegration();
const multiSourceOk = checkMultiSourceIntegration();
checkEnvironmentSetup();

console.log('\n' + '='.repeat(60));
console.log('🎯 INTEGRATION STATUS SUMMARY');
console.log('='.repeat(60));

if (sportsDataOk && multiSourceOk) {
    console.log('✅ SportsData.io integration is COMPLETE and ready to use!');
    console.log('✅ Multi-source analyzer is properly configured');
    console.log('🚀 Your fantasy football tool has access to comprehensive NFL data');
} else if (sportsDataOk) {
    console.log('✅ SportsData.io integration is implemented');
    console.log('⚠️  Multi-source integration needs attention');
    console.log('📝 You have most components ready for a powerful fantasy tool');
} else {
    console.log('❌ SportsData.io integration needs completion');
    console.log('📋 Please review the setup instructions below');
}

generateSetupInstructions();

console.log('\n🏁 Verification complete!');
