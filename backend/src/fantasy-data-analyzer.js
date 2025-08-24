#!/usr/bin/env node

/**
 * Fantasy Data CSV Analyzer
 * Analyzes all the FantasyData CSV files for draft insights
 */

import fs from 'fs/promises';
import path from 'path';

class FantasyDataAnalyzer {
  constructor() {
    this.csvDir = './data-sources/fantasy-data';
    this.csvFiles = [
      'nfl-adp-20258202051.csv',
      'nfl-advanced-qb-efficiency-metrics-2025820639.csv',
      'nfl-advanced-qb-metrics-2025820533.csv',
      'nfl-advanced-rb-efficiency-metrics-2025820655.csv',
      'nfl-advanced-rb-metrics-2025820544.csv',
      'nfl-advanced-te-efficiency-metrics-2025820722.csv',
      'nfl-advanced-te-metrics-2025820625.csv',
      'nfl-advanced-wr-efficiency-metrics-202582078.csv',
      'nfl-advanced-wr-metrics-2025820612.csv',
      'nfl-daily-fantasy-football-salary-and-projection-tool-20258202028.csv',
      'nfl-dfs-projections-20258202016.csv',
      'nfl-fantasy-football-leaders-2025820028.csv',
      'nfl-fantasy-football-red-zone-stats-202582057.csv',
      'nfl-fantasy-football-third-down-stats-2025820519.csv',
      'nfl-fantasy-football-weekly-projections-202582009.csv',
      'nfl-fantasy-football-weekly-projections-2025820213.csv',
      'nfl-nfl-snap-counts-2025820451.csv',
      'nfl-rankings-20258202112.csv',
      'nfl-targets-2025820354.csv'
    ];
  }

  /**
   * Simple CSV parser
   */
  async parseCSV(filePath) {
    try {
      const content = await fs.readFile(filePath, 'utf8');
      const lines = content.trim().split('\n');
      
      if (lines.length === 0) return [];
      
      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
      const data = [];
      
      for (let i = 1; i < lines.length; i++) {
        const values = this.parseCSVLine(lines[i]);
        if (values.length >= headers.length - 1) { // Allow some flexibility
          const row = {};
          headers.forEach((header, index) => {
            row[header] = values[index] || '';
          });
          data.push(row);
        }
      }
      
      return data;
    } catch (error) {
      console.error(`Error reading ${filePath}:`, error.message);
      return [];
    }
  }

  parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim().replace(/"/g, ''));
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current.trim().replace(/"/g, ''));
    return result;
  }

  /**
   * Analyze a specific CSV file
   */
  async analyzeCSV(fileName) {
    const filePath = path.join(this.csvDir, fileName);
    console.log(`\n📊 Analyzing: ${fileName}`);
    console.log('-'.repeat(50));
    
    const data = await this.parseCSV(filePath);
    
    if (data.length === 0) {
      console.log('❌ No data found or file could not be parsed');
      return null;
    }
    
    console.log(`📈 Records: ${data.length}`);
    console.log(`📋 Columns: ${Object.keys(data[0]).length}`);
    
    // Show column headers
    console.log('\n🏷️ Available Columns:');
    Object.keys(data[0]).forEach((col, index) => {
      console.log(`   ${index + 1}. ${col}`);
    });
    
    // Show sample data
    console.log('\n📝 Sample Records (first 3):');
    data.slice(0, 3).forEach((row, index) => {
      console.log(`\n   Record ${index + 1}:`);
      Object.entries(row).slice(0, 5).forEach(([key, value]) => {
        console.log(`     ${key}: ${value}`);
      });
      if (Object.keys(row).length > 5) {
        console.log(`     ... and ${Object.keys(row).length - 5} more fields`);
      }
    });
    
    return data;
  }

  /**
   * Find key fantasy metrics in the data
   */
  async findFantasyMetrics() {
    console.log('🎯 SEARCHING FOR KEY FANTASY METRICS');
    console.log('='.repeat(60));
    
    const keyMetrics = {
      adp: [],
      projections: [],
      rankings: [],
      redZone: [],
      targets: [],
      snapCounts: []
    };
    
    for (const fileName of this.csvFiles) {
      const data = await this.parseCSV(path.join(this.csvDir, fileName));
      
      if (data.length === 0) continue;
      
      const headers = Object.keys(data[0]).map(h => h.toLowerCase());
      
      // Check for ADP data
      if (headers.some(h => h.includes('adp') || h.includes('draft'))) {
        keyMetrics.adp.push({ file: fileName, data: data.slice(0, 5) });
      }
      
      // Check for projections
      if (headers.some(h => h.includes('projection') || h.includes('fantasy'))) {
        keyMetrics.projections.push({ file: fileName, data: data.slice(0, 5) });
      }
      
      // Check for rankings
      if (headers.some(h => h.includes('rank') || h.includes('tier'))) {
        keyMetrics.rankings.push({ file: fileName, data: data.slice(0, 5) });
      }
      
      // Check for red zone stats
      if (headers.some(h => h.includes('red') || h.includes('goal'))) {
        keyMetrics.redZone.push({ file: fileName, data: data.slice(0, 5) });
      }
      
      // Check for target data
      if (headers.some(h => h.includes('target') || h.includes('reception'))) {
        keyMetrics.targets.push({ file: fileName, data: data.slice(0, 5) });
      }
      
      // Check for snap counts
      if (headers.some(h => h.includes('snap') || h.includes('play'))) {
        keyMetrics.snapCounts.push({ file: fileName, data: data.slice(0, 5) });
      }
    }
    
    // Display findings
    Object.entries(keyMetrics).forEach(([metric, files]) => {
      if (files.length > 0) {
        console.log(`\n📊 ${metric.toUpperCase()} DATA (${files.length} files):`);
        files.forEach(({ file, data }) => {
          console.log(`   📁 ${file}`);
          if (data.length > 0) {
            console.log(`      Sample player: ${data[0].PlayerName || data[0].Name || 'Unknown'}`);
          }
        });
      }
    });
    
    return keyMetrics;
  }

  /**
   * Search for a specific player across all datasets
   */
  async searchPlayer(playerName) {
    console.log(`\n🔍 SEARCHING FOR: ${playerName}`);
    console.log('='.repeat(50));
    
    const playerData = {};
    
    for (const fileName of this.csvFiles) {
      const data = await this.parseCSV(path.join(this.csvDir, fileName));
      
      if (data.length === 0) continue;
      
      // Search for player in this dataset
      const matches = data.filter(row => {
        const name = (row.PlayerName || row.Name || '').toLowerCase();
        return name.includes(playerName.toLowerCase());
      });
      
      if (matches.length > 0) {
        playerData[fileName] = matches;
        console.log(`\n📁 Found in: ${fileName}`);
        matches.forEach((match, index) => {
          console.log(`   Match ${index + 1}:`);
          Object.entries(match).slice(0, 8).forEach(([key, value]) => {
            if (value) console.log(`     ${key}: ${value}`);
          });
        });
      }
    }
    
    if (Object.keys(playerData).length === 0) {
      console.log(`❌ Player "${playerName}" not found in any dataset`);
    }
    
    return playerData;
  }

  /**
   * Get top players by position from available data
   */
  async getTopPlayersByPosition(position) {
    console.log(`\n🏆 TOP ${position.toUpperCase()} PLAYERS`);
    console.log('='.repeat(40));
    
    // Look for ADP and rankings files
    const adpFile = this.csvFiles.find(f => f.includes('adp'));
    const rankingsFile = this.csvFiles.find(f => f.includes('rankings'));
    
    if (adpFile) {
      console.log(`\n📈 From ADP Data (${adpFile}):`);
      const adpData = await this.parseCSV(path.join(this.csvDir, adpFile));
      const positionPlayers = adpData
        .filter(p => (p.Position || p.FantasyPosition || '').toUpperCase() === position.toUpperCase())
        .slice(0, 10);
      
      positionPlayers.forEach((player, index) => {
        const name = player.PlayerName || player.Name;
        const adp = player.ADP || player.OverallRank;
        const team = player.Team;
        console.log(`   ${index + 1}. ${name} (${team}) - ADP: ${adp}`);
      });
    }
    
    if (rankingsFile) {
      console.log(`\n🏆 From Rankings Data (${rankingsFile}):`);
      const rankingsData = await this.parseCSV(path.join(this.csvDir, rankingsFile));
      const positionPlayers = rankingsData
        .filter(p => (p.Position || p.FantasyPosition || '').toUpperCase() === position.toUpperCase())
        .slice(0, 10);
      
      positionPlayers.forEach((player, index) => {
        const name = player.PlayerName || player.Name;
        const rank = player.Rank || player.OverallRank;
        const team = player.Team;
        console.log(`   ${index + 1}. ${name} (${team}) - Rank: ${rank}`);
      });
    }
  }

  /**
   * Full analysis of all data
   */
  async analyzeAll() {
    console.log('🏈 FANTASY DATA COMPLETE ANALYSIS');
    console.log('='.repeat(60));
    
    // 1. Analyze each file
    for (const fileName of this.csvFiles) {
      await this.analyzeCSV(fileName);
    }
    
    // 2. Find key metrics
    console.log('\n\n');
    await this.findFantasyMetrics();
    
    // 3. Show top players for each position
    for (const position of ['QB', 'RB', 'WR', 'TE']) {
      await this.getTopPlayersByPosition(position);
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ ANALYSIS COMPLETE!');
    console.log('📊 You have comprehensive fantasy data from multiple sources');
    console.log('🎯 Ready for draft analysis and player research');
    console.log('='.repeat(60));
  }
}

// CLI interface
async function main() {
  const analyzer = new FantasyDataAnalyzer();
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('🏈 Fantasy Data Analyzer');
    console.log('\nUsage:');
    console.log('  node fantasy-data-analyzer.js analyze     # Analyze all data');
    console.log('  node fantasy-data-analyzer.js metrics     # Find key metrics');
    console.log('  node fantasy-data-analyzer.js search <player>  # Search for player');
    console.log('  node fantasy-data-analyzer.js top <position>   # Top players by position');
    return;
  }
  
  const command = args[0];
  
  switch (command) {
    case 'analyze':
      await analyzer.analyzeAll();
      break;
      
    case 'metrics':
      await analyzer.findFantasyMetrics();
      break;
      
    case 'search':
      if (args[1]) {
        await analyzer.searchPlayer(args[1]);
      } else {
        console.log('Please provide a player name');
      }
      break;
      
    case 'top':
      if (args[1]) {
        await analyzer.getTopPlayersByPosition(args[1]);
      } else {
        console.log('Please provide a position (QB, RB, WR, TE)');
      }
      break;
      
    default:
      console.log('Unknown command. Use: analyze, metrics, search, or top');
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}
