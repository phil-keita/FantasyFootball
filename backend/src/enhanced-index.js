#!/usr/bin/env node

import { EnhancedSleeperAPI } from './enhanced-sleeper-api.js';
import readline from 'readline';

/**
 * Enhanced Fantasy Football Draft Assistant - Interactive Mode
 * Now with trending data, NFL state awareness, and comprehensive analysis
 */

class EnhancedDraftAssistant {
  constructor() {
    this.api = new EnhancedSleeperAPI();
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    this.nflState = null;
  }

  async start() {
    console.log('🏈 Enhanced Fantasy Football Draft Assistant!');
    console.log('🔥 Now with trending data and comprehensive player analysis');
    console.log('=' .repeat(70));
    
    // Load NFL state for context
    this.nflState = await this.api.loadData('./data/state/nfl_state.json');
    if (this.nflState?.data) {
      console.log(`📅 NFL Context: Week ${this.nflState.data.week} of ${this.nflState.data.season} ${this.nflState.data.season_type} season`);
    }
    
    // Check data availability
    const hasData = await this.checkDataAvailability();
    if (!hasData) {
      console.log('\n⚠️  No enhanced data found. Running comprehensive fetch...\n');
      await this.api.fetchAllDraftData();
    }
    
    await this.showMainMenu();
  }

  async checkDataAvailability() {
    try {
      const players = await this.api.loadData('./data/players/active_players.json');
      const trending = await this.api.loadData('./data/trending/trending_add_24h.json');
      const analysis = await this.api.loadData('./data/analysis/draft_analysis.json');
      return players && trending && analysis;
    } catch {
      return false;
    }
  }

  async showMainMenu() {
    console.log('\n🎯 What would you like to do?');
    console.log('1. 🔍 Search for a player');
    console.log('2. 📍 View top players by position');
    console.log('3. 🔥 View trending players (HOT!)');
    console.log('4. 📊 View comprehensive data summary');
    console.log('5. 🧠 Get draft recommendations');
    console.log('6. 🏆 Analyze league (requires league ID)');
    console.log('7. 🔄 Refresh data');
    console.log('8. 📈 View data freshness');
    console.log('9. 🚪 Exit');
    
    const choice = await this.getInput('\nEnter your choice (1-9): ');
    
    switch (choice.trim()) {
      case '1':
        await this.enhancedPlayerSearch();
        break;
      case '2':
        await this.viewTopPlayers();
        break;
      case '3':
        await this.viewTrendingPlayers();
        break;
      case '4':
        await this.showComprehensiveSummary();
        break;
      case '5':
        await this.getDraftRecommendations();
        break;
      case '6':
        await this.analyzeLeague();
        break;
      case '7':
        await this.refreshData();
        break;
      case '8':
        await this.showDataFreshness();
        break;
      case '9':
        console.log('🏆 Happy drafting! May your picks be wise and your championships many!');
        this.rl.close();
        return;
      default:
        console.log('❌ Invalid choice. Please try again.');
    }
    
    await this.showMainMenu();
  }

  async enhancedPlayerSearch() {
    const query = await this.getInput('\n🔍 Enter player name: ');
    
    // Get filters
    const useFilters = await this.getInput('Apply filters? (y/N): ');
    let filters = {};
    
    if (useFilters.toLowerCase().startsWith('y')) {
      const position = await this.getInput('Position filter (QB/RB/WR/TE/K/DEF or leave empty): ');
      const team = await this.getInput('Team filter (e.g., KC, BUF or leave empty): ');
      const maxAge = await this.getInput('Max age filter (number or leave empty): ');
      
      if (position) filters.position = position.toUpperCase();
      if (team) filters.team = team.toUpperCase();
      if (maxAge && !isNaN(maxAge)) filters.maxAge = parseInt(maxAge);
    }
    
    const players = await this.api.searchPlayers(query, filters);
    
    if (!players || players.length === 0) {
      console.log(`❌ No players found matching "${query}" with those filters.`);
      return;
    }
    
    console.log(`\n🎯 Found ${players.length} player(s):`);
    console.log('-' .repeat(80));
    
    players.slice(0, 10).forEach((player, index) => {
      console.log(`${index + 1}. ${player.full_name} (${player.position}, ${player.team || 'FA'}) - Age: ${player.age || 'N/A'}`);
    });
    
    if (players.length === 1 || players.length <= 5) {
      const showDetails = await this.getInput('\nShow detailed info for first player? (Y/n): ');
      if (!showDetails.toLowerCase().startsWith('n')) {
        await this.showPlayerDetails(players[0]);
      }
    }
  }

