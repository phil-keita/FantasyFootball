#!/usr/bin/env node

/**
 * Ultimate Fantasy Draft Analyzer
 * Combines Sleeper API data with FantasyData CSV files for comprehensive analysis
 */

import fs from 'fs/promises';
import path from 'path';

class UltimateFantasyAnalyzer {
  constructor() {
    this.csvDir = './data-sources/fantasy-data';
    this.sleeperDir = './data-sources/sleeper-api';
  }

  /**
   * Parse CSV files
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
   * Load Sleeper data if available
   */
  async loadSleeperData() {
    try {
      const playersFile = path.join(this.sleeperDir, 'players.json');
      const playersData = await fs.readFile(playersFile, 'utf8');
      return JSON.parse(playersData);
    } catch (error) {
      console.log('⚠️ Sleeper data not available. Run Sleeper API fetch first.');
      return null;
    }
  }

  /**
   * Create comprehensive player profile
   */
  async createPlayerProfile(playerName) {
    console.log(`\n🔍 COMPREHENSIVE PLAYER PROFILE: ${playerName}`);
    console.log('='.repeat(60));

    const profile = {
      basic: null,
      adp: null,
      projections: null,
      efficiency: null,
      situational: {},
      sleeper: null
    };

    // 1. Basic info from ADP file
    const adpData = await this.parseCSV(path.join(this.csvDir, 'nfl-adp-20258202051.csv'));
    profile.basic = adpData.find(p => p.player?.toLowerCase().includes(playerName.toLowerCase()));

    if (!profile.basic) {
      console.log(`❌ Player "${playerName}" not found`);
      return null;
    }

    console.log(`\n📋 BASIC INFO`);
    console.log(`Name: ${profile.basic.player}`);
    console.log(`Team: ${profile.basic.team}`);
    console.log(`Position: ${profile.basic.pos}`);
    console.log(`Age: ${profile.basic.age}`);
    console.log(`Bye Week: ${profile.basic.bye_week}`);
    console.log(`ADP: ${profile.basic.adp} (${profile.basic.adp_pos_rank})`);

    // 2. Projections
    const projData = await this.parseCSV(path.join(this.csvDir, 'nfl-fantasy-football-weekly-projections-202582009.csv'));
    profile.projections = projData.find(p => p.player?.toLowerCase().includes(playerName.toLowerCase()));

    if (profile.projections) {
      console.log(`\n📊 PROJECTIONS`);
      console.log(`Projected PPR Points: ${profile.projections.fpts_ppr}`);
      console.log(`PPR Points Per Game: ${profile.projections.fpts_ppr_per_gp}`);
      
      if (profile.basic.pos === 'QB') {
        console.log(`Passing Yards: ${profile.projections.pass_yds}`);
        console.log(`Passing TDs: ${profile.projections.pass_td}`);
        console.log(`Rushing Yards: ${profile.projections.rush_yds}`);
        console.log(`Rushing TDs: ${profile.projections.rush_td}`);
      } else if (profile.basic.pos === 'RB') {
        console.log(`Rushing Yards: ${profile.projections.rush_yds}`);
        console.log(`Rushing TDs: ${profile.projections.rush_td}`);
        console.log(`Receptions: ${profile.projections.rec}`);
        console.log(`Receiving Yards: ${profile.projections.rec_yds}`);
        console.log(`Receiving TDs: ${profile.projections.rec_td}`);
      } else if (['WR', 'TE'].includes(profile.basic.pos)) {
        console.log(`Receptions: ${profile.projections.rec}`);
        console.log(`Receiving Yards: ${profile.projections.rec_yds}`);
        console.log(`Receiving TDs: ${profile.projections.rec_td}`);
      }
    }

    // 3. Position-specific efficiency metrics
    const posFiles = {
      'QB': ['nfl-advanced-qb-metrics-2025820533.csv', 'nfl-advanced-qb-efficiency-metrics-2025820639.csv'],
      'RB': ['nfl-advanced-rb-metrics-2025820544.csv', 'nfl-advanced-rb-efficiency-metrics-2025820655.csv'],
      'WR': ['nfl-advanced-wr-metrics-2025820612.csv', 'nfl-advanced-wr-efficiency-metrics-202582078.csv'],
      'TE': ['nfl-advanced-te-metrics-2025820625.csv', 'nfl-advanced-te-efficiency-metrics-2025820722.csv']
    };

    const playerPos = profile.basic.pos;
    if (posFiles[playerPos]) {
      console.log(`\n🔬 ADVANCED ${playerPos} METRICS`);
      
      for (const fileName of posFiles[playerPos]) {
        const metricsData = await this.parseCSV(path.join(this.csvDir, fileName));
        const playerMetrics = metricsData.find(p => p.player?.toLowerCase().includes(playerName.toLowerCase()));
        
        if (playerMetrics) {
          console.log(`\n📈 ${fileName.includes('efficiency') ? 'Efficiency' : 'Usage'} Metrics:`);
          
          // Show key metrics based on position
          if (playerPos === 'QB') {
            if (playerMetrics.CompletionPercentage) console.log(`   Completion %: ${playerMetrics.CompletionPercentage}`);
            if (playerMetrics.TruePasserRating) console.log(`   True Passer Rating: ${playerMetrics.TruePasserRating}`);
            if (playerMetrics.RedZoneCompletionPercentage) console.log(`   Red Zone Completion %: ${playerMetrics.RedZoneCompletionPercentage}`);
            if (playerMetrics.DeepBallCompletionPercentage) console.log(`   Deep Ball Completion %: ${playerMetrics.DeepBallCompletionPercentage}`);
          } else if (playerPos === 'RB') {
            if (playerMetrics.SnapShare) console.log(`   Snap Share: ${playerMetrics.SnapShare}`);
            if (playerMetrics.OpportunityShare) console.log(`   Opportunity Share: ${playerMetrics.OpportunityShare}`);
            if (playerMetrics.YardsCreatedPerCarry) console.log(`   Yards Created Per Carry: ${playerMetrics.YardsCreatedPerCarry}`);
            if (playerMetrics.JukeRate) console.log(`   Juke Rate: ${playerMetrics.JukeRate}`);
          } else if (['WR', 'TE'].includes(playerPos)) {
            if (playerMetrics.TargetShare) console.log(`   Target Share: ${playerMetrics.TargetShare}`);
            if (playerMetrics.TargetSeparation) console.log(`   Target Separation: ${playerMetrics.TargetSeparation}`);
            if (playerMetrics.TrueCatchRate) console.log(`   True Catch Rate: ${playerMetrics.TrueCatchRate}`);
            if (playerMetrics.YardsPerRouteRun) console.log(`   Yards Per Route Run: ${playerMetrics.YardsPerRouteRun}`);
          }
        }
      }
    }

    // 4. Red Zone Stats
    const redZoneData = await this.parseCSV(path.join(this.csvDir, 'nfl-fantasy-football-red-zone-stats-202582057.csv'));
    const playerRedZone = redZoneData.find(p => p.player?.toLowerCase().includes(playerName.toLowerCase()));
    
    if (playerRedZone) {
      console.log(`\n🎯 RED ZONE STATS`);
      console.log(`Red Zone PPR Points: ${playerRedZone.redzone_fpts_ppr}`);
      console.log(`Red Zone PPR Per Game: ${playerRedZone.redzone_fpts_ppr_per_gp}`);
      if (playerRedZone.redzone_rush_td) console.log(`Red Zone Rush TDs: ${playerRedZone.redzone_rush_td}`);
      if (playerRedZone.redzone_rec_td) console.log(`Red Zone Rec TDs: ${playerRedZone.redzone_rec_td}`);
    }

    // 5. Target Analysis (for pass catchers)
    if (['WR', 'TE', 'RB'].includes(playerPos)) {
      const targetsData = await this.parseCSV(path.join(this.csvDir, 'nfl-targets-2025820354.csv'));
      const playerTargets = targetsData.find(p => p.player?.toLowerCase().includes(playerName.toLowerCase()));
      
      if (playerTargets) {
        console.log(`\n🎯 TARGET ANALYSIS`);
        console.log(`Total Target Share: ${playerTargets.total_share}`);
        console.log(`Targets Per Game: ${playerTargets.total_per_gp}`);
        console.log(`Last 3 Games Target Share: ${playerTargets.last3_share}`);
        console.log(`Last 3 Games Targets/Game: ${playerTargets.last3_per_gp}`);
      }
    }

    // 6. Value Analysis
    console.log(`\n💰 VALUE ANALYSIS`);
    const adpNum = parseFloat(profile.basic.adp);
    const projPoints = parseFloat(profile.projections?.fpts_ppr || 0);
    
    if (projPoints > 0) {
      console.log(`Points Per ADP Pick: ${(projPoints / adpNum).toFixed(2)}`);
      
      // Compare to position averages
      const positionPlayers = adpData.filter(p => p.pos === playerPos).slice(0, 20);
      const avgADP = positionPlayers.reduce((sum, p) => sum + parseFloat(p.adp), 0) / positionPlayers.length;
      const adpValue = adpNum < avgADP ? 'EARLY' : adpNum > avgADP ? 'LATE' : 'AVERAGE';
      console.log(`Position ADP Tier: ${adpValue} (Avg top 20 ${playerPos}: ${avgADP.toFixed(1)})`);
    }

    return profile;
  }

