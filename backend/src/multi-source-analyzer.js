import { SleeperAPI } from './sleeper-api.js';
import { SportsDataIOAPI } from './sportsdata-io-api.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Multi-Source Fantasy Football Analyzer
 * Combines Sleeper API, SportsData.io API, and FantasyData CSVs
 * for comprehensive LLM-ready player analysis
 */
export class MultiSourceAnalyzer {
  constructor() {
    this.sleeperAPI = new SleeperAPI();
    this.sportsDataAPI = new SportsDataIOAPI();
    this.fantasyDataPath = path.join(__dirname, '../data-sources/fantasy-data');
  }

  /**
   * Load and parse FantasyData CSV files
   */
  async loadFantasyDataCSVs() {
    const csvData = {};
    
    try {
      // Load ADP data
      const adpPath = path.join(this.fantasyDataPath, 'ADP.csv');
      csvData.adp = await this.parseCSV(adpPath);
      console.log(`📊 Loaded ${csvData.adp.length} ADP records`);

      // Load projections
      const projectionsPath = path.join(this.fantasyDataPath, 'ProjectedStats.csv');
      csvData.projections = await this.parseCSV(projectionsPath);
      console.log(`📈 Loaded ${csvData.projections.length} projection records`);

      // Load advanced metrics
      const advancedPath = path.join(this.fantasyDataPath, 'AdvancedPlayerStatsQB.csv');
      csvData.advancedQB = await this.parseCSV(advancedPath);
      console.log(`🏈 Loaded ${csvData.advancedQB.length} QB advanced records`);

      // Load more position-specific data as available...
      
      return csvData;
    } catch (error) {
      console.error('❌ Error loading FantasyData CSVs:', error.message);
      return {};
    }
  }

  /**
   * Parse CSV file helper
   */
  async parseCSV(filePath) {
    try {
      const content = await fs.readFile(filePath, 'utf8');
      const lines = content.trim().split('\n');
      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
      
      return lines.slice(1).map(line => {
        const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
        const obj = {};
        headers.forEach((header, index) => {
          obj[header] = values[index] || '';
        });
        return obj;
      });
    } catch (error) {
      console.error(`❌ Error parsing CSV ${filePath}:`, error.message);
      return [];
    }
  }