  async showPlayerDetails(player) {
    console.log('\n📊 DETAILED PLAYER INFORMATION');
    console.log('=' .repeat(60));
    console.log(`Name: ${player.full_name}`);
    console.log(`Position: ${player.position} (Fantasy: ${player.fantasy_positions?.join(', ') || 'N/A'})`);
    console.log(`Team: ${player.team || 'Free Agent'}`);
    console.log(`Status: ${player.status || 'Unknown'}`);
    console.log(`Age: ${player.age || 'N/A'}`);
    console.log(`Experience: ${player.years_exp || 'N/A'} years`);
    console.log(`College: ${player.college || 'N/A'}`);
    console.log(`Height/Weight: ${player.height || 'N/A'} / ${player.weight || 'N/A'}`);
    console.log(`Jersey #: ${player.number || 'N/A'}`);
    
    // Check if player is trending
    await this.checkPlayerTrending(player.id);
    
    // Load stats if available
    await this.showPlayerStats(player.id);
  }

  async checkPlayerTrending(playerId) {
    const trending24h = await this.api.loadData('./data/trending/trending_add_24h.json');
    const drops24h = await this.api.loadData('./data/trending/trending_drop_24h.json');
    
    let trendingInfo = [];
    
    if (trending24h?.data) {
      const addTrend = trending24h.data.find(t => t.player_id === playerId);
      if (addTrend) {
        trendingInfo.push(`🔥 TRENDING UP: +${addTrend.count} adds in 24h`);
      }
    }
    
    if (drops24h?.data) {
      const dropTrend = drops24h.data.find(t => t.player_id === playerId);
      if (dropTrend) {
        trendingInfo.push(`📉 TRENDING DOWN: ${dropTrend.count} drops in 24h`);
      }
    }
    
    if (trendingInfo.length > 0) {
      console.log('\n📈 TRENDING STATUS:');
      trendingInfo.forEach(info => console.log(info));
    }
  }

  async showPlayerStats(playerId) {
    // Try to load current season stats
    const currentSeason = this.nflState?.data?.season || '2024';
    const statsFile = `./data/stats/regular/season_${currentSeason}.json`;
    const stats = await this.api.loadData(statsFile);
    
    if (stats?.data?.[playerId]) {
      console.log('\n📊 CURRENT SEASON STATS:');
      const playerStats = stats.data[playerId];
      
      // Show relevant stats based on position
      const statKeys = Object.keys(playerStats).slice(0, 8); // Show first 8 stats
      statKeys.forEach(key => {
        if (typeof playerStats[key] === 'number') {
          console.log(`${key}: ${playerStats[key]}`);
        }
      });
    }
  }

  async viewTrendingPlayers() {
    console.log('\n🔥 TRENDING PLAYERS ANALYSIS');
    console.log('=' .repeat(50));
    
    const trendType = await this.getInput('View (a)dds or (d)rops? [a]: ') || 'a';
    const timeframe = await this.getInput('Timeframe - 24h, 72h, or 168h? [24h]: ') || '24h';
    
    const type = trendType.toLowerCase().startsWith('d') ? 'drop' : 'add';
    const filename = `./data/trending/trending_${type}_${timeframe}.json`;
    
    const trending = await this.api.loadData(filename);
    if (!trending?.data) {
      console.log('❌ No trending data available. Run data fetch first.');
      return;
    }
    
    const players = await this.api.loadData('./data/players/all_players.json');
    
    console.log(`\n📈 TOP TRENDING ${type.toUpperCase()}S (${timeframe}):`);
    console.log('-' .repeat(70));
    console.log('Rank | Player Name               | Pos | Team | Count');
    console.log('-' .repeat(70));
    
    trending.data.slice(0, 20).forEach((trend, index) => {
      const player = players?.data?.[trend.player_id];
      if (player) {
        const rank = (index + 1).toString().padStart(4);
        const name = (player.full_name || 'Unknown').padEnd(25).substring(0, 25);
        const pos = (player.position || '').padEnd(3);
        const team = (player.team || '').padEnd(4);
        const count = trend.count.toString().padStart(5);
        console.log(`${rank} | ${name} | ${pos} | ${team} | ${count}`);
      }
    });
    
    console.log('\n💡 PRO TIP: Players trending up are often injury replacements or emerging talents!');
  }

  async showComprehensiveSummary() {
    console.log('\n📊 COMPREHENSIVE DATA SUMMARY');
    console.log('=' .repeat(60));
    
    const analysis = await this.api.loadData('./data/analysis/draft_analysis.json');
    
    if (analysis?.data) {
      const data = analysis.data;
      
      console.log(`🏈 NFL State: Week ${data.season_context?.week || 'N/A'} of ${data.season_context?.season || 'N/A'}`);
      console.log(`📊 Total Players: ${data.player_summary?.total_players || 'N/A'}`);
      console.log(`✅ Active Players: ${data.player_summary?.active_players || 'N/A'}`);
      
      if (data.player_summary?.by_position) {
        console.log('\n📍 Players by Position:');
        Object.entries(data.player_summary.by_position)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 10)
          .forEach(([pos, count]) => {
            console.log(`   ${pos}: ${count}`);
          });
      }
      
      if (data.trending_insights?.hot_adds_24h) {
        console.log('\n🔥 Hot Trending Adds (24h):');
        const players = await this.api.loadData('./data/players/all_players.json');
        data.trending_insights.hot_adds_24h.slice(0, 5).forEach((trend, i) => {
          const player = players?.data?.[trend.player_id];
          console.log(`   ${i+1}. ${player?.full_name || 'Unknown'} (+${trend.count})`);
        });
      }
    }
    
