#!/usr/bin/env node

/**
 * Simple Fantasy Data Explorer
 * Quickly explore and extract insights from your FantasyData CSV files
 */

import fs from 'fs/promises';
import path from 'path';

class SimpleDataExplorer {
  constructor() {
    this.csvDir = './data-sources/fantasy-data';
  }

  /**
   * Simple CSV parser that handles the format properly
   */
  async parseCSV(filePath) {
    try {
      const content = await fs.readFile(filePath, 'utf8');
      const lines = content.trim().split('\n');
      
      if (lines.length === 0) return [];
      
      const headers = lines[0].split(',').map(h => h.trim());
      const data = [];
      
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        const row = {};
        headers.forEach((header, index) => {
          row[header] = values[index] || '';
        });
        data.push(row);
      }
      
      return data;
    } catch (error) {
      console.error(`Error reading ${filePath}:`, error.message);
      return [];
    }
  }

  /**
   * Get top players from ADP data
   */
  async getTopADP() {
    console.log('🏆 TOP PLAYERS BY ADP');
    console.log('='.repeat(50));
    
    const adpFile = path.join(this.csvDir, 'nfl-adp-20258202051.csv');
    const data = await this.parseCSV(adpFile);
    
    console.log('\n📊 Overall Top 20:');
    data.slice(0, 20).forEach((player, index) => {
      console.log(`${(index + 1).toString().padStart(2)}. ${player.player?.padEnd(20)} (${player.team}) ${player.pos} - ADP: ${player.adp}`);
    });
    
    // By position
    const positions = ['QB', 'RB', 'WR', 'TE'];
    positions.forEach(pos => {
      console.log(`\n🎯 Top 10 ${pos}s:`);
      const positionPlayers = data.filter(p => p.pos === pos).slice(0, 10);
      positionPlayers.forEach((player, index) => {
        console.log(`${(index + 1).toString().padStart(2)}. ${player.player?.padEnd(20)} (${player.team}) - ADP: ${player.adp}`);
      });
    });
    
    return data;
  }

  /**
   * Search for a specific player
   */
  async searchPlayer(playerName) {
    console.log(`\n🔍 SEARCHING FOR: ${playerName}`);
    console.log('='.repeat(50));
    
    const files = [
      'nfl-adp-20258202051.csv',
      'nfl-rankings-20258202112.csv',
      'nfl-fantasy-football-weekly-projections-202582009.csv',
      'nfl-targets-2025820354.csv'
    ];
    
    for (const fileName of files) {
      const filePath = path.join(this.csvDir, fileName);
      const data = await this.parseCSV(filePath);
      
      const matches = data.filter(row => 
        row.player?.toLowerCase().includes(playerName.toLowerCase())
      );
      
      if (matches.length > 0) {
        console.log(`\n📁 Found in: ${fileName}`);
        matches.forEach(match => {
          console.log(`   Player: ${match.player}`);
          console.log(`   Team: ${match.team}`);
          console.log(`   Position: ${match.pos}`);
          if (match.adp) console.log(`   ADP: ${match.adp}`);
          if (match.rank) console.log(`   Rank: ${match.rank}`);
          if (match.fpts_ppr) console.log(`   Projected PPR Points: ${match.fpts_ppr}`);
          console.log('   ---');
        });
      }
    }
  }

  /**
   * Get fantasy projections
   */
  async getProjections() {
    console.log('\n📈 FANTASY PROJECTIONS');
    console.log('='.repeat(50));
    
    const projFile = path.join(this.csvDir, 'nfl-fantasy-football-weekly-projections-202582009.csv');
    const data = await this.parseCSV(projFile);
    
    const positions = ['QB', 'RB', 'WR', 'TE'];
    positions.forEach(pos => {
      console.log(`\n🎯 Top 10 ${pos} Projections (PPR):`);
      const positionPlayers = data
        .filter(p => p.pos === pos)
        .sort((a, b) => parseFloat(b.fpts_ppr || 0) - parseFloat(a.fpts_ppr || 0))
        .slice(0, 10);
      
      positionPlayers.forEach((player, index) => {
        console.log(`${(index + 1).toString().padStart(2)}. ${player.player?.padEnd(20)} (${player.team}) - ${player.fpts_ppr} pts`);
      });
    });
  }

  /**
   * Analyze red zone and target data
   */
  async getTargetAnalysis() {
    console.log('\n🎯 TARGET & RED ZONE ANALYSIS');
    console.log('='.repeat(50));
    
    // Targets data
    console.log('\n📊 Target Leaders:');
    const targetsFile = path.join(this.csvDir, 'nfl-targets-2025820354.csv');
    const targets = await this.parseCSV(targetsFile);
    
    // Show first few to see structure
    console.log('\nSample target data:');
    targets.slice(0, 5).forEach(player => {
      console.log(`${player.player} (${player.team}): ${JSON.stringify(player).substring(0, 100)}...`);
    });
    
    // Red zone data
    console.log('\n🏈 Red Zone Stats:');
    const redZoneFile = path.join(this.csvDir, 'nfl-fantasy-football-red-zone-stats-202582057.csv');
    const redZone = await this.parseCSV(redZoneFile);
    
    console.log('\nSample red zone data:');
    redZone.slice(0, 5).forEach(player => {
      console.log(`${player.player} (${player.team}): ${JSON.stringify(player).substring(0, 100)}...`);
    });
  }

  /**
   * Quick data overview
   */
  async quickOverview() {
    console.log('🏈 FANTASY DATA QUICK OVERVIEW');
    console.log('='.repeat(60));
    
    const files = await fs.readdir(this.csvDir);
    console.log(`\n📊 Available Data Files: ${files.length}`);
    
    for (const file of files) {
      if (file.endsWith('.csv')) {
        const filePath = path.join(this.csvDir, file);
        const data = await this.parseCSV(filePath);
        console.log(`📁 ${file}: ${data.length} records`);
        
        if (data.length > 0) {
          const headers = Object.keys(data[0]);
          console.log(`   Columns: ${headers.join(', ')}`);
        }
      }
    }
  }

  /**
   * Compare players
   */
  async comparePlayers(player1, player2) {
    console.log(`\n⚖️  COMPARING: ${player1} vs ${player2}`);
    console.log('='.repeat(50));
    
    const files = [
      'nfl-adp-20258202051.csv',
      'nfl-fantasy-football-weekly-projections-202582009.csv'
    ];
    
    const comparison = {};
    
    for (const fileName of files) {
      const filePath = path.join(this.csvDir, fileName);
      const data = await this.parseCSV(filePath);
      
      const p1Data = data.find(p => p.player?.toLowerCase().includes(player1.toLowerCase()));
      const p2Data = data.find(p => p.player?.toLowerCase().includes(player2.toLowerCase()));
      
      if (p1Data && p2Data) {
        comparison[fileName] = { player1: p1Data, player2: p2Data };
      }
    }
    
    Object.entries(comparison).forEach(([file, data]) => {
      console.log(`\n📁 ${file}:`);
      console.log(`   ${data.player1.player}: ADP ${data.player1.adp || 'N/A'}, Proj: ${data.player1.fpts_ppr || 'N/A'}`);
      console.log(`   ${data.player2.player}: ADP ${data.player2.adp || 'N/A'}, Proj: ${data.player2.fpts_ppr || 'N/A'}`);
    });
  }
}

