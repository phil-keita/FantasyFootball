#!/usr/bin/env node

import { SleeperAPI } from './sleeper-api.js';
import readline from 'readline';

/**
 * Fantasy Football Draft Assistant - Main Application
 * Interactive tool for draft analysis and player research
 */

class DraftAssistant {
  constructor() {
    this.api = new SleeperAPI();
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
  }

  async start() {
    console.log('🏈 Welcome to Fantasy Football Draft Assistant!');
    console.log('=' .repeat(50));
    
    // Check if data exists
    const hasData = await this.checkDataAvailability();
    if (!hasData) {
      console.log('⚠️  No data found. Fetching data first...\n');
      await this.api.fetchAllData();
    }
    
    await this.showMainMenu();
  }

  async checkDataAvailability() {
    try {
      const players = await this.api.loadData('./data/players.json');
      const adp = await this.api.loadData('./data/adp/adp_ppr.json');
      return players && adp;
    } catch {
      return false;
    }
  }

  async showMainMenu() {
    console.log('\n🎯 What would you like to do?');
    console.log('1. Search for a player');
    console.log('2. View top players by position');
    console.log('3. Compare ADP across formats');
    console.log('4. View data summary');
    console.log('5. Refresh data');
    console.log('6. Exit');
    
    const choice = await this.getInput('\nEnter your choice (1-6): ');
    
    switch (choice.trim()) {
      case '1':
        await this.searchPlayer();
        break;
      case '2':
        await this.viewTopPlayers();
        break;
      case '3':
        await this.compareADP();
        break;
      case '4':
        await this.showSummary();
        break;
      case '5':
        await this.refreshData();
        break;
      case '6':
        console.log('👋 Happy drafting!');
        this.rl.close();
        return;
      default:
        console.log('❌ Invalid choice. Please try again.');
    }
    
    await this.showMainMenu();
  }

  async searchPlayer() {
    const query = await this.getInput('\n🔍 Enter player name: ');
    const player = await this.api.findPlayer(query);
    
    if (!player) {
      console.log(`❌ Player "${query}" not found.`);
      return;
    }
    
    console.log('\n📊 PLAYER INFORMATION');
    console.log('-' .repeat(40));
    console.log(`Name: ${player.full_name}`);
    console.log(`Position: ${player.position}`);
    console.log(`Team: ${player.team || 'Free Agent'}`);
    console.log(`Status: ${player.active ? 'Active' : 'Inactive'}`);
    console.log(`Fantasy Positions: ${player.fantasy_positions?.join(', ') || 'N/A'}`);
    console.log(`Years Pro: ${player.years_exp || 'N/A'}`);
    console.log(`Age: ${player.age || 'N/A'}`);
    
    // Show ADP data if available
    const adpFormats = ['ppr', 'half_ppr', 'standard', '2qb'];
    console.log('\n📈 AVERAGE DRAFT POSITION:');
    for (const format of adpFormats) {
      const adp = await this.api.loadData(`./data/adp/adp_${format}.json`);
      if (adp && adp[player.id]) {
        console.log(`${format.toUpperCase()}: ${adp[player.id].average_position?.toFixed(1) || 'N/A'}`);
      }
    }
  }

  async viewTopPlayers() {
    const position = await this.getInput('\n📍 Enter position (QB, RB, WR, TE, K, DEF): ');
    const format = await this.getInput('📈 Enter format (ppr, half_ppr, standard, 2qb) [default: ppr]: ') || 'ppr';
    const limit = parseInt(await this.getInput('🔢 How many players? [default: 20]: ')) || 20;
    
    const topPlayers = await this.api.getTopPlayersByPosition(position.toUpperCase(), format, limit);
    
    if (!topPlayers || topPlayers.length === 0) {
      console.log(`❌ No players found for position ${position.toUpperCase()}`);
      return;
    }
    
    console.log(`\n🌟 TOP ${topPlayers.length} ${position.toUpperCase()}s (${format.toUpperCase()} FORMAT)`);
    console.log('-' .repeat(60));
    console.log('Rank | Player Name               | Team | ADP');
    console.log('-' .repeat(60));
    
    topPlayers.forEach((player, index) => {
      const rank = (index + 1).toString().padStart(4);
      const name = (player.name || '').padEnd(25).substring(0, 25);
      const team = (player.team || '').padEnd(4);
      const adp = player.adp?.toFixed(1)?.padStart(5) || '  N/A';
      console.log(`${rank} | ${name} | ${team} | ${adp}`);
    });
  }

  async compareADP() {
    const playerName = await this.getInput('\n🔍 Enter player name to compare ADP: ');
    const player = await this.api.findPlayer(playerName);
    
    if (!player) {
      console.log(`❌ Player "${playerName}" not found.`);
      return;
    }
    
    console.log(`\n📊 ADP COMPARISON: ${player.full_name}`);
    console.log('-' .repeat(50));
    
    const formats = ['standard', 'ppr', 'half_ppr', '2qb'];
    for (const format of formats) {
      const adp = await this.api.loadData(`./data/adp/adp_${format}.json`);
      if (adp && adp[player.id]) {
        const position = adp[player.id].average_position?.toFixed(1) || 'N/A';
        const change = adp[player.id].change_24h ? 
          (adp[player.id].change_24h > 0 ? '📈' : '📉') : '';
        console.log(`${format.toUpperCase().padEnd(10)}: ${position.padStart(6)} ${change}`);
      } else {
        console.log(`${format.toUpperCase().padEnd(10)}: ${' N/A'.padStart(6)}`);
      }
    }
  }

  async showSummary() {
    console.log('\n📊 DATA SUMMARY');
    console.log('=' .repeat(40));
    
    const summary = await this.api.generateSummary();
    if (summary) {
      console.log(`Total Players: ${summary.total_players}`);
      console.log(`Active Players: ${summary.active_players}`);
      console.log(`Players with ADP: ${summary.adp_coverage}`);
      
      console.log('\nPlayers by Position:');
      Object.entries(summary.by_position)
        .sort(([,a], [,b]) => b - a)
        .forEach(([pos, count]) => {
          console.log(`  ${pos}: ${count}`);
        });
    }
  }

  async refreshData() {
    console.log('\n🔄 Refreshing data...');
    await this.api.fetchAllData();
    console.log('✅ Data refresh complete!');
  }

  getInput(prompt) {
    return new Promise((resolve) => {
      this.rl.question(prompt, (answer) => {
        resolve(answer);
      });
    });
  }
}

// Start the application
if (import.meta.url === `file://${process.argv[1]}`) {
  const app = new DraftAssistant();
  app.start().catch(console.error);
}
