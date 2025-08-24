import axios from 'axios';
import fs from 'fs/promises';
import path from 'path';

/**
 * Sleeper API Client for Fantasy Football Data
 * Comprehensive data fetching for draft assistance
 */
export class SleeperAPI {
  constructor() {
    this.baseURL = 'https://api.sleeper.app/v1';
    this.dataDir = './data-sources/sleeper-api';
    this.currentSeason = 2024;
    this.initDataDirectories();
  }

  /**
   * Initialize data directories
   */
  async initDataDirectories() {
    const dirs = [
      this.dataDir,
      `${this.dataDir}/players`,
      `${this.dataDir}/adp`,
      `${this.dataDir}/stats`,
      `${this.dataDir}/stats/regular`,
      `${this.dataDir}/stats/postseason`,
      `${this.dataDir}/stats/preseason`,
      `${this.dataDir}/leagues`,
      `${this.dataDir}/drafts`
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
   * Generic API request handler with error handling and retry logic
   */
  async makeRequest(endpoint, retries = 3) {
    const url = `${this.baseURL}${endpoint}`;
    
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        console.log(`🔄 Fetching: ${endpoint} (Attempt ${attempt}/${retries})`);
        const response = await axios.get(url, {
          timeout: 30000, // 30 second timeout
          headers: {
            'User-Agent': 'FantasyFootball-DraftAssistant/1.0.0',
            'Accept': 'application/json'
          }
        });
        
        console.log(`✅ Success: ${endpoint}`);
        return response.data;
      } catch (error) {
        console.log(`❌ Error on attempt ${attempt}: ${error.message}`);
        
        if (attempt === retries) {
          throw new Error(`Failed to fetch ${endpoint} after ${retries} attempts: ${error.message}`);
        }
        
        // Wait before retry (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }
  }

  /**
   * Save data to JSON file
   */
  async saveData(filename, data) {
    try {
      await fs.writeFile(filename, JSON.stringify(data, null, 2));
      console.log(`💾 Saved: ${filename}`);
    } catch (error) {
      console.error(`❌ Failed to save ${filename}:`, error.message);
    }
  }

  /**
   * Load data from JSON file
   */
  async loadData(filename) {
    try {
      const data = await fs.readFile(filename, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.log(`⚠️ Could not load ${filename}: ${error.message}`);
      return null;
    }
  }

  // ============================================================================
  // PLAYER DATA ENDPOINTS
  // ============================================================================

  /**
   * Get all NFL players with comprehensive metadata
   */
  async getAllPlayers(saveToFile = true) {
    try {
      const players = await this.makeRequest('/players/nfl');
      
      if (saveToFile) {
        await this.saveData(`${this.dataDir}/players/players.json`, players);
      }
      
      console.log(`📊 Fetched ${Object.keys(players).length} NFL players`);
      return players;
    } catch (error) {
      console.error('❌ Failed to fetch players:', error.message);
      return null;
    }
  }

  /**
   * Get Average Draft Position data for different scoring formats
   */
  async getADP(format = 'standard', saveToFile = true) {
    const formatMap = {
      'standard': '/players/nfl/adp',
      'ppr': '/players/nfl/adp/ppr',
      'half_ppr': '/players/nfl/adp/half_ppr',
      '2qb': '/players/nfl/adp/2qb',
      'superflex': '/players/nfl/adp/2qb' // Alias for 2qb
    };

    const endpoint = formatMap[format];
    if (!endpoint) {
      throw new Error(`Invalid ADP format: ${format}. Valid formats: ${Object.keys(formatMap).join(', ')}`);
    }

    try {
      const adp = await this.makeRequest(endpoint);
      
      if (saveToFile) {
        await this.saveData(`${this.dataDir}/adp/adp_${format}.json`, adp);
      }
      
      console.log(`📈 Fetched ADP data for ${format} format (${Object.keys(adp).length} players)`);
      return adp;
    } catch (error) {
      console.error(`❌ ADP endpoint may be temporarily unavailable for ${format}:`, error.message);
      console.log(`⚠️ Continuing without ADP data - you can retry later`);
      return null;
    }
  }

  /**
   * Get all ADP formats at once
   */
  async getAllADP(saveToFile = true) {
    const formats = ['standard', 'ppr', 'half_ppr', '2qb'];
    const adpData = {};

    for (const format of formats) {
      adpData[format] = await this.getADP(format, saveToFile);
    }

    return adpData;
  }

  // ============================================================================
  // STATISTICS ENDPOINTS
  // ============================================================================

  /**
   * Get season statistics
   */
  async getSeasonStats(season = this.currentSeason, type = 'regular', saveToFile = true) {
    try {
      const stats = await this.makeRequest(`/stats/nfl/${type}/${season}`);
      
      if (saveToFile) {
        await this.saveData(`${this.dataDir}/stats/${type}/season_${season}.json`, stats);
      }
      
      console.log(`📊 Fetched ${season} ${type} season stats (${Object.keys(stats).length} players)`);
      return stats;
    } catch (error) {
      console.error(`❌ Failed to fetch ${season} ${type} stats:`, error.message);
      return null;
    }
  }

  /**
   * Get weekly statistics
   */
  async getWeeklyStats(week, season = this.currentSeason, type = 'regular', saveToFile = true) {
    try {
      const stats = await this.makeRequest(`/stats/nfl/${type}/${season}/${week}`);
      
      if (saveToFile) {
        await this.saveData(`${this.dataDir}/stats/${type}/week_${week}_${season}.json`, stats);
      }
      
      console.log(`📊 Fetched Week ${week} ${season} ${type} stats (${Object.keys(stats).length} players)`);
      return stats;
    } catch (error) {
      console.error(`❌ Failed to fetch Week ${week} ${season} ${type} stats:`, error.message);
      return null;
    }
  }

  /**
   * Get all weeks of regular season stats
   */
  async getAllWeeklyStats(season = this.currentSeason, type = 'regular', saveToFile = true) {
    const weeklyStats = {};
    const maxWeeks = type === 'regular' ? 18 : 5; // 18 regular season weeks, up to 5 playoff weeks

    for (let week = 1; week <= maxWeeks; week++) {
      const stats = await this.getWeeklyStats(week, season, type, saveToFile);
      if (stats) {
        weeklyStats[week] = stats;
      }
    }

    return weeklyStats;
  }

  // ============================================================================
  // NEWS AND UPDATES
  // ============================================================================

  /**
   * Get NFL news
   */
  async getNFLNews(saveToFile = true) {
    try {
      const news = await this.makeRequest('/players/nfl/news');
      
      if (saveToFile) {
        await this.saveData(`${this.dataDir}/news.json`, {
          fetched_at: new Date().toISOString(),
          news: news
        });
      }
      
      console.log(`📰 Fetched ${news.length} news articles`);
      return news;
    } catch (error) {
      console.error('❌ News endpoint may be temporarily unavailable:', error.message);
      console.log('⚠️ Continuing without news data - you can retry later');
      return null;
    }
  }

  // ============================================================================
  // COMPREHENSIVE DATA FETCHING
  // ============================================================================

  /**
   * Fetch all available data for comprehensive analysis
   */
  async fetchAllData() {
    console.log('🚀 Starting comprehensive data fetch...\n');
    
    const startTime = Date.now();
    const results = {
      players: null,
      adp: {},
      stats: {},
      news: null
    };

    // 1. Fetch all players
    console.log('📋 Fetching player data...');
    results.players = await this.getAllPlayers();

    // 2. Fetch all ADP formats
    console.log('\n📈 Fetching ADP data...');
    results.adp = await this.getAllADP();

    // 3. Fetch current season stats
    console.log('\n📊 Fetching current season statistics...');
    results.stats.regular_2024 = await this.getSeasonStats(2024, 'regular');
    results.stats.preseason_2024 = await this.getSeasonStats(2024, 'preseason');
    
    // Fetch previous season for comparison
    results.stats.regular_2023 = await this.getSeasonStats(2023, 'regular');
    results.stats.postseason_2023 = await this.getSeasonStats(2023, 'postseason');

    // 4. Fetch recent weekly stats (first 4 weeks of current season)
    console.log('\n📅 Fetching recent weekly stats...');
    for (let week = 1; week <= 4; week++) {
      const weekStats = await this.getWeeklyStats(week, 2024, 'regular');
      if (weekStats) {
        results.stats[`week_${week}_2024`] = weekStats;
      }
    }

    // 5. Fetch news
    console.log('\n📰 Fetching NFL news...');
    results.news = await this.getNFLNews();

    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);

    console.log(`\n✅ Data fetch completed in ${duration} seconds`);
    console.log('📂 All data saved to ./data/ directory');

    return results;
  }

  // ============================================================================
  // DATA ANALYSIS HELPERS
  // ============================================================================

  /**
   * Get player info by name or ID
   */
  async findPlayer(identifier) {
    const players = await this.loadData(`${this.dataDir}/players.json`) || await this.getAllPlayers();
    
    if (!players) return null;

    // Search by ID first
    if (players[identifier]) {
      return { id: identifier, ...players[identifier] };
    }

    // Search by name (case insensitive)
    const searchName = identifier.toLowerCase();
    for (const [id, player] of Object.entries(players)) {
      if (player.full_name?.toLowerCase().includes(searchName) ||
          player.first_name?.toLowerCase().includes(searchName) ||
          player.last_name?.toLowerCase().includes(searchName)) {
        return { id, ...player };
      }
    }

    return null;
  }

  /**
   * Get top players by position from ADP data
   */
  async getTopPlayersByPosition(position, format = 'ppr', limit = 20) {
    const adp = await this.loadData(`${this.dataDir}/adp/adp_${format}.json`);
    const players = await this.loadData(`${this.dataDir}/players.json`);
    
    if (!adp || !players) return null;

    const positionPlayers = [];
    
    for (const [playerId, adpData] of Object.entries(adp)) {
      const player = players[playerId];
      if (player && player.position === position && player.active) {
        positionPlayers.push({
          id: playerId,
          name: player.full_name,
          team: player.team,
          adp: adpData.average_position,
          ...player
        });
      }
    }

    return positionPlayers
      .sort((a, b) => a.adp - b.adp)
      .slice(0, limit);
  }

  /**
   * Generate summary statistics
   */
  async generateSummary() {
    const players = await this.loadData(`${this.dataDir}/players.json`);
    const adpPPR = await this.loadData(`${this.dataDir}/adp/adp_ppr.json`);
    
    if (!players) return null;

    const summary = {
      total_players: Object.keys(players).length,
      active_players: Object.values(players).filter(p => p.active).length,
      by_position: {},
      by_team: {},
      adp_coverage: adpPPR ? Object.keys(adpPPR).length : 0
    };

    // Count by position
    for (const player of Object.values(players)) {
      if (player.active) {
        summary.by_position[player.position] = (summary.by_position[player.position] || 0) + 1;
        summary.by_team[player.team] = (summary.by_team[player.team] || 0) + 1;
      }
    }

    return summary;
  }
}