// CLI interface
async function main() {
  const explorer = new SimpleDataExplorer();
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('🏈 Simple Fantasy Data Explorer\n');
    console.log('Commands:');
    console.log('  node simple-explorer.js overview          # Quick data overview');
    console.log('  node simple-explorer.js adp               # Top players by ADP');
    console.log('  node simple-explorer.js projections       # Fantasy projections');
    console.log('  node simple-explorer.js targets           # Target analysis');
    console.log('  node simple-explorer.js search <player>   # Search for player');
    console.log('  node simple-explorer.js compare <p1> <p2> # Compare two players');
    return;
  }
  
  const command = args[0];
  
  try {
    switch (command) {
      case 'overview':
        await explorer.quickOverview();
        break;
        
      case 'adp':
        await explorer.getTopADP();
        break;
        
      case 'projections':
        await explorer.getProjections();
        break;
        
      case 'targets':
        await explorer.getTargetAnalysis();
        break;
        
      case 'search':
        if (args[1]) {
          await explorer.searchPlayer(args[1]);
        } else {
          console.log('Please provide a player name');
        }
        break;
        
      case 'compare':
        if (args[1] && args[2]) {
          await explorer.comparePlayers(args[1], args[2]);
        } else {
          console.log('Please provide two player names');
        }
        break;
        
      default:
        console.log('Unknown command');
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