  /**
   * Find best values (high projections, low ADP)
   */
  async findValues(position = null, limit = 20) {
    console.log(`\n💎 VALUE PICKS${position ? ` - ${position}` : ''}`);
    console.log('='.repeat(50));

    const adpData = await this.parseCSV(path.join(this.csvDir, 'nfl-adp-20258202051.csv'));
    const projData = await this.parseCSV(path.join(this.csvDir, 'nfl-fantasy-football-weekly-projections-202582009.csv'));

    const values = [];

    for (const player of adpData) {
      if (position && player.pos !== position) continue;
      
      const projection = projData.find(p => 
        p.player?.toLowerCase() === player.player?.toLowerCase()
      );
      
      if (projection && projection.fpts_ppr) {
        const adpNum = parseFloat(player.adp);
        const projPoints = parseFloat(projection.fpts_ppr);
        const valueScore = projPoints / adpNum;
        
        values.push({
          player: player.player,
          team: player.team,
          pos: player.pos,
          adp: adpNum,
          projPoints: projPoints,
          valueScore: valueScore
        });
      }
    }

    // Sort by value score
    values.sort((a, b) => b.valueScore - a.valueScore);

    console.log('\nTop Value Picks (Points per ADP pick):');
    values.slice(0, limit).forEach((player, index) => {
      console.log(`${(index + 1).toString().padStart(2)}. ${player.player.padEnd(20)} (${player.team}) ${player.pos} - ADP: ${player.adp.toFixed(1)}, Proj: ${player.projPoints}, Value: ${player.valueScore.toFixed(2)}`);
    });

    return values.slice(0, limit);
  }

