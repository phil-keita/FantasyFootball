/**
 * Fantasy Football Data Analysis Utilities
 * Helper functions for analyzing player data and generating insights
 */

export class FantasyAnalyzer {
  constructor(sleeperAPI) {
    this.api = sleeperAPI;
  }

  /**
   * Calculate value over replacement player (VORP)
   */
  async calculateVORP(position, format = 'ppr') {
    const topPlayers = await this.api.getTopPlayersByPosition(position, format, 50);
    if (!topPlayers || topPlayers.length < 20) return null;

    // Replacement level is typically around the 12th-15th player at each position
    const replacementIndex = position === 'QB' ? 12 : 
                           position === 'TE' ? 8 : 15;
    
    const replacementADP = topPlayers[replacementIndex]?.adp || 0;
    
    return topPlayers.map(player => ({
      ...player,
      vorp: replacementADP - (player.adp || 0)
    }));
  }

  /**
   * Identify sleepers (players with low ADP but high potential)
   */
  async findSleepers(position, format = 'ppr', adpThreshold = 100) {
    const players = await this.api.getTopPlayersByPosition(position, format, 200);
    if (!players) return null;

    // Filter players drafted after the threshold
    const lateDraftPlayers = players.filter(p => p.adp > adpThreshold);
    
    // Simple heuristic: look for young players or players on good teams
    return lateDraftPlayers.filter(player => {
      return player.age < 26 || 
             ['BUF', 'KC', 'SF', 'PHI', 'DAL', 'MIA'].includes(player.team);
    }).slice(0, 10);
  }

  /**
   * Calculate positional scarcity
   */
  async calculatePositionalScarcity() {
    const positions = ['QB', 'RB', 'WR', 'TE'];
    const scarcity = {};

    for (const position of positions) {
      const players = await this.api.getTopPlayersByPosition(position, 'ppr', 100);
      if (players && players.length > 20) {
        // Calculate ADP variance - higher variance suggests more scarcity
        const adps = players.slice(0, 20).map(p => p.adp).filter(Boolean);
        const avg = adps.reduce((a, b) => a + b, 0) / adps.length;
        const variance = adps.reduce((acc, adp) => acc + Math.pow(adp - avg, 2), 0) / adps.length;
        
        scarcity[position] = {
          variance: variance,
          topTierCutoff: players[5]?.adp || 0,
          depthScore: players.filter(p => p.adp < 150).length
        };
      }
    }

    return scarcity;
  }

  /**
   * Generate draft strategy recommendations
   */
  async generateDraftStrategy(leagueSize = 12, format = 'ppr') {
    const scarcity = await this.calculatePositionalScarcity();
    const strategy = {
      earlyRounds: [],
      middleRounds: [],
      lateRounds: [],
      sleepers: {}
    };

    // Early rounds (1-6)
    if (scarcity.RB?.variance > scarcity.WR?.variance) {
      strategy.earlyRounds.push('Prioritize RBs early due to position scarcity');
    } else {
      strategy.earlyRounds.push('WRs show good depth, consider RB/WR flex');
    }

    // Add QB strategy
    const topQBs = await this.api.getTopPlayersByPosition('QB', format, 15);
    if (topQBs && topQBs[0]?.adp < 30) {
      strategy.earlyRounds.push('Elite QB available early - consider if value aligns');
    } else {
      strategy.middleRounds.push('Wait on QB - good value in middle rounds');
    }

    // Find sleepers for each position
    for (const position of ['QB', 'RB', 'WR', 'TE']) {
      const sleepers = await this.findSleepers(position, format);
      if (sleepers && sleepers.length > 0) {
        strategy.sleepers[position] = sleepers.slice(0, 3);
      }
    }

    return strategy;
  }

  /**
   * Compare player across different scoring formats
   */
  async comparePlayerAcrossFormats(playerId) {
    const formats = ['standard', 'ppr', 'half_ppr', '2qb'];
    const comparison = {};

    for (const format of formats) {
      const adp = await this.api.loadData(`./data/adp/adp_${format}.json`);
      if (adp && adp[playerId]) {
        comparison[format] = {
          adp: adp[playerId].average_position,
          change24h: adp[playerId].change_24h || 0
        };
      }
    }

    return comparison;
  }

  /**
   * Identify trending players (biggest ADP movements)
   */
  async getTrendingPlayers(format = 'ppr', limit = 20) {
    const adp = await this.api.loadData(`./data/adp/adp_${format}.json`);
    const players = await this.api.loadData('./data/players.json');
    
    if (!adp || !players) return null;

    const trending = [];
    
    for (const [playerId, adpData] of Object.entries(adp)) {
      if (adpData.change_24h && Math.abs(adpData.change_24h) > 0.5) {
        const player = players[playerId];
        if (player && player.active) {
          trending.push({
            id: playerId,
            name: player.full_name,
            position: player.position,
            team: player.team,
            adp: adpData.average_position,
            change: adpData.change_24h,
            trend: adpData.change_24h > 0 ? 'UP' : 'DOWN'
          });
        }
      }
    }

    return trending
      .sort((a, b) => Math.abs(b.change) - Math.abs(a.change))
      .slice(0, limit);
  }

  /**
   * Calculate team strength for skill position players
   */
  async analyzeTeamStrength() {
    const players = await this.api.loadData('./data/players.json');
    if (!players) return null;

    const teamAnalysis = {};
    
    // Group players by team
    const playersByTeam = {};
    for (const [id, player] of Object.entries(players)) {
      if (player.active && player.team && ['QB', 'RB', 'WR', 'TE'].includes(player.position)) {
        if (!playersByTeam[player.team]) {
          playersByTeam[player.team] = [];
        }
        playersByTeam[player.team].push({ id, ...player });
      }
    }

    // Analyze each team
    for (const [team, teamPlayers] of Object.entries(playersByTeam)) {
      const qbs = teamPlayers.filter(p => p.position === 'QB');
      const rbs = teamPlayers.filter(p => p.position === 'RB');
      const wrs = teamPlayers.filter(p => p.position === 'WR');
      const tes = teamPlayers.filter(p => p.position === 'TE');

      teamAnalysis[team] = {
        total_players: teamPlayers.length,
        qb_depth: qbs.length,
        rb_depth: rbs.length,
        wr_depth: wrs.length,
        te_depth: tes.length,
        offensive_weapons: [...rbs, ...wrs, ...tes].length
      };
    }

    return teamAnalysis;
  }

  /**
   * Generate weekly lineup recommendations based on matchups
   */
  async getWeeklyRecommendations(week, season = 2024) {
    // This would require additional data like schedules and matchup ratings
    // For now, return a placeholder that could be extended
    return {
      week,
      season,
      note: 'Weekly recommendations require schedule and matchup data',
      upcoming_features: [
        'Strength of schedule analysis',
        'Matchup difficulty ratings',
        'Weather impact analysis',
        'Injury report integration'
      ]
    };
  }
}