    // Show data freshness
    console.log('\n🕐 Data Freshness:');
    const freshness = await this.api.getDataFreshness();
    Object.entries(freshness).forEach(([file, info]) => {
      const status = info.is_fresh ? '✅' : '⚠️';
      const age = info.age_hours ? `${info.age_hours}h` : 'Unknown';
      console.log(`   ${status} ${file}: ${age} old`);
    });
  }

  async getDraftRecommendations() {
    console.log('\n🧠 DRAFT RECOMMENDATIONS ENGINE');
    console.log('=' .repeat(50));
    
    const format = await this.getInput('League format (ppr/half/standard) [ppr]: ') || 'ppr';
    const position = await this.getInput('Position focus (QB/RB/WR/TE/FLEX) [FLEX]: ') || 'FLEX';
    const round = await this.getInput('Current round (1-15) [1]: ') || '1';
    
    console.log(`\n🎯 Generating recommendations for Round ${round}, ${position} focus, ${format} format...\n`);
    
    // Basic recommendations based on available data
    if (position === 'FLEX' || ['RB', 'WR'].includes(position)) {
      console.log('💡 FLEX/SKILL POSITION STRATEGY:');
      console.log('• Early rounds: Target elite RBs first due to scarcity');
      console.log('• Mid rounds: Balance RB/WR based on value');
      console.log('• Look for trending players as potential breakouts');
      
      // Show trending adds for relevant positions
      const trending = await this.api.loadData('./data/trending/trending_add_24h.json');
      if (trending?.data) {
        const players = await this.api.loadData('./data/players/all_players.json');
        const relevantTrends = trending.data.filter(t => {
          const player = players?.data?.[t.player_id];
          return player && ['RB', 'WR'].includes(player.position);
        }).slice(0, 5);
        
        if (relevantTrends.length > 0) {
          console.log('\n🔥 Consider these trending RB/WR options:');
          relevantTrends.forEach(trend => {
            const player = players.data[trend.player_id];
            console.log(`   • ${player.full_name} (${player.position}, ${player.team}) - +${trend.count} adds`);
          });
        }
      }
    }
    
    console.log('\n📊 Current week context should influence your decisions!');
    if (this.nflState?.data) {
      console.log(`   Week ${this.nflState.data.week} - ${this.nflState.data.season_type} season`);
    }
  }

  async analyzeLeague() {
    const leagueId = await this.getInput('\n🏆 Enter league ID to analyze: ');
    
    if (!leagueId) {
      console.log('❌ League ID required for analysis.');
      return;
    }
    
    console.log(`\n🔍 Analyzing league ${leagueId}...`);
    
    try {
      const analysis = await this.api.analyzeLeague(leagueId);
      
      if (analysis) {
        console.log(`\n🏆 League: ${analysis.league?.name || 'Unknown'}`);
        console.log(`👥 Teams: ${analysis.league?.total_rosters || 'Unknown'}`);
        console.log(`📊 Status: ${analysis.league?.status || 'Unknown'}`);
        
        if (analysis.draftAnalysis) {
          const draft = analysis.draftAnalysis;
          console.log(`\n📋 Draft Analysis:`);
          console.log(`   Total Picks: ${draft.totalPicks}`);
          console.log(`   Rounds: ${draft.rounds}`);
          
          console.log('\n📍 Most Drafted Positions:');
          Object.entries(draft.positionDrafted)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5)
            .forEach(([pos, count]) => {
              console.log(`   ${pos}: ${count} picks`);
            });
        }
      }
    } catch (error) {
      console.log(`❌ Failed to analyze league: ${error.message}`);
    }
  }

  async refreshData() {
    console.log('\n🔄 Refreshing data...');
    await this.api.fetchAllDraftData();
    console.log('✅ Data refresh complete!');
  }

  async showDataFreshness() {
    console.log('\n🕐 DATA FRESHNESS REPORT');
    console.log('=' .repeat(40));
    
    const freshness = await this.api.getDataFreshness();
    
    Object.entries(freshness).forEach(([file, info]) => {
      if (info.error) {
        console.log(`❌ ${file}: ${info.error}`);
      } else {
        const status = info.is_fresh ? '✅ Fresh' : '⚠️ Stale';
        console.log(`${status} ${file}: ${info.age_hours}h old (${info.fetched_at})`);
      }
    });
    
    console.log('\n💡 Data older than 6 hours should be refreshed for best accuracy.');
  }

  getInput(prompt) {
    return new Promise((resolve) => {
      this.rl.question(prompt, (answer) => {
        resolve(answer);
      });
    });
  }
}

// Start the enhanced application
if (import.meta.url === `file://${process.argv[1]}`) {
  const app = new EnhancedDraftAssistant();
  app.start().catch(console.error);
}
