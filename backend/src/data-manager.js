import fs from 'fs/promises';
import path from 'path';
import { parse } from 'csv-parse';
import { SleeperAPI } from './sleeper-api.js';

/**
 * Unified Data Manager for Fantasy Football Draft Assistant
 * Handles data from multiple sources: Sleeper API, FantasyData CSVs, and future sources
 */
export class DataManager {
  constructor() {
    this.dataSourcesDir = './data-sources';
    this.sleeperDir = `${this.dataSourcesDir}/sleeper-api`;
    this.fantasyDataDir = `${this.dataSourcesDir}/fantasy-data`;
    this.processedDir = `${this.dataSourcesDir}/processed`;
    this.currentSeason = 2024;
    
    this.sleeperAPI = new SleeperAPI();
    this.initDirectories();
  }

  /**
   * Initialize all data directories
   */
  async initDirectories() {
    const dirs = [
      this.dataSourcesDir,
      this.sleeperDir,
      this.fantasyDataDir, 
      this.processedDir,
      `${this.sleeperDir}/players`,
      `${this.sleeperDir}/adp`,
      `${this.sleeperDir}/stats`,
      `${this.sleeperDir}/leagues`,
      `${this.processedDir}/combined`,
      `${this.processedDir}/analysis`
    ];

    for (const dir of dirs) {
      try {
        await fs.mkdir(dir, { recursive: true });
      } catch (error) {
        // Directory already exists
      }
    }
  }

  // ============================================================================
  // SLEEPER API DATA MANAGEMENT
  // ============================================================================

  /**
   * Fetch all Sleeper API data and organize it properly
   */
  async fetchSleeperData() {
    console.log('🏈 Fetching Sleeper API Data...\n');
    
    // Update SleeperAPI to save to new location
    this.sleeperAPI.dataDir = this.sleeperDir;
    await this.sleeperAPI.initDataDirectories();
    
    const results = {
      players: null,
      adp: {},
      stats: {},
      leagues: [],
      drafts: []
    };

    try {
      // 1. Players
      console.log('📋 Fetching player data...');
      results.players = await this.sleeperAPI.getAllPlayers();

      // 2. ADP Data (all formats)
      console.log('\n📈 Fetching ADP data...');
      const adpFormats = ['standard', 'ppr', 'half_ppr', '2qb'];
      for (const format of adpFormats) {
        results.adp[format] = await this.sleeperAPI.getADP(format);
      }

      // 3. Statistics
      console.log('\n📊 Fetching statistics...');
      results.stats.regular_2024 = await this.sleeperAPI.getSeasonStats(2024, 'regular');
      results.stats.regular_2023 = await this.sleeperAPI.getSeasonStats(2023, 'regular');
      
      // Weekly stats for current season
      for (let week = 1; week <= 8; week++) {
        const weekStats = await this.sleeperAPI.getWeeklyStats(week, 2024, 'regular');
        if (weekStats) {
          results.stats[`week_${week}_2024`] = weekStats;
        }
      }

      // 4. News (if available)
      console.log('\n📰 Fetching news...');
      results.news = await this.sleeperAPI.getNFLNews();

      console.log('\n✅ Sleeper API data fetch completed');
      return results;

    } catch (error) {
      console.error('❌ Error fetching Sleeper data:', error.message);
      return results;
    }
  }

  // ============================================================================
  // FANTASY DATA CSV MANAGEMENT
  // ============================================================================