  /**
   * Create comprehensive player profile from all data sources
   */
  async createSuperProfile(playerName, position = null) {
    console.log(`🔍 Creating super profile for: ${playerName}`);
    
    const profile = {
      player_name: playerName,
      search_position: position,
      timestamp: new Date().toISOString(),
      data_sources: {
        sleeper: null,
        sportsdata: null,
        fantasydata: {
          adp: null,
          projections: null,
          advanced: null
        }
      },
      analysis: {
        consensus_projection: null,
        value_analysis: null,
        risk_assessment: null,
        draft_recommendation: null
      }
    };

    try {
      // 1. Sleeper API data
      console.log('🏈 Fetching Sleeper data...');
      const sleeperPlayers = await this.sleeperAPI.findPlayer(playerName);
      if (sleeperPlayers.length > 0) {
        const sleeperPlayer = sleeperPlayers[0];
        profile.data_sources.sleeper = {
          player_id: sleeperPlayer.player_id,
          full_name: sleeperPlayer.full_name,
          position: sleeperPlayer.position,
          team: sleeperPlayer.team,
          age: sleeperPlayer.age,
          height: sleeperPlayer.height,
          weight: sleeperPlayer.weight,
          years_exp: sleeperPlayer.years_exp,
          college: sleeperPlayer.college
        };

        // Get Sleeper stats if available
        try {
          const stats = await this.sleeperAPI.getPlayerStats(sleeperPlayer.player_id);
          if (stats) {
            profile.data_sources.sleeper.stats = stats;
          }
        } catch (error) {
          console.log('⚠️ Sleeper stats not available for this player');
        }
      }

      // 2. SportsData.io data
      console.log('📊 Fetching SportsData.io data...');
      const sportsDataProfile = await this.sportsDataAPI.getPlayerProfile(playerName);
      if (sportsDataProfile.basic) {
        profile.data_sources.sportsdata = {
          basic: sportsDataProfile.basic,
          projections: sportsDataProfile.projections,
          stats: sportsDataProfile.stats,
          injuries: sportsDataProfile.injuries
        };
      }

      // 3. FantasyData CSV data
      console.log('📈 Loading FantasyData CSV data...');
      const csvData = await this.loadFantasyDataCSVs();
      
      // Find player in ADP data
      if (csvData.adp) {
        const adpMatch = csvData.adp.find(player => {
          const playerFullName = `${player['First Name']} ${player['Last Name']}`.toLowerCase();
          return playerFullName.includes(playerName.toLowerCase());
        });
        if (adpMatch) {
          profile.data_sources.fantasydata.adp = adpMatch;
        }
      }

      // Find player in projections
      if (csvData.projections) {
        const projMatch = csvData.projections.find(player => {
          const playerFullName = `${player['First Name']} ${player['Last Name']}`.toLowerCase();
          return playerFullName.includes(playerName.toLowerCase());
        });
        if (projMatch) {
          profile.data_sources.fantasydata.projections = projMatch;
        }
      }

      // Find in advanced stats (position-specific)
      if (csvData.advancedQB && profile.data_sources.sleeper?.position === 'QB') {
        const advMatch = csvData.advancedQB.find(player => {
          const playerFullName = `${player['First Name']} ${player['Last Name']}`.toLowerCase();
          return playerFullName.includes(playerName.toLowerCase());
        });
        if (advMatch) {
          profile.data_sources.fantasydata.advanced = advMatch;
        }
      }

      // 4. Perform analysis
      profile.analysis = await this.analyzePlayerData(profile);

      console.log('✅ Super profile created successfully!');
      return profile;

    } catch (error) {
      console.error('❌ Error creating super profile:', error.message);
      return profile;
    }
  }

  /**
   * Analyze combined player data for LLM insights
   */
  async analyzePlayerData(profile) {
    const analysis = {
      consensus_projection: null,
      value_analysis: null,
      risk_assessment: null,
      draft_recommendation: null,
      data_quality: {
        sleeper_available: !!profile.data_sources.sleeper,
        sportsdata_available: !!profile.data_sources.sportsdata?.basic,
        fantasydata_available: !!profile.data_sources.fantasydata.adp,
        completeness_score: 0
      }
    };

    try {
      // Calculate data completeness
      let completeness = 0;
      if (profile.data_sources.sleeper) completeness += 33;
      if (profile.data_sources.sportsdata?.basic) completeness += 33;
      if (profile.data_sources.fantasydata.adp) completeness += 34;
      analysis.data_quality.completeness_score = completeness;

      // Consensus projection analysis
      const projections = [];
      
      // SportsData.io projection
      if (profile.data_sources.sportsdata?.projections?.FantasyPoints) {
        projections.push({
          source: 'SportsData.io',
          points: profile.data_sources.sportsdata.projections.FantasyPoints
        });
      }

      // FantasyData projection
      if (profile.data_sources.fantasydata.projections?.['Fantasy Points']) {
        projections.push({
          source: 'FantasyData',
          points: parseFloat(profile.data_sources.fantasydata.projections['Fantasy Points'])
        });
      }

      if (projections.length > 0) {
        const avgProjection = projections.reduce((sum, p) => sum + p.points, 0) / projections.length;
        analysis.consensus_projection = {
          average_points: avgProjection,
          sources: projections,
          confidence: projections.length >= 2 ? 'High' : 'Moderate'
        };
      }

      // Value analysis
      if (profile.data_sources.fantasydata.adp?.['Overall Rank']) {
        const adpRank = parseInt(profile.data_sources.fantasydata.adp['Overall Rank']);
        analysis.value_analysis = {
          adp_rank: adpRank,
          adp_tier: this.getADPTier(adpRank),
          value_assessment: this.assessValue(adpRank, analysis.consensus_projection?.average_points)
        };
      }

      // Risk assessment
      const riskFactors = [];
      
      // Age risk
      if (profile.data_sources.sleeper?.age && profile.data_sources.sleeper.age > 30) {
        riskFactors.push('Age concern (30+ years old)');
      }

      // Injury risk
      if (profile.data_sources.sportsdata?.injuries) {
        riskFactors.push('Recent injury concerns');
      }

      // Experience risk
      if (profile.data_sources.sleeper?.years_exp && profile.data_sources.sleeper.years_exp < 2) {
        riskFactors.push('Limited NFL experience');
      }

      analysis.risk_assessment = {
        risk_level: riskFactors.length === 0 ? 'Low' : riskFactors.length === 1 ? 'Moderate' : 'High',
        risk_factors: riskFactors
      };

      // Draft recommendation
      analysis.draft_recommendation = this.generateDraftRecommendation(analysis, profile);

      return analysis;

    } catch (error) {
      console.error('❌ Error in player analysis:', error.message);
      return analysis;
    }
  }

