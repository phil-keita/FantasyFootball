import axios from 'axios';
import fs from 'fs/promises';
import path from 'path';

/**
 * SportsData.io API Client for Fantasy Football
 * Comprehensive client to access all valuable fantasy data from SportsData.io
 */
export class SportsDataIOAPI {
  constructor(apiKey = null) {
    this.apiKey = apiKey || process.env.SPORTSDATA_API_KEY;
    this.baseURL = 'https://api.sportsdata.io/v3/nfl';
    this.dataDir = './data-sources/sportsdata-io';
    this.headers = {
      'Ocp-Apim-Subscription-Key': this.apiKey,
      'User-Agent': 'FantasyFootball-DraftAssistant/1.0.0'
    };
    
    this.initDataDirectories();
  }

  /**
   * Initialize data directories
   */
  async initDataDirectories() {
    const dirs = [
      this.dataDir,
      `${this.dataDir}/players`,
      `${this.dataDir}/stats`,
      `${this.dataDir}/projections`,
      `${this.dataDir}/fantasy`,
      `${this.dataDir}/injuries`,
      `${this.dataDir}/news`,
      `${this.dataDir}/odds`,
      `${this.dataDir}/advanced`
    ];

    for (const dir of dirs) {
      try {
        await fs.mkdir(dir, { recursive: true });
      } catch (error) {
        // Directory already exists
      }
    }
  }