  /**
   * Parse and process all FantasyData CSV files
   */
  async processFantasyDataCSVs() {
    console.log('📊 Processing FantasyData CSV files...\n');
    
    try {
      const csvFiles = await fs.readdir(this.fantasyDataDir);
      const csvData = {};

      for (const file of csvFiles) {
        if (file.endsWith('.csv')) {
          const filePath = path.join(this.fantasyDataDir, file);
          const dataType = this.categorizeCSVFile(file);
          
          console.log(`📄 Processing: ${file} (${dataType})`);
          
          const data = await this.parseCSV(filePath);
          csvData[dataType] = csvData[dataType] || [];
          csvData[dataType].push({
            filename: file,
            data: data,
            recordCount: data.length,
            processedAt: new Date().toISOString()
          });
        }
      }

      // Save processed CSV data
      await this.saveData(`${this.processedDir}/fantasy-data-csvs.json`, csvData);
      
      console.log('\n✅ FantasyData CSV processing completed');
      return csvData;

    } catch (error) {
      console.error('❌ Error processing FantasyData CSVs:', error.message);
      return null;
    }
  }

  /**
   * Categorize CSV files based on filename
   */
  categorizeCSVFile(filename) {
    const categories = {
      'adp': ['adp'],
      'projections': ['projection', 'dfs'],
      'advanced-metrics': ['advanced', 'efficiency'],
      'rankings': ['ranking'],
      'stats': ['stats', 'leaders', 'red-zone', 'third-down', 'snap', 'targets']
    };

    for (const [category, keywords] of Object.entries(categories)) {
      if (keywords.some(keyword => filename.toLowerCase().includes(keyword))) {
        return category;
      }
    }

    return 'miscellaneous';
  }

  /**
   * Parse CSV file
   */
  async parseCSV(filePath) {
    return new Promise((resolve, reject) => {
      const results = [];
      const parser = parse({
        columns: true,
        skip_empty_lines: true,
        trim: true
      });

      parser.on('readable', function() {
        let record;
        while (record = parser.read()) {
          results.push(record);
        }
      });

      parser.on('error', function(err) {
        reject(err);
      });

      parser.on('end', function() {
        resolve(results);
      });

      fs.readFile(filePath, 'utf8').then(data => {
        parser.write(data);
        parser.end();
      }).catch(reject);
    });
  }

  // ============================================================================
  // DATA COMBINATION AND PROCESSING
  // ============================================================================

  /**
   * Combine data from all sources into unified player profiles
   */
  async combineAllData() {
    console.log('🔄 Combining data from all sources...\n');

    try {
      // Load Sleeper data
      const sleeperPlayers = await this.loadData(`${this.sleeperDir}/players.json`);
      const sleeperADP = await this.loadData(`${this.sleeperDir}/adp/adp_ppr.json`);
      const sleeper2024Stats = await this.loadData(`${this.sleeperDir}/stats/regular/season_2024.json`);

      // Load processed FantasyData
      const fantasyDataCSVs = await this.loadData(`${this.processedDir}/fantasy-data-csvs.json`);

      if (!sleeperPlayers) {
        throw new Error('Sleeper player data not found. Run fetch-sleeper-data first.');
      }

      const combinedData = {};

      // Start with Sleeper player data as base
      for (const [playerId, player] of Object.entries(sleeperPlayers)) {
        if (player.active) {
          combinedData[playerId] = {
            // Sleeper base data
            sleeper_id: playerId,
            name: player.full_name,
            first_name: player.first_name,
            last_name: player.last_name,
            position: player.position,
            team: player.team,
            age: player.age,
            years_exp: player.years_exp,
            college: player.college,
            height: player.height,
            weight: player.weight,
            
            // Sleeper ADP data
            adp: sleeperADP?.[playerId]?.average_position || null,
            adp_change: sleeperADP?.[playerId]?.change_24h || null,
            
            // Sleeper 2024 stats
            sleeper_stats_2024: sleeper2024Stats?.[playerId] || null,
            
            // Placeholder for FantasyData enrichment
            fantasy_data: {},
            
            // Combined analysis
            analysis: {
              data_sources: ['sleeper'],
              last_updated: new Date().toISOString()
            }
          };
        }
      }

      // Enrich with FantasyData CSV information
      if (fantasyDataCSVs) {
        await this.enrichWithFantasyData(combinedData, fantasyDataCSVs);
      }

      // Save combined data
      await this.saveData(`${this.processedDir}/combined/unified-player-data.json`, combinedData);
      
      // Generate summary statistics
      const summary = this.generateDataSummary(combinedData);
      await this.saveData(`${this.processedDir}/analysis/data-summary.json`, summary);

      console.log('\n✅ Data combination completed');
      console.log(`📊 Combined data for ${Object.keys(combinedData).length} players`);
      
      return combinedData;

    } catch (error) {
      console.error('❌ Error combining data:', error.message);
      return null;
    }
  }