  /**
   * Get ADP tier classification
   */
  getADPTier(adpRank) {
    if (adpRank <= 12) return 'Elite (Round 1)';
    if (adpRank <= 24) return 'High-End (Round 2)';
    if (adpRank <= 36) return 'Solid (Round 3)';
    if (adpRank <= 60) return 'Middle (Rounds 4-5)';
    if (adpRank <= 100) return 'Late (Rounds 6-8)';
    return 'Deep (Round 9+)';
  }

  /**
   * Assess player value vs ADP
   */
  assessValue(adpRank, projectedPoints) {
    if (!projectedPoints) return 'Insufficient data';
    
    // Simple value assessment logic
    const expectedPoints = Math.max(0, 300 - (adpRank * 2.5)); // Rough baseline
    const difference = projectedPoints - expectedPoints;
    
    if (difference > 30) return 'Excellent value';
    if (difference > 15) return 'Good value';
    if (difference > -15) return 'Fair value';
    return 'Poor value';
  }

  /**
   * Generate LLM-ready draft recommendation
   */
  generateDraftRecommendation(analysis, profile) {
    const rec = {
      overall_grade: 'B',
      target_rounds: [],
      key_strengths: [],
      concerns: [],
      llm_summary: ''
    };

    try {
      // Determine grade
      let gradeScore = 75; // Base B grade

      if (analysis.consensus_projection?.confidence === 'High') gradeScore += 5;
      if (analysis.value_analysis?.value_assessment === 'Excellent value') gradeScore += 10;
      if (analysis.value_analysis?.value_assessment === 'Good value') gradeScore += 5;
      if (analysis.risk_assessment?.risk_level === 'Low') gradeScore += 5;
      if (analysis.risk_assessment?.risk_level === 'High') gradeScore -= 10;

      if (gradeScore >= 90) rec.overall_grade = 'A+';
      else if (gradeScore >= 85) rec.overall_grade = 'A';
      else if (gradeScore >= 80) rec.overall_grade = 'B+';
      else if (gradeScore >= 75) rec.overall_grade = 'B';
      else if (gradeScore >= 70) rec.overall_grade = 'B-';
      else if (gradeScore >= 65) rec.overall_grade = 'C+';
      else rec.overall_grade = 'C';

      // Target rounds
      if (analysis.value_analysis?.adp_rank) {
        const baseRound = Math.ceil(analysis.value_analysis.adp_rank / 12);
        rec.target_rounds = [baseRound - 1, baseRound, baseRound + 1].filter(r => r > 0);
      }

      // Key strengths
      if (analysis.consensus_projection?.average_points > 200) {
        rec.key_strengths.push('High fantasy point projection');
      }
      if (analysis.value_analysis?.value_assessment?.includes('value')) {
        rec.key_strengths.push('Good value at current ADP');
      }
      if (analysis.risk_assessment?.risk_level === 'Low') {
        rec.key_strengths.push('Low injury/performance risk');
      }

      // Concerns
      rec.concerns = analysis.risk_assessment?.risk_factors || [];

      // LLM summary
      rec.llm_summary = `${profile.player_name} (${profile.data_sources.sleeper?.position || 'Unknown Position'}) receives a ${rec.overall_grade} grade. ` +
        `${analysis.consensus_projection ? `Projected for ${analysis.consensus_projection.average_points.toFixed(1)} fantasy points. ` : ''}` +
        `${analysis.value_analysis ? `Currently ranked ${analysis.value_analysis.adp_rank} in ADP (${analysis.value_analysis.adp_tier}) with ${analysis.value_analysis.value_assessment}. ` : ''}` +
        `Risk level: ${analysis.risk_assessment?.risk_level || 'Unknown'}. ` +
        `${rec.key_strengths.length > 0 ? `Strengths: ${rec.key_strengths.join(', ')}. ` : ''}` +
        `${rec.concerns.length > 0 ? `Concerns: ${rec.concerns.join(', ')}.` : 'No major concerns identified.'}`;

      return rec;

    } catch (error) {
      console.error('❌ Error generating recommendation:', error.message);
      return rec;
    }
  }