  /**
   * Generic API request handler with proper error handling
   */
  async makeRequest(endpoint, retries = 3) {
    if (!this.apiKey) {
      throw new Error('SportsData.io API key not configured. Please set SPORTSDATA_API_KEY environment variable.');
    }

    const url = `${this.baseURL}${endpoint}`;
    
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        console.log(`🌐 SportsData.io API: ${url} (attempt ${attempt}/${retries})`);
        
        const response = await axios.get(url, { 
          headers: this.headers,
          timeout: 10000 // 10 second timeout
        });
        
        if (response.status === 200) {
          return response.data;
        } else {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
      } catch (error) {
        console.warn(`⚠️ Attempt ${attempt} failed:`, error.message);
        
        if (attempt === retries) {
          throw new Error(`SportsData.io API request failed after ${retries} attempts: ${error.message}`);
        }
        
        // Wait before retry (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }
  }

  /**
   * Save data to file
   */
  async saveData(filename, data) {
    try {
      await fs.writeFile(filename, JSON.stringify(data, null, 2));
      console.log(`💾 SportsData.io saved: ${filename}`);
    } catch (error) {
      console.error(`❌ Failed to save ${filename}:`, error.message);
    }
  }

  // ============================================================================
  // CORE PLAYER & TEAM DATA
  // =============== COMPETITION FEEDS (Teams, Players & Rosters) ===============

  /**
   * Get all active players with detailed profiles
   */
  async getPlayers(saveToFile = true) {
    try {
      const players = await this.makeRequest('/scores/json/PlayersByAvailable');
      
      if (saveToFile) {
        await this.saveData(`${this.dataDir}/players/players_available.json`, players);
      }
      
      console.log(`📊 SportsData.io: Fetched ${players.length} available players`);
      return players;
    } catch (error) {
      console.error('❌ Failed to fetch players:', error.message);
      return null;
    }
  }

  /**
   * Get players by specific team
   */
  async getPlayersByTeam(team, saveToFile = true) {
    try {
      const players = await this.makeRequest(`/scores/json/Players/${team}`);
      
      if (saveToFile) {
        await this.saveData(`${this.dataDir}/players/players_${team}.json`, players);
      }
      
      console.log(`� SportsData.io: Fetched ${players.length} players for ${team}`);
      return players;
    } catch (error) {
      console.error(`❌ Failed to fetch players for ${team}:`, error.message);
      return null;
    }
  }

  /**
   * Get free agent players
   */
  async getPlayersByFreeAgents(saveToFile = true) {
    try {
      const players = await this.makeRequest('/scores/json/PlayersByFreeAgents');
      
      if (saveToFile) {
        await this.saveData(`${this.dataDir}/players/free_agents.json`, players);
      }
      
      console.log(`🆓 SportsData.io: Fetched ${players.length} free agents`);
      return players;
    } catch (error) {
      console.error('❌ Failed to fetch free agents:', error.message);
      return null;
    }
  }

  /**
   * Get rookie players by draft year
   */
  async getPlayersByRookieDraftYear(season, saveToFile = true) {
    try {
      const players = await this.makeRequest(`/scores/json/PlayersByRookieDraftYear/${season}`);
      
      if (saveToFile) {
        await this.saveData(`${this.dataDir}/players/rookies_${season}.json`, players);
      }
      
      console.log(`🎓 SportsData.io: Fetched ${players.length} rookies for ${season}`);
      return players;
    } catch (error) {
      console.error(`❌ Failed to fetch rookies for ${season}:`, error.message);
      return null;
    }
  }

  /**
   * Get team information and rosters
   */
  async getTeams(saveToFile = true) {
    try {
      const teams = await this.makeRequest('/scores/json/Teams');
      
      if (saveToFile) {
        await this.saveData(`${this.dataDir}/players/teams.json`, teams);
      }
      
      console.log(`🏟️ SportsData.io: Fetched ${teams.length} teams`);
      return teams;
    } catch (error) {
      console.error('❌ Failed to fetch teams:', error.message);
      return null;
    }
  }

  /**
   * Get basic team information
   */
  async getTeamsBasic(saveToFile = true) {
    try {
      const teams = await this.makeRequest('/scores/json/TeamsBasic');
      
      if (saveToFile) {
        await this.saveData(`${this.dataDir}/players/teams_basic.json`, teams);
      }
      
      console.log(`🏟️ SportsData.io: Fetched ${teams.length} teams (basic info)`);
      return teams;
    } catch (error) {
      console.error('❌ Failed to fetch basic teams:', error.message);
      return null;
    }
  }

  /**
   * Get current season standings
   */
  async getStandings(season, saveToFile = true) {
    try {
      const standings = await this.makeRequest(`/scores/json/Standings/${season}`);
      
      if (saveToFile) {
        await this.saveData(`${this.dataDir}/stats/standings_${season}.json`, standings);
      }
      
      console.log(`📊 SportsData.io: Fetched standings for ${season}`);
      return standings;
    } catch (error) {
      console.error(`❌ Failed to fetch standings for ${season}:`, error.message);
      return null;
    }
  }

  // =============== EVENT FEEDS (Schedules & Scores) ===============

  /**
   * Get game schedules for season
   */
  async getSchedules(season, saveToFile = true) {
    try {
      const schedules = await this.makeRequest(`/scores/json/Schedules/${season}`);
      
      if (saveToFile) {
        await this.saveData(`${this.dataDir}/stats/schedules_${season}.json`, schedules);
      }
      
      console.log(`📅 SportsData.io: Fetched ${schedules.length} games for ${season}`);
      return schedules;
    } catch (error) {
      console.error(`❌ Failed to fetch schedules for ${season}:`, error.message);
      return null;
    }
  }

  /**
   * Get games by week
   */
  async getGamesByWeek(season, week, saveToFile = true) {
    try {
      const games = await this.makeRequest(`/scores/json/ScoresByWeek/${season}/${week}`);
      
      if (saveToFile) {
        await this.saveData(`${this.dataDir}/stats/games_${season}_week_${week}.json`, games);
      }
      
      console.log(`🏈 SportsData.io: Fetched ${games.length} games for ${season} week ${week}`);
      return games;
    } catch (error) {
      console.error(`❌ Failed to fetch games for ${season} week ${week}:`, error.message);
      return null;
    }
  }

  /**
   * Get box scores by week
   */
  async getBoxScoresByWeek(season, week, saveToFile = true) {
    try {
      const boxScores = await this.makeRequest(`/stats/json/BoxScores/${season}/${week}`);
      
      if (saveToFile) {
        await this.saveData(`${this.dataDir}/stats/boxscores_${season}_week_${week}.json`, boxScores);
      }
      
      console.log(`📦 SportsData.io: Fetched ${boxScores.length} box scores for ${season} week ${week}`);
      return boxScores;
    } catch (error) {
      console.error(`❌ Failed to fetch box scores for ${season} week ${week}:`, error.message);
      return null;
    }
  }

  /**
   * Get depth charts for all teams
   */
  async getDepthCharts(saveToFile = true) {
    try {
      const depthCharts = await this.makeRequest('/scores/json/DepthCharts');
      
      if (saveToFile) {
        await this.saveData(`${this.dataDir}/players/depth_charts.json`, depthCharts);
      }
      
      console.log(`📋 SportsData.io: Fetched depth charts`);
      return depthCharts;
    } catch (error) {
      console.error('❌ Failed to fetch depth charts:', error.message);
      return null;
    }
  }

  // ============================================================================
  // FANTASY PROJECTIONS & RANKINGS
  // ============================================================================

  /**
   * Get weekly fantasy projections
   */
  async getWeeklyProjections(season = 2024, week = 1, saveToFile = true) {
    try {
      const projections = await this.makeRequest(`/projections/json/PlayerGameProjectionStatsByWeek/${season}/${week}`);
      
      if (saveToFile) {
        await this.saveData(`${this.dataDir}/projections/week_${week}_${season}.json`, projections);
      }
      
      console.log(`📈 SportsData.io: Fetched Week ${week} ${season} projections (${projections.length} players)`);
      return projections;
    } catch (error) {
      console.error(`❌ Failed to fetch Week ${week} projections:`, error.message);
      return null;
    }
  }

  /**
   * Get season-long fantasy projections
   */
  async getSeasonProjections(season = 2024, saveToFile = true) {
    try {
      const projections = await this.makeRequest(`/projections/json/PlayerSeasonProjectionStats/${season}`);
      
      if (saveToFile) {
        await this.saveData(`${this.dataDir}/projections/season_${season}.json`, projections);
      }
      
      console.log(`📊 SportsData.io: Fetched ${season} season projections (${projections.length} players)`);
      return projections;
    } catch (error) {
      console.error(`❌ Failed to fetch season projections:`, error.message);
      return null;
    }
  }

  /**
   * Get ADP (Average Draft Position) data
   */
  async getADP(season = 2024, saveToFile = true) {
    try {
      const adp = await this.makeRequest(`/projections/json/FantasyDefenseProjectionStatsByWeek/${season}/ADP`);
      
      if (saveToFile) {
        await this.saveData(`${this.dataDir}/fantasy/adp_${season}.json`, adp);
      }
      
      console.log(`📈 SportsData.io: Fetched ADP data for ${season}`);
      return adp;
    } catch (error) {
      console.error('❌ Failed to fetch ADP data:', error.message);
      return null;
    }
  }

  /**
   * Get auction values
   */
  async getAuctionValues(season = 2024, saveToFile = true) {
    try {
      const auctionValues = await this.makeRequest(`/projections/json/FantasyAuctionDrafts/${season}`);
      
      if (saveToFile) {
        await this.saveData(`${this.dataDir}/fantasy/auction_values_${season}.json`, auctionValues);
      }
      
      console.log(`💰 SportsData.io: Fetched auction values for ${season}`);
      return auctionValues;
    } catch (error) {
      console.error('❌ Failed to fetch auction values:', error.message);
      return null;
    }
  }

  // ============================================================================
  // PLAYER STATS & PERFORMANCE
  // ============================================================================

  /**
   * Get player season stats
   */
  async getPlayerSeasonStats(season = 2024, saveToFile = true) {
    try {
      const stats = await this.makeRequest(`/stats/json/PlayerSeasonStats/${season}`);
      
      if (saveToFile) {
        await this.saveData(`${this.dataDir}/stats/season_stats_${season}.json`, stats);
      }
      
      console.log(`📊 SportsData.io: Fetched ${season} season stats (${stats.length} players)`);
      return stats;
    } catch (error) {
      console.error(`❌ Failed to fetch season stats:`, error.message);
      return null;
    }
  }

  /**
   * Get player weekly stats
   */
  async getPlayerWeekStats(season = 2024, week = 1, saveToFile = true) {
    try {
      const stats = await this.makeRequest(`/stats/json/PlayerGameStatsByWeek/${season}/${week}`);
      
      if (saveToFile) {
        await this.saveData(`${this.dataDir}/stats/week_${week}_stats_${season}.json`, stats);
      }
      
      console.log(`📊 SportsData.io: Fetched Week ${week} ${season} stats (${stats.length} players)`);
      return stats;
    } catch (error) {
      console.error(`❌ Failed to fetch week stats:`, error.message);
      return null;
    }
  }

  /**
   * Get advanced player metrics (snap counts, targets, etc.)
   */
  async getAdvancedStats(season = 2024, week = 1, saveToFile = true) {
    try {
      const advanced = await this.makeRequest(`/stats/json/PlayerGameStatsByWeek/${season}/${week}/Advanced`);
      
      if (saveToFile) {
        await this.saveData(`${this.dataDir}/advanced/week_${week}_advanced_${season}.json`, advanced);
      }
      
      console.log(`🔬 SportsData.io: Fetched Week ${week} ${season} advanced stats`);
      return advanced;
    } catch (error) {
      console.error(`❌ Failed to fetch advanced stats:`, error.message);
      return null;
    }
  }

  /**
   * Get red zone stats
   */
  async getRedZoneStats(season = 2024, saveToFile = true) {
    try {
      const redZone = await this.makeRequest(`/stats/json/PlayerSeasonRedZoneStats/${season}`);
      
      if (saveToFile) {
        await this.saveData(`${this.dataDir}/stats/red_zone_${season}.json`, redZone);
      }
      
      console.log(`🎯 SportsData.io: Fetched red zone stats for ${season}`);
      return redZone;
    } catch (error) {
      console.error(`❌ Failed to fetch red zone stats:`, error.message);
      return null;
    }
  }

  // ============================================================================
  // INJURIES & NEWS
  // ============================================================================

  /**
   * Get injury reports
   */
  async getInjuries(saveToFile = true) {
    try {
      const injuries = await this.makeRequest('/scores/json/Injuries');
      
      if (saveToFile) {
        await this.saveData(`${this.dataDir}/injuries/current_injuries.json`, {
          fetched_at: new Date().toISOString(),
          injuries: injuries
        });
      }
      
      console.log(`🏥 SportsData.io: Fetched ${injuries.length} injury reports`);
      return injuries;
    } catch (error) {
      console.error('❌ Failed to fetch injuries:', error.message);
      return null;
    }
  }

  /**
   * Get player news
   */
  async getPlayerNews(saveToFile = true) {
    try {
      const news = await this.makeRequest('/scores/json/News');
      
      if (saveToFile) {
        await this.saveData(`${this.dataDir}/news/player_news.json`, {
          fetched_at: new Date().toISOString(),
          news: news
        });
      }
      
      console.log(`📰 SportsData.io: Fetched ${news.length} news articles`);
      return news;
    } catch (error) {
      console.error('❌ Failed to fetch news:', error.message);
      return null;
    }
  }

  // ============================================================================
  // DAILY FANTASY SPORTS (DFS)
  // ============================================================================

  /**
   * Get DFS salaries for major platforms
   */
  async getDFSSalaries(week = 1, saveToFile = true) {
    try {
      const salaries = await this.makeRequest(`/projections/json/DfsSlatesByWeek/2024/${week}`);
      
      if (saveToFile) {
        await this.saveData(`${this.dataDir}/fantasy/dfs_salaries_week_${week}.json`, salaries);
      }
      
      console.log(`💰 SportsData.io: Fetched DFS salaries for Week ${week}`);
      return salaries;
    } catch (error) {
      console.error(`❌ Failed to fetch DFS salaries:`, error.message);
      return null;
    }
  }

  /**
   * Get ownership projections
   */
  async getOwnershipProjections(week = 1, saveToFile = true) {
    try {
      const ownership = await this.makeRequest(`/projections/json/DfsOwnershipProjectionsByWeek/2024/${week}`);
      
      if (saveToFile) {
        await this.saveData(`${this.dataDir}/fantasy/ownership_week_${week}.json`, ownership);
      }
      
      console.log(`📊 SportsData.io: Fetched ownership projections for Week ${week}`);
      return ownership;
    } catch (error) {
      console.error(`❌ Failed to fetch ownership projections:`, error.message);
      return null;
    }
  }

  // ============================================================================
  // BETTING & ODDS DATA
  // ============================================================================

  /**
   * Get betting odds and lines
   */
  async getBettingOdds(season = 2024, week = 1, saveToFile = true) {
    try {
      const odds = await this.makeRequest(`/odds/json/GameOddsByWeek/${season}/${week}`);
      
      if (saveToFile) {
        await this.saveData(`${this.dataDir}/odds/week_${week}_odds_${season}.json`, odds);
      }
      
      console.log(`🎲 SportsData.io: Fetched betting odds for Week ${week} ${season}`);
      return odds;
    } catch (error) {
      console.error(`❌ Failed to fetch betting odds:`, error.message);
      return null;
    }
  }

  /**
   * Get player props
   */
  async getPlayerProps(week = 1, saveToFile = true) {
    try {
      const props = await this.makeRequest(`/odds/json/PlayerPropsByWeek/2024/${week}`);
      
      if (saveToFile) {
        await this.saveData(`${this.dataDir}/odds/player_props_week_${week}.json`, props);
      }
      
      console.log(`🎯 SportsData.io: Fetched player props for Week ${week}`);
      return props;
    } catch (error) {
      console.error(`❌ Failed to fetch player props:`, error.message);
      return null;
    }
  }

  // ============================================================================
  // COMPREHENSIVE DATA FETCHING
  // ============================================================================

  /**
   * Fetch all available fantasy-relevant data
   */
  async fetchAllFantasyData(season = 2024) {
    console.log('🚀 SportsData.io: Starting comprehensive fantasy data fetch...\n');
    
    const startTime = Date.now();
    const results = {
      players: null,
      teams: null,
      depthCharts: null,
      seasonProjections: null,
      weeklyProjections: {},
      seasonStats: null,
      weeklyStats: {},
      redZoneStats: null,
      injuries: null,
      news: null,
      dfsSalaries: {},
      ownership: {},
      odds: {}
    };

    try {
      // 1. Core player and team data
      console.log('📊 Fetching core player and team data...');
      results.players = await this.getPlayers(season);
      results.teams = await this.getTeams();
      results.depthCharts = await this.getDepthCharts();

      // 2. Fantasy projections
      console.log('\n📈 Fetching fantasy projections...');
      results.seasonProjections = await this.getSeasonProjections(season);
      
      // Get projections for first 4 weeks
      for (let week = 1; week <= 4; week++) {
        results.weeklyProjections[`week_${week}`] = await this.getWeeklyProjections(season, week);
      }

      // 3. Player statistics
      console.log('\n📊 Fetching player statistics...');
      results.seasonStats = await this.getPlayerSeasonStats(season);
      
      // Get stats for first 4 weeks
      for (let week = 1; week <= 4; week++) {
        results.weeklyStats[`week_${week}`] = await this.getPlayerWeekStats(season, week);
      }

      results.redZoneStats = await this.getRedZoneStats(season);

      // 4. Injuries and news
      console.log('\n🏥 Fetching injuries and news...');
      results.injuries = await this.getInjuries();
      results.news = await this.getPlayerNews();

      // 5. DFS data
      console.log('\n💰 Fetching DFS data...');
      for (let week = 1; week <= 4; week++) {
        results.dfsSalaries[`week_${week}`] = await this.getDFSSalaries(week);
        results.ownership[`week_${week}`] = await this.getOwnershipProjections(week);
      }

      // 6. Betting data
      console.log('\n🎲 Fetching betting data...');
      for (let week = 1; week <= 4; week++) {
        results.odds[`week_${week}`] = await this.getBettingOdds(season, week);
      }

      const endTime = Date.now();
      const duration = ((endTime - startTime) / 1000).toFixed(2);

      console.log(`\n✅ SportsData.io data fetch completed in ${duration} seconds`);
      console.log('📂 All data saved to ./data-sources/sportsdata-io/ directory');

      return results;

    } catch (error) {
      console.error('❌ Error during SportsData.io data fetch:', error.message);
      return results;
    }
  }

  // ============================================================================
  // DATA ANALYSIS HELPERS
  // ============================================================================

  /**
   * Find a player by name across all data sources
   */
  async findPlayer(playerName) {
    try {
      const playersFile = `${this.dataDir}/players/players_2024.json`;
      const playersData = await fs.readFile(playersFile, 'utf8');
      const players = JSON.parse(playersData);
      
      const matches = players.filter(player => {
        const name = `${player.FirstName} ${player.LastName}`.toLowerCase();
        return name.includes(playerName.toLowerCase());
      });
      
      return matches;
    } catch (error) {
      console.log('⚠️ SportsData.io player data not available. Run fetch first.');
      return [];
    }
  }

  /**
   * Get comprehensive player profile
   */
  async getPlayerProfile(playerName) {
    const profile = {
      basic: null,
      projections: null,
      stats: null,
      injuries: null,
      news: null
    };

    try {
      // Find player in basic data
      const players = await this.findPlayer(playerName);
      if (players.length > 0) {
        profile.basic = players[0];
        
        // Load additional data for this player
        const playerId = profile.basic.PlayerID;
        
        // Season projections
        try {
          const projectionsFile = `${this.dataDir}/projections/season_2024.json`;
          const projectionsData = await fs.readFile(projectionsFile, 'utf8');
          const projections = JSON.parse(projectionsData);
          profile.projections = projections.find(p => p.PlayerID === playerId);
        } catch (error) {
          // Projections not available
        }

        // Season stats
        try {
          const statsFile = `${this.dataDir}/stats/season_stats_2024.json`;
          const statsData = await fs.readFile(statsFile, 'utf8');
          const stats = JSON.parse(statsData);
          profile.stats = stats.find(s => s.PlayerID === playerId);
        } catch (error) {
          // Stats not available
        }
      }

      return profile;
    } catch (error) {
      console.error('Error building player profile:', error.message);
      return profile;
    }
  }

  /**
   * Generate data summary
   */
  async generateSummary() {
    console.log('📊 SportsData.io Data Summary');
    console.log('='.repeat(50));

    const summary = {
      players: 0,
      teams: 0,
      projections: 0,
      stats: 0,
      injuries: 0,
      news: 0
    };

    try {
      // Count players
      const playersFile = `${this.dataDir}/players/players_2024.json`;
      const playersData = await fs.readFile(playersFile, 'utf8');
      const players = JSON.parse(playersData);
      summary.players = players.length;
    } catch (error) {
      // Players data not available
    }

    // Add more summary logic here...

    return summary;
  }

  // =============== UTILITY ENDPOINTS ===============

  /**
   * Get current NFL season
   */
  async getCurrentSeason(saveToFile = true) {
    try {
      const season = await this.makeRequest('/scores/json/CurrentSeason');
      
      if (saveToFile) {
        await this.saveData(`${this.dataDir}/utils/current_season.json`, { season });
      }
      
      console.log(`📅 SportsData.io: Current season is ${season}`);
      return season;
    } catch (error) {
      console.error('❌ Failed to fetch current season:', error.message);
      return null;
    }
  }

  /**
   * Get current NFL week
   */
  async getCurrentWeek(saveToFile = true) {
    try {
      const week = await this.makeRequest('/scores/json/CurrentWeek');
      
      if (saveToFile) {
        await this.saveData(`${this.dataDir}/utils/current_week.json`, { week });
      }
      
      console.log(`📅 SportsData.io: Current week is ${week}`);
      return week;
    } catch (error) {
      console.error('❌ Failed to fetch current week:', error.message);
      return null;
    }
  }

  /**
   * Get bye weeks for season
   */
  async getByeWeeks(season, saveToFile = true) {
    try {
      const byes = await this.makeRequest(`/scores/json/Byes/${season}`);
      
      if (saveToFile) {
        await this.saveData(`${this.dataDir}/utils/bye_weeks_${season}.json`, byes);
      }
      
      console.log(`📅 SportsData.io: Fetched bye weeks for ${season}`);
      return byes;
    } catch (error) {
      console.error(`❌ Failed to fetch bye weeks for ${season}:`, error.message);
      return null;
    }
  }

  // =============== FANTASY FEEDS ===============

  /**
   * Get player projections for week
   */
  async getPlayerProjectionsByWeek(season, week, saveToFile = true) {
    try {
      const projections = await this.makeRequest(`/projections/json/PlayerGameProjectionStatsByWeek/${season}/${week}`);
      
      if (saveToFile) {
        await this.saveData(`${this.dataDir}/projections/player_projections_${season}_week_${week}.json`, projections);
      }
      
      console.log(`🔮 SportsData.io: Fetched ${projections.length} player projections for ${season} week ${week}`);
      return projections;
    } catch (error) {
      console.error(`❌ Failed to fetch player projections for ${season} week ${week}:`, error.message);
      return null;
    }
  }

  /**
   * Get player projections by team
   */
  async getPlayerProjectionsByTeam(season, week, team, saveToFile = true) {
    try {
      const projections = await this.makeRequest(`/projections/json/PlayerGameProjectionStatsByTeam/${season}/${week}/${team}`);
      
      if (saveToFile) {
        await this.saveData(`${this.dataDir}/projections/player_projections_${team}_${season}_week_${week}.json`, projections);
      }
      
      console.log(`🔮 SportsData.io: Fetched ${projections.length} player projections for ${team} ${season} week ${week}`);
      return projections;
    } catch (error) {
      console.error(`❌ Failed to fetch player projections for ${team} ${season} week ${week}:`, error.message);
      return null;
    }
  }

  /**
   * Get season-long player projections
   */
  async getPlayerProjections(season, saveToFile = true) {
    try {
      const projections = await this.makeRequest(`/projections/json/PlayerSeasonProjectionStats/${season}`);
      
      if (saveToFile) {
        await this.saveData(`${this.dataDir}/projections/season_projections_${season}.json`, projections);
      }
      
      console.log(`🔮 SportsData.io: Fetched ${projections.length} season projections for ${season}`);
      return projections;
    } catch (error) {
      console.error(`❌ Failed to fetch season projections for ${season}:`, error.message);
      return null;
    }
  }

  /**
   * Get fantasy defense projections
   */
  async getFantasyDefenseProjections(season, week, saveToFile = true) {
    try {
      const projections = await this.makeRequest(`/projections/json/FantasyDefenseProjectionsByGame/${season}/${week}`);
      
      if (saveToFile) {
        await this.saveData(`${this.dataDir}/projections/defense_projections_${season}_week_${week}.json`, projections);
      }
      
      console.log(`🛡️ SportsData.io: Fetched ${projections.length} defense projections for ${season} week ${week}`);
      return projections;
    } catch (error) {
      console.error(`❌ Failed to fetch defense projections for ${season} week ${week}:`, error.message);
      return null;
    }
  }

  /**
   * Get DFS slates by week
   */
  async getDfsSlatesByWeek(season, week, saveToFile = true) {
    try {
      const slates = await this.makeRequest(`/projections/json/DfsSlatesByWeek/${season}/${week}`);
      
      if (saveToFile) {
        await this.saveData(`${this.dataDir}/fantasy/dfs_slates_${season}_week_${week}.json`, slates);
      }
      
      console.log(`💰 SportsData.io: Fetched ${slates.length} DFS slates for ${season} week ${week}`);
      return slates;
    } catch (error) {
      console.error(`❌ Failed to fetch DFS slates for ${season} week ${week}:`, error.message);
      return null;
    }
  }

  // =============== NEWS FEEDS ===============

  /**
   * Get latest NFL news
   */
  async getNews(saveToFile = true) {
    try {
      const news = await this.makeRequest('/news-rotoballer/json/RotoBallerPremiumNews');
      
      if (saveToFile) {
        await this.saveData(`${this.dataDir}/news/latest_news.json`, news);
      }
      
      console.log(`📰 SportsData.io: Fetched ${news.length} news articles`);
      return news;
    } catch (error) {
      console.error('❌ Failed to fetch news:', error.message);
      return null;
    }
  }

  /**
   * Get news by player
   */
  async getNewsByPlayer(playerId, saveToFile = true) {
    try {
      const news = await this.makeRequest(`/news-rotoballer/json/NewsByPlayerID/${playerId}`);
      
      if (saveToFile) {
        await this.saveData(`${this.dataDir}/news/player_news_${playerId}.json`, news);
      }
      
      console.log(`📰 SportsData.io: Fetched ${news.length} news articles for player ${playerId}`);
      return news;
    } catch (error) {
      console.error(`❌ Failed to fetch news for player ${playerId}:`, error.message);
      return null;
    }
  }

  /**
   * Enhanced data analysis and combination
   */
  async createComprehensivePlayerProfile(playerId) {
    console.log(`🔍 Creating comprehensive profile for player ${playerId}...`);
    
    const profile = {
      playerId,
      basicInfo: null,
      currentStats: null,
      projections: null,
      injuries: null,
      news: null,
      depth: null,
      lastUpdated: new Date().toISOString()
    };

    try {
      // Get basic player info (try multiple sources)
      try {
        const players = await this.getPlayers(false);
        profile.basicInfo = players?.find(p => p.PlayerID === playerId);
      } catch (error) {
        console.warn('Could not fetch basic player info');
      }

      // Get current season projections
      try {
        const currentSeason = await this.getCurrentSeason(false) || 2024;
        const projections = await this.getPlayerProjections(currentSeason, false);
        profile.projections = projections?.find(p => p.PlayerID === playerId);
      } catch (error) {
        console.warn('Could not fetch projections');
      }

      // Get injury status
      try {
        const currentSeason = await this.getCurrentSeason(false) || 2024;
        const currentWeek = await this.getCurrentWeek(false) || 1;
        const injuries = await this.getInjuries(currentSeason, currentWeek, false);
        profile.injuries = injuries?.filter(i => i.PlayerID === playerId) || [];
      } catch (error) {
        console.warn('Could not fetch injury data');
      }

      // Get recent news
      try {
        const news = await this.getNewsByPlayer(playerId, false);
        profile.news = news || [];
      } catch (error) {
        console.warn('Could not fetch player news');
      }

      return profile;
    } catch (error) {
      console.error('Error building comprehensive player profile:', error.message);
      return profile;
    }
  }
}