  /**
   * Enrich player data with FantasyData CSV information
   */
  async enrichWithFantasyData(combinedData, fantasyDataCSVs) {
    console.log('🔗 Enriching with FantasyData...');

    for (const [category, csvFiles] of Object.entries(fantasyDataCSVs)) {
      for (const csvFile of csvFiles) {
        for (const record of csvFile.data) {
          // Try to match players by name (this is the tricky part)
          const matchedPlayerId = this.matchPlayerByName(record, combinedData);
          
          if (matchedPlayerId) {
            if (!combinedData[matchedPlayerId].fantasy_data[category]) {
              combinedData[matchedPlayerId].fantasy_data[category] = [];
            }
            
            combinedData[matchedPlayerId].fantasy_data[category].push({
              source_file: csvFile.filename,
              data: record
            });
            
            // Add to data sources
            if (!combinedData[matchedPlayerId].analysis.data_sources.includes('fantasy_data')) {
              combinedData[matchedPlayerId].analysis.data_sources.push('fantasy_data');
            }
          }
        }
      }
    }
  }

  /**
   * Match FantasyData CSV records to Sleeper players by name
   */
  matchPlayerByName(csvRecord, sleeperData) {
    // Common name fields in FantasyData CSVs
    const nameFields = ['Name', 'Player', 'PlayerName', 'name', 'player_name'];
    
    let csvPlayerName = null;
    for (const field of nameFields) {
      if (csvRecord[field]) {
        csvPlayerName = csvRecord[field].trim();
        break;
      }
    }

    if (!csvPlayerName) return null;

    // Normalize name for matching
    const normalizedCSVName = this.normalizeName(csvPlayerName);

    // Search through Sleeper data for matches
    for (const [playerId, player] of Object.entries(sleeperData)) {
      const normalizedSleeperName = this.normalizeName(player.name);
      
      if (normalizedCSVName === normalizedSleeperName) {
        return playerId;
      }
      
      // Also try first + last name combinations
      if (player.first_name && player.last_name) {
        const normalizedFullName = this.normalizeName(`${player.first_name} ${player.last_name}`);
        if (normalizedCSVName === normalizedFullName) {
          return playerId;
        }
      }
    }

    return null;
  }

  /**
   * Normalize player names for matching
   */
  normalizeName(name) {
    return name
      .toLowerCase()
      .replace(/[^a-z\s]/g, '') // Remove special characters
      .replace(/\s+/g, ' ')     // Normalize spaces
      .trim();
  }