  /**
   * Batch analyze multiple players
   */
  async analyzePlayerList(playerNames) {
    console.log(`🔍 Analyzing ${playerNames.length} players with multi-source data...\n`);
    
    const results = [];
    
    for (let i = 0; i < playerNames.length; i++) {
      const playerName = playerNames[i];
      console.log(`\n${i + 1}/${playerNames.length}: Analyzing ${playerName}...`);
      
      const profile = await this.createSuperProfile(playerName);
      results.push(profile);
      
      // Brief delay to be respectful to APIs
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log('\n✅ Batch analysis complete!');
    return results;
  }

  /**
   * Generate LLM-ready draft report
   */
  async generateDraftReport(playerNames) {
    console.log('📋 Generating comprehensive draft report...\n');
    
    const profiles = await this.analyzePlayerList(playerNames);
    
    const report = {
      generated_at: new Date().toISOString(),
      total_players: profiles.length,
      data_sources: ['Sleeper API', 'SportsData.io API', 'FantasyData CSVs'],
      player_analysis: profiles,
      summary: {
        top_grades: [],
        best_values: [],
        high_risk: [],
        recommendations: []
      }
    };

    // Generate summary insights
    const validProfiles = profiles.filter(p => p.analysis.draft_recommendation);
    
    // Top grades
    report.summary.top_grades = validProfiles
      .filter(p => ['A+', 'A', 'B+'].includes(p.analysis.draft_recommendation.overall_grade))
      .sort((a, b) => {
        const gradeOrder = { 'A+': 5, 'A': 4, 'B+': 3, 'B': 2, 'B-': 1, 'C+': 0, 'C': -1 };
        return gradeOrder[b.analysis.draft_recommendation.overall_grade] - gradeOrder[a.analysis.draft_recommendation.overall_grade];
      })
      .slice(0, 5)
      .map(p => ({
        name: p.player_name,
        grade: p.analysis.draft_recommendation.overall_grade,
        position: p.data_sources.sleeper?.position
      }));

    // Best values
    report.summary.best_values = validProfiles
      .filter(p => p.analysis.value_analysis?.value_assessment?.includes('value'))
      .slice(0, 5)
      .map(p => ({
        name: p.player_name,
        value: p.analysis.value_analysis.value_assessment,
        adp: p.analysis.value_analysis.adp_rank
      }));

    // High risk players
    report.summary.high_risk = validProfiles
      .filter(p => p.analysis.risk_assessment?.risk_level === 'High')
      .slice(0, 5)
      .map(p => ({
        name: p.player_name,
        risks: p.analysis.risk_assessment.risk_factors
      }));

    console.log('✅ Draft report generated successfully!');
    
    // Save report
    const reportPath = path.join(__dirname, '../data-sources/multi-source-draft-report.json');
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
    console.log(`💾 Report saved to: ${reportPath}`);
    
    return report;
  }
}

// Export for use in other modules
export { MultiSourceAnalyzer };
