import axios from 'axios';
import fs from 'fs/promises';
import path from 'path';

/**
 * Enhanced Sleeper API Client - Comprehensive Data Collection
 * Based on complete Sleeper API documentation analysis
 */
export class EnhancedSleeperAPI {
  constructor() {
    this.baseURL = 'https://api.sleeper.app/v1';
    this.dataDir = './data';
    this.currentSeason = 2024;
    this.rateLimit = 1000; // Stay under 1000 calls per minute
    this.lastRequestTime = 0;
    this.requestCount = 0;
    this.initDataDirectories();
  }

  /**
   * Initialize comprehensive data directory structure
   */
  async initDataDirectories() {
    const dirs = [
      this.dataDir,
      `${this.dataDir}/players`,
      `${this.dataDir}/trending`,
      `${this.dataDir}/stats`,
      `${this.dataDir}/stats/regular`,
      `${this.dataDir}/stats/postseason`, 
      `${this.dataDir}/stats/preseason`,
      `${this.dataDir}/leagues`,
      `${this.dataDir}/drafts`,
      `${this.dataDir}/users`,
      `${this.dataDir}/state`,
      `${this.dataDir}/analysis`,
      `${this.dataDir}/transactions`,
      `${this.dataDir}/rosters`,
      `${this.dataDir}/matchups`,
      `${this.dataDir}/brackets`,
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
   * Rate limiting to stay under 1000 requests per minute
   */
  async enforceRateLimit() {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    // Reset counter every minute
    if (timeSinceLastRequest > 60000) {
      this.requestCount = 0;
    }
    
    // If we're approaching the limit, wait
    if (this.requestCount >= 900) {
      const waitTime = 60000 - timeSinceLastRequest;
      if (waitTime > 0) {
        console.log(`⏳ Rate limit approaching, waiting ${Math.ceil(waitTime/1000)} seconds...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        this.requestCount = 0;
      }
    }
    
    this.lastRequestTime = now;
    this.requestCount++;
  }

  /**
   * Enhanced API request handler with rate limiting
   */
  async makeRequest(endpoint, retries = 3) {
    await this.enforceRateLimit();
    
    const url = `${this.baseURL}${endpoint}`;
    
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        console.log(`🔄 [${this.requestCount}/1000] Fetching: ${endpoint} (Attempt ${attempt}/${retries})`);
        const response = await axios.get(url, {
          timeout: 30000,
          headers: {
            'User-Agent': 'FantasyFootball-DraftAssistant/2.0.0',
            'Accept': 'application/json'
          }
        });
        
        console.log(`✅ Success: ${endpoint}`);
        return response.data;
      } catch (error) {
        if (error.response?.status === 429) {
          console.log(`⏳ Rate limited, waiting 60 seconds...`);
          await new Promise(resolve => setTimeout(resolve, 60000));
          this.requestCount = 0;
        } else {
          console.log(`❌ Error on attempt ${attempt}: ${error.message}`);
        }
        
        if (attempt === retries) {
          throw new Error(`Failed to fetch ${endpoint} after ${retries} attempts: ${error.message}`);
        }
        
        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }
  }

  /**
   * Save data with metadata
   */
  async saveData(filename, data, metadata = {}) {
    try {
      const dataWithMetadata = {
        fetched_at: new Date().toISOString(),
        endpoint: metadata.endpoint || 'unknown',
        count: Array.isArray(data) ? data.length : Object.keys(data || {}).length,
        metadata,
        data
      };
      
      await fs.writeFile(filename, JSON.stringify(dataWithMetadata, null, 2));
      console.log(`💾 Saved: ${filename} (${dataWithMetadata.count} items)`);
    } catch (error) {
      console.error(`❌ Failed to save ${filename}:`, error.message);
    }
  }

  // ============================================================================
  // COMPREHENSIVE PLAYER DATA
  // ============================================================================

  /**
   * Get ALL NFL players (5MB response - use sparingly)
   */
  async getAllPlayers(saveToFile = true) {
    try {
      const players = await this.makeRequest('/players/nfl');
      
      if (saveToFile) {
        await this.saveData(`${this.dataDir}/players/all_players.json`, players, {
          endpoint: '/players/nfl',
          note: 'Complete NFL player database - use sparingly (5MB)',
          total_players: Object.keys(players).length
        });
        
        // Also save active players separately for faster access
        const activePlayers = {};
        const playersByPosition = {};
        const playersByTeam = {};
        
        for (const [id, player] of Object.entries(players)) {
          if (player.active) {
            activePlayers[id] = player;
            
            // Group by position
            if (!playersByPosition[player.position]) {
              playersByPosition[player.position] = {};
            }
            playersByPosition[player.position][id] = player;
            
            // Group by team
            if (player.team) {
              if (!playersByTeam[player.team]) {
                playersByTeam[player.team] = {};
              }
              playersByTeam[player.team][id] = player;
            }
          }
        }
        
        await this.saveData(`${this.dataDir}/players/active_players.json`, activePlayers, {
          note: 'Active players only for faster queries'
        });
        
        await this.saveData(`${this.dataDir}/players/players_by_position.json`, playersByPosition, {
          note: 'Players organized by position'
        });
        
        await this.saveData(`${this.dataDir}/players/players_by_team.json`, playersByTeam, {
          note: 'Players organized by team'
        });
      }
      
      console.log(`📊 Fetched ${Object.keys(players).length} NFL players`);
      return players;
    } catch (error) {
      console.error('❌ Failed to fetch players:', error.message);
      return null;
    }
  }

  /**
   * Get trending players (adds/drops) - CRITICAL for draft analysis
   */
  async getTrendingPlayers(type = 'add', lookbackHours = 24, limit = 50, saveToFile = true) {
    try {
      const endpoint = `/players/nfl/trending/${type}?lookback_hours=${lookbackHours}&limit=${limit}`;
      const trending = await this.makeRequest(endpoint);
      
      if (saveToFile) {
        await this.saveData(`${this.dataDir}/trending/trending_${type}_${lookbackHours}h.json`, trending, {
          endpoint,
          type,
          lookback_hours: lookbackHours,
          limit,
          note: 'Trending players based on add/drop activity - KEY for identifying sleepers and busts'
        });
      }
      
      console.log(`📈 Fetched ${trending.length} trending ${type} players (${lookbackHours}h lookback)`);
      return trending;
    } catch (error) {
      console.error(`❌ Failed to fetch trending ${type} players:`, error.message);
      return null;
    }
  }

  /**
   * Get all trending data (adds and drops)
   */
  async getAllTrendingData(saveToFile = true) {
    const results = {};
    
    // Different timeframes for trend analysis
    const timeframes = [24, 72, 168]; // 1 day, 3 days, 1 week
    
    for (const hours of timeframes) {
      results[`adds_${hours}h`] = await this.getTrendingPlayers('add', hours, 50, saveToFile);
      results[`drops_${hours}h`] = await this.getTrendingPlayers('drop', hours, 50, saveToFile);
    }
    
    return results;
  }

  // ============================================================================
  // NFL STATE AND CONTEXT
  // ============================================================================

  /**
   * Get current NFL state - ESSENTIAL for context
   */
  async getNFLState(saveToFile = true) {
    try {
      const state = await this.makeRequest('/state/nfl');
      
      if (saveToFile) {
        await this.saveData(`${this.dataDir}/state/nfl_state.json`, state, {
          endpoint: '/state/nfl',
          note: 'Current NFL season state - essential for context'
        });
      }
      
      console.log(`📅 Current NFL State: Week ${state.week}, Season ${state.season} (${state.season_type})`);
      return state;
    } catch (error) {
      console.error('❌ Failed to fetch NFL state:', error.message);
      return null;
    }
  }

  // ============================================================================
  // ENHANCED STATISTICS WITH WEEKLY BREAKDOWN
  // ============================================================================

  /**
   * Get comprehensive season statistics
   */
  async getEnhancedSeasonStats(season = this.currentSeason, type = 'regular', saveToFile = true) {
    try {
      const stats = await this.makeRequest(`/stats/nfl/${type}/${season}`);
      
      if (saveToFile) {
        await this.saveData(`${this.dataDir}/stats/${type}/season_${season}.json`, stats, {
          endpoint: `/stats/nfl/${type}/${season}`,
          season,
          type,
          note: `Complete ${type} season statistics for ${season}`
        });
        
        // Create position-specific stats files for faster queries
        const statsByPosition = {};
        const players = await this.loadData(`${this.dataDir}/players/all_players.json`);
        
        if (players?.data) {
          for (const [playerId, playerStats] of Object.entries(stats)) {
            const player = players.data[playerId];
            if (player && player.position) {
              if (!statsByPosition[player.position]) {
                statsByPosition[player.position] = {};
              }
              statsByPosition[player.position][playerId] = {
                ...playerStats,
                player_info: {
                  name: player.full_name,
                  team: player.team,
                  position: player.position
                }
              };
            }
          }
          
          await this.saveData(`${this.dataDir}/stats/${type}/season_${season}_by_position.json`, statsByPosition, {
            note: `Season ${season} stats organized by position for faster queries`
          });
        }
      }
      
      console.log(`📊 Fetched ${season} ${type} season stats (${Object.keys(stats).length} players)`);
      return stats;
    } catch (error) {
      console.error(`❌ Failed to fetch ${season} ${type} stats:`, error.message);
      return null;
    }
  }

  /**
   * Get all weekly stats for comprehensive analysis
   */
  async getAllWeeklyStats(season = this.currentSeason, type = 'regular', maxWeeks = 18, saveToFile = true) {
    const weeklyStats = {};
    const nflState = await this.getNFLState(false);
    const currentWeek = nflState?.week || 1;
    
    // Only fetch weeks that have been played
    const weeksToFetch = type === 'regular' ? Math.min(currentWeek, maxWeeks) : maxWeeks;
    
    for (let week = 1; week <= weeksToFetch; week++) {
      try {
        const stats = await this.makeRequest(`/stats/nfl/${type}/${season}/${week}`);
        weeklyStats[week] = stats;
        
        if (saveToFile) {
          await this.saveData(`${this.dataDir}/stats/${type}/week_${week}_${season}.json`, stats, {
            endpoint: `/stats/nfl/${type}/${season}/${week}`,
            season,
            type,
            week,
            note: `Week ${week} ${type} statistics for ${season}`
          });
        }
        
        console.log(`📊 Fetched Week ${week} ${season} ${type} stats (${Object.keys(stats).length} players)`);
      } catch (error) {
        console.error(`❌ Failed to fetch Week ${week} ${season} ${type} stats:`, error.message);
      }
    }
    
    return weeklyStats;
  }

  // ============================================================================
  // LEAGUE ANALYSIS (for understanding draft patterns)
  // ============================================================================

  /**
   * Analyze a specific league for draft insights
   */
  async analyzeLeague(leagueId, saveToFile = true) {
    try {
      const results = {};
      
      // Get league info
      results.league = await this.makeRequest(`/league/${leagueId}`);
      
      // Get rosters
      results.rosters = await this.makeRequest(`/league/${leagueId}/rosters`);
      
      // Get users
      results.users = await this.makeRequest(`/league/${leagueId}/users`);
      
      // Get drafts
      results.drafts = await this.makeRequest(`/league/${leagueId}/drafts`);
      
      // If there are drafts, get draft picks for analysis
      if (results.drafts && results.drafts.length > 0) {
        const latestDraft = results.drafts[0]; // Most recent draft
        results.draftPicks = await this.makeRequest(`/draft/${latestDraft.draft_id}/picks`);
        
        // Analyze draft patterns
        results.draftAnalysis = this.analyzeDraftPicks(results.draftPicks);
      }
      
      if (saveToFile) {
        await this.saveData(`${this.dataDir}/leagues/league_${leagueId}_analysis.json`, results, {
          endpoint: 'multiple',
          league_id: leagueId,
          note: 'Complete league analysis including draft patterns'
        });
      }
      
      console.log(`🏆 Analyzed league ${leagueId}: ${results.league?.name || 'Unknown'}`);
      return results;
    } catch (error) {
      console.error(`❌ Failed to analyze league ${leagueId}:`, error.message);
      return null;
    }
  }

  /**
   * Analyze draft picks to understand patterns
   */
  analyzeDraftPicks(picks) {
    if (!picks || picks.length === 0) return null;
    
    const analysis = {
      totalPicks: picks.length,
      rounds: Math.max(...picks.map(p => p.round)),
      positionDrafted: {},
      roundAnalysis: {},
      averagePickByPosition: {},
      firstPicksByPosition: {}
    };
    
    // Analyze each pick
    picks.forEach(pick => {
      const pos = pick.metadata?.position;
      const round = pick.round;
      const pickNo = pick.pick_no;
      
      if (pos) {
        // Count positions drafted
        analysis.positionDrafted[pos] = (analysis.positionDrafted[pos] || 0) + 1;
        
        // Track picks by round
        if (!analysis.roundAnalysis[round]) {
          analysis.roundAnalysis[round] = {};
        }
        analysis.roundAnalysis[round][pos] = (analysis.roundAnalysis[round][pos] || 0) + 1;
        
        // Calculate average pick position
        if (!analysis.averagePickByPosition[pos]) {
          analysis.averagePickByPosition[pos] = [];
        }
        analysis.averagePickByPosition[pos].push(pickNo);
        
        // Track first pick of each position
        if (!analysis.firstPicksByPosition[pos] || pickNo < analysis.firstPicksByPosition[pos]) {
          analysis.firstPicksByPosition[pos] = pickNo;
        }
      }
    });
    
    // Calculate averages
    for (const [pos, picks] of Object.entries(analysis.averagePickByPosition)) {
      analysis.averagePickByPosition[pos] = picks.reduce((a, b) => a + b, 0) / picks.length;
    }
    
    return analysis;
  }

  // ============================================================================
  // COMPREHENSIVE DATA COLLECTION
  // ============================================================================

  /**
   * Mega fetch - get ALL useful data for draft analysis
   */
  async fetchAllDraftData() {
    console.log('🚀 Starting COMPREHENSIVE Fantasy Football Data Collection...\n');
    console.log('=' .repeat(80));
    
    const startTime = Date.now();
    const results = {
      players: null,
      trending: {},
      state: null,
      stats: {},
      analysis: {}
    };

    try {
      // 1. NFL State (essential context)
      console.log('📅 Fetching NFL State...');
      results.state = await this.getNFLState();
      
      // 2. All Players (foundational data)
      console.log('\n📊 Fetching Complete Player Database...');
      results.players = await this.getAllPlayers();
      
      // 3. Trending Data (critical for identifying sleepers/busts)
      console.log('\n📈 Fetching Trending Player Data...');
      results.trending = await this.getAllTrendingData();
      
      // 4. Current Season Stats
      console.log('\n📊 Fetching Current Season Statistics...');
      if (results.state) {
        const currentSeason = results.state.season;
        results.stats.regular_current = await this.getEnhancedSeasonStats(currentSeason, 'regular');
        results.stats.preseason_current = await this.getEnhancedSeasonStats(currentSeason, 'preseason');
        
        // Get weekly stats up to current week
        results.stats.weekly_current = await this.getAllWeeklyStats(currentSeason, 'regular');
      }
      
      // 5. Previous Season for Comparison
      console.log('\n📊 Fetching Previous Season for Comparison...');
      const prevSeason = results.state ? (parseInt(results.state.season) - 1).toString() : '2023';
      results.stats.regular_previous = await this.getEnhancedSeasonStats(prevSeason, 'regular');
      results.stats.postseason_previous = await this.getEnhancedSeasonStats(prevSeason, 'postseason');
      
      // 6. Generate Analysis
      console.log('\n🧠 Generating Draft Analysis...');
      results.analysis = await this.generateDraftAnalysis(results);
      
      const endTime = Date.now();
      const duration = ((endTime - startTime) / 1000).toFixed(2);
      
      console.log('\n' + '=' .repeat(80));
      console.log(`✅ COMPREHENSIVE DATA COLLECTION COMPLETED in ${duration} seconds`);
      console.log(`📊 Total API Requests Made: ${this.requestCount}`);
      console.log('📂 All data saved to ./data/ directory with organized structure');
      console.log('🎯 Ready for advanced draft analysis and LLM integration!');
      console.log('=' .repeat(80));
      
      return results;
      
    } catch (error) {
      console.error('\n❌ Error during comprehensive data fetch:', error.message);
      throw error;
    }
  }

  /**
   * Generate comprehensive draft analysis
   */
  async generateDraftAnalysis(data) {
    const analysis = {
      season_context: data.state,
      player_summary: {},
      trending_insights: {},
      position_analysis: {},
      draft_recommendations: {},
      generated_at: new Date().toISOString()
    };
    
    // Player summary
    if (data.players) {
      const players = data.players;
      analysis.player_summary = {
        total_players: Object.keys(players).length,
        active_players: Object.values(players).filter(p => p.active).length,
        by_position: {},
        by_team: {}
      };
      
      // Analyze by position and team
      Object.values(players).forEach(player => {
        if (player.active) {
          analysis.player_summary.by_position[player.position] = 
            (analysis.player_summary.by_position[player.position] || 0) + 1;
          
          if (player.team) {
            analysis.player_summary.by_team[player.team] = 
              (analysis.player_summary.by_team[player.team] || 0) + 1;
          }
        }
      });
    }
    
    // Trending insights
    if (data.trending) {
      analysis.trending_insights = {
        hot_adds_24h: data.trending.adds_24h?.slice(0, 10) || [],
        hot_drops_24h: data.trending.drops_24h?.slice(0, 10) || [],
        note: 'Players trending up/down in past 24h - key for identifying sleepers and injury impacts'
      };
    }
    
    // Save analysis
    await this.saveData(`${this.dataDir}/analysis/draft_analysis.json`, analysis, {
      note: 'Comprehensive draft analysis generated from all collected data'
    });
    
    return analysis;
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  /**
   * Load data with error handling
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

  /**
   * Get data freshness
   */
  async getDataFreshness() {
    const files = [
      `${this.dataDir}/players/all_players.json`,
      `${this.dataDir}/trending/trending_add_24h.json`,
      `${this.dataDir}/state/nfl_state.json`,
      `${this.dataDir}/analysis/draft_analysis.json`
    ];
    
    const freshness = {};
    
    for (const file of files) {
      try {
        const data = await this.loadData(file);
        if (data?.fetched_at) {
          const age = Date.now() - new Date(data.fetched_at).getTime();
          freshness[path.basename(file)] = {
            fetched_at: data.fetched_at,
            age_hours: (age / (1000 * 60 * 60)).toFixed(1),
            is_fresh: age < 6 * 60 * 60 * 1000 // Less than 6 hours
          };
        }
      } catch (error) {
        freshness[path.basename(file)] = { error: 'File not found' };
      }
    }
    
    return freshness;
  }

  /**
   * Search players with enhanced filtering
   */
  async searchPlayers(query, filters = {}) {
    const players = await this.loadData(`${this.dataDir}/players/active_players.json`);
    if (!players?.data) return [];
    
    const searchTerm = query.toLowerCase();
    const results = [];
    
    for (const [id, player] of Object.entries(players.data)) {
      // Basic name search
      const matchesName = player.full_name?.toLowerCase().includes(searchTerm) ||
                         player.first_name?.toLowerCase().includes(searchTerm) ||
                         player.last_name?.toLowerCase().includes(searchTerm);
      
      if (matchesName) {
        // Apply filters
        let includePlayer = true;
        
        if (filters.position && player.position !== filters.position) {
          includePlayer = false;
        }
        
        if (filters.team && player.team !== filters.team) {
          includePlayer = false;
        }
        
        if (filters.maxAge && player.age > filters.maxAge) {
          includePlayer = false;
        }
        
        if (includePlayer) {
          results.push({ id, ...player });
        }
      }
    }
    
    return results.slice(0, 50); // Limit results
  }
}