  /**
   * Draft strategy recommendations
   */
  async getDraftStrategy() {
    console.log(`\n🎯 DRAFT STRATEGY RECOMMENDATIONS`);
    console.log('='.repeat(60));

    const adpData = await this.parseCSV(path.join(this.csvDir, 'nfl-adp-20258202051.csv'));
    
    // Analyze positional scarcity
    const positions = ['QB', 'RB', 'WR', 'TE'];
    const positionAnalysis = {};

    for (const pos of positions) {
      const posPlayers = adpData.filter(p => p.pos === pos);
      const top12 = posPlayers.slice(0, 12);
      const adpGap = parseFloat(top12[11]?.adp || 0) - parseFloat(top12[0]?.adp || 0);
      
      positionAnalysis[pos] = {
        count: posPlayers.length,
        adpSpread: adpGap,
        tier1Cutoff: parseFloat(top12[2]?.adp || 0),
        tier2Cutoff: parseFloat(top12[8]?.adp || 0)
      };
    }

    console.log('\n📊 POSITIONAL ANALYSIS:');
    Object.entries(positionAnalysis).forEach(([pos, analysis]) => {
      console.log(`\n${pos}:`);
      console.log(`   Available Players: ${analysis.count}`);
      console.log(`   ADP Spread (Top 12): ${analysis.adpSpread.toFixed(1)}`);
      console.log(`   Tier 1 Cutoff: ${analysis.tier1Cutoff}`);
      console.log(`   Tier 2 Cutoff: ${analysis.tier2Cutoff}`);
    });

    // Strategy recommendations
    console.log('\n🎯 RECOMMENDED STRATEGY:');
    
    if (positionAnalysis.RB.adpSpread > positionAnalysis.WR.adpSpread) {
      console.log('📈 RB EARLY: Running backs show more scarcity - prioritize in early rounds');
    } else {
      console.log('📈 WR DEPTH: Wide receivers have good depth - can wait on RB');
    }
    
    if (positionAnalysis.QB.tier1Cutoff < 50) {
      console.log('🎯 ELITE QB: Consider elite QB early if value aligns');
    } else {
      console.log('⏳ WAIT ON QB: Solid QB options available later');
    }

    console.log('🔍 TIGHT END: Stream position or target elite option');
    console.log('💎 VALUE FOCUS: Target players with high projections relative to ADP');

    return positionAnalysis;
  }
}

// CLI interface
async function main() {
  const analyzer = new UltimateFantasyAnalyzer();
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log('🏈 Ultimate Fantasy Draft Analyzer\n');
    console.log('Commands:');
    console.log('  node ultimate-analyzer.js profile <player>    # Comprehensive player analysis');
    console.log('  node ultimate-analyzer.js values [position]   # Find value picks');
    console.log('  node ultimate-analyzer.js strategy            # Draft strategy recommendations');
    console.log('\nExamples:');
    console.log('  node ultimate-analyzer.js profile "Josh Allen"');
    console.log('  node ultimate-analyzer.js values RB');
    console.log('  node ultimate-analyzer.js strategy');
    return;
  }

  const command = args[0];

  try {
    switch (command) {
      case 'profile':
        if (args[1]) {
          await analyzer.createPlayerProfile(args[1]);
        } else {
          console.log('Please provide a player name');
        }
        break;

      case 'values':
        const position = args[1] ? args[1].toUpperCase() : null;
        await analyzer.findValues(position);
        break;

      case 'strategy':
        await analyzer.getDraftStrategy();
        break;

      default:
        console.log('Unknown command. Use: profile, values, or strategy');
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