  /**
   * Generate summary statistics for combined data
   */
  generateDataSummary(combinedData) {
    const summary = {
      total_players: Object.keys(combinedData).length,
      by_position: {},
      by_team: {},
      data_source_coverage: {
        sleeper_only: 0,
        fantasy_data_enriched: 0,
        adp_available: 0,
        stats_2024_available: 0
      },
      generated_at: new Date().toISOString()
    };

    for (const player of Object.values(combinedData)) {
      // Count by position
      summary.by_position[player.position] = (summary.by_position[player.position] || 0) + 1;
      
      // Count by team
      if (player.team) {
        summary.by_team[player.team] = (summary.by_team[player.team] || 0) + 1;
      }
      
      // Data source coverage
      if (player.analysis.data_sources.includes('fantasy_data')) {
        summary.data_source_coverage.fantasy_data_enriched++;
      } else {
        summary.data_source_coverage.sleeper_only++;
      }
      
      if (player.adp) {
        summary.data_source_coverage.adp_available++;
      }
      
      if (player.sleeper_stats_2024) {
        summary.data_source_coverage.stats_2024_available++;
      }
    }

    return summary;
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  /**
   * Save data to JSON file
   */
  async saveData(filepath, data) {
    try {
      await fs.writeFile(filepath, JSON.stringify(data, null, 2));
      console.log(`💾 Saved: ${filepath}`);
    } catch (error) {
      console.error(`❌ Failed to save ${filepath}:`, error.message);
    }
  }

  /**
   * Load data from JSON file
   */
  async loadData(filepath) {
    try {
      const data = await fs.readFile(filepath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.log(`⚠️ Could not load ${filepath}: ${error.message}`);
      return null;
    }
  }

  /**
   * Get all available data for a specific player
   */
  async getPlayerProfile(playerId) {
    const combinedData = await this.loadData(`${this.processedDir}/combined/unified-player-data.json`);
    return combinedData?.[playerId] || null;
  }

  /**
   * Search players across all data sources
   */
  async searchPlayers(query) {
    const combinedData = await this.loadData(`${this.processedDir}/combined/unified-player-data.json`);
    if (!combinedData) return [];

    const normalizedQuery = this.normalizeName(query);
    const results = [];

    for (const [playerId, player] of Object.entries(combinedData)) {
      const normalizedName = this.normalizeName(player.name);
      if (normalizedName.includes(normalizedQuery)) {
        results.push({ id: playerId, ...player });
      }
    }

    return results.sort((a, b) => a.name.localeCompare(b.name));
  }

  /**
   * Get top players by position with all available data
   */
  async getTopPlayersByPosition(position, limit = 50) {
    const combinedData = await this.loadData(`${this.processedDir}/combined/unified-player-data.json`);
    if (!combinedData) return [];

    const positionPlayers = Object.values(combinedData)
      .filter(player => player.position === position.toUpperCase())
      .sort((a, b) => {
        // Sort by ADP if available, otherwise alphabetically
        if (a.adp && b.adp) return a.adp - b.adp;
        if (a.adp && !b.adp) return -1;
        if (!a.adp && b.adp) return 1;
        return a.name.localeCompare(b.name);
      })
      .slice(0, limit);

    return positionPlayers;
  }

  /**
   * Execute complete data pipeline
   */
  async executeFullDataPipeline() {
    console.log('🚀 Executing Full Data Pipeline...\n');
    console.log('=' .repeat(60));

    try {
      // Step 1: Fetch Sleeper API data
      console.log('STEP 1: Sleeper API Data');
      console.log('-' .repeat(30));
      await this.fetchSleeperData();

      // Step 2: Process FantasyData CSVs
      console.log('\nSTEP 2: FantasyData CSV Processing');
      console.log('-' .repeat(30));
      await this.processFantasyDataCSVs();

      // Step 3: Combine all data
      console.log('\nSTEP 3: Data Combination');
      console.log('-' .repeat(30));
      const combinedData = await this.combineAllData();

      // Step 4: Generate final summary
      console.log('\nSTEP 4: Final Summary');
      console.log('-' .repeat(30));
      const summary = await this.loadData(`${this.processedDir}/analysis/data-summary.json`);
      
      if (summary) {
        console.log(`📊 Total Players: ${summary.total_players}`);
        console.log(`🔗 Fantasy Data Enriched: ${summary.data_source_coverage.fantasy_data_enriched}`);
        console.log(`📈 ADP Available: ${summary.data_source_coverage.adp_available}`);
        console.log(`📊 2024 Stats Available: ${summary.data_source_coverage.stats_2024_available}`);
      }

      console.log('\n' + '=' .repeat(60));
      console.log('✅ FULL DATA PIPELINE COMPLETED!');
      console.log('📂 All data available in data-sources/ directory');
      console.log('🎯 Ready for draft analysis!');

      return combinedData;

    } catch (error) {
      console.error('❌ Data pipeline failed:', error.message);
      return null;
    }
  }
}
