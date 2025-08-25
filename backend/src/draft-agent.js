/**
 * Fantasy Football Draft Agent with LLM Tool Calling
 * Provides intelligent draft recommendations based on current draft state
 */

import OpenAI from 'openai';
import { DataManager } from './data-manager.js';

export class DraftAgent {
  constructor(apiKey = process.env.OPENAI_API_KEY) {
    if (!apiKey) {
      throw new Error('OpenAI API key is required. Set OPENAI_API_KEY environment variable.');
    }
    
    // Validate API key format without logging it
    if (!apiKey.startsWith('sk-')) {
      throw new Error('Invalid OpenAI API key format.');
    }
    
    this.openai = new OpenAI({ apiKey });
    this.dataManager = new DataManager();
    
    // Tool definitions for OpenAI function calling
    this.tools = [
      {
        type: "function",
        function: {
          name: "getAvailablePlayers",
          description: "Get available players filtered by position, team, or other criteria",
          parameters: {
            type: "object",
            properties: {
              position: {
                type: "string",
                description: "Player position (QB, RB, WR, TE, K, DEF)"
              },
              team: {
                type: "string", 
                description: "NFL team abbreviation"
              },
              limit: {
                type: "number",
                description: "Maximum number of players to return (default: 50)"
              },
              minADP: {
                type: "number",
                description: "Minimum average draft position"
              },
              maxADP: {
                type: "number", 
                description: "Maximum average draft position"
              }
            }
          }
        }
      },
      {
        type: "function",
        function: {
          name: "getPlayerDetails",
          description: "Get detailed information about a specific player including stats, projections, and analysis",
          parameters: {
            type: "object",
            properties: {
              playerName: {
                type: "string",
                description: "Full player name (e.g., 'Josh Allen', 'Christian McCaffrey')"
              }
            },
            required: ["playerName"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "analyzeDraftState", 
        description: "Analyze the current draft state including team rosters, positional needs, and draft trends",
          parameters: {
            type: "object",
            properties: {
              draftedPlayers: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    playerName: { type: "string" },
                    team: { type: "string" },
                    position: { type: "string" },
                    pickNumber: { type: "number" },
                    draftedByTeam: { type: "string" }
                  }
                },
                description: "List of already drafted players with their details"
              },
              currentPick: {
                type: "number",
                description: "Current draft pick number"
              },
              userTeam: {
                type: "string",
                description: "Name/identifier of the user's fantasy team"
              },
              leagueSettings: {
                type: "object",
                properties: {
                  teams: { type: "number" },
                  format: { type: "string", enum: ["ppr", "half_ppr", "standard"] },
                  rounds: { type: "number" },
                  rosterSpots: {
                    type: "object",
                    properties: {
                      QB: { type: "number" },
                      RB: { type: "number" },
                      WR: { type: "number" },
                      TE: { type: "number" },
                      FLEX: { type: "number" },
                      K: { type: "number" },
                      DEF: { type: "number" },
                      BENCH: { type: "number" }
                    }
                  }
                }
              }
            },
            required: ["draftedPlayers", "currentPick", "userTeam"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "getPositionalAnalysis",
          description: "Get positional scarcity analysis, depth charts, and tier rankings",
          parameters: {
            type: "object", 
            properties: {
              position: {
                type: "string",
                description: "Position to analyze (QB, RB, WR, TE)"
              },
              format: {
                type: "string",
                enum: ["ppr", "half_ppr", "standard"],
                description: "Scoring format for analysis"
              }
            },
            required: ["position"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "findSleepers",
          description: "Find potential sleeper picks and value players based on ADP vs projected value",
          parameters: {
            type: "object",
            properties: {
              position: {
                type: "string",
                description: "Position to find sleepers for"
              },
              adpRange: {
                type: "object",
                properties: {
                  min: { type: "number" },
                  max: { type: "number" }
                },
                description: "ADP range to search within"
              },
              limit: {
                type: "number",
                description: "Maximum number of sleepers to return"
              }
            }
          }
        }
      }
    ];
  }

  /**
   * Main method to get draft recommendations
   */
  async getDraftRecommendation(draftState) {
    try {
      const systemPrompt = `You are an expert fantasy football draft assistant with access to comprehensive NFL player data and analytics tools. 

Your role is to:
1. Analyze the current draft state and user's team needs
2. Use available tools to gather relevant player data and insights  
3. Provide 3-5 specific player recommendations with detailed reasoning
4. Consider positional scarcity, value over replacement, and draft strategy
5. Adapt recommendations based on league format and settings

Always use the provided tools to gather current data before making recommendations. Be specific about why each pick makes sense given the draft context.`;

      const userMessage = `Analyze this draft situation and provide recommendations:

Draft State: ${JSON.stringify(draftState, null, 2)}

Please use your tools to analyze the current draft state, evaluate available players, and provide 3-5 specific recommendations with reasoning.`;

      const response = await this.openai.chat.completions.create({
        model: "gpt-4-turbo-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage }
        ],
        tools: this.tools,
        tool_choice: "auto",
        temperature: 0.3
      });

      return await this.handleToolCalls(response);
      
    } catch (error) {
      // Sanitize error message to prevent API key leakage
      const sanitizedMessage = error.message?.replace(/sk-[a-zA-Z0-9-_]+/g, '[API_KEY_HIDDEN]') || 'Unknown error';
      console.error('Draft Agent Error:', sanitizedMessage);
      throw new Error(`Failed to get draft recommendation: ${sanitizedMessage}`);
    }
  }

  /**
   * Handle OpenAI tool calls and execute corresponding functions
   */
  async handleToolCalls(response) {
    let messages = [
      { role: "assistant", content: response.choices[0].message.content || "" }
    ];

    if (response.choices[0].message.tool_calls) {
      // Add tool calls to message history
      messages[0].tool_calls = response.choices[0].message.tool_calls;

      // Execute each tool call
      for (const toolCall of response.choices[0].message.tool_calls) {
        const result = await this.executeTool(toolCall);
        messages.push({
          role: "tool",
          tool_call_id: toolCall.id,
          content: JSON.stringify(result)
        });
      }

      // Get final response with tool results
      const finalResponse = await this.openai.chat.completions.create({
        model: "gpt-4-turbo-preview",
        messages: [
          { role: "system", content: "Based on the tool results, provide specific draft recommendations with detailed reasoning." },
          ...messages
        ],
        temperature: 0.3
      });

      return {
        recommendations: finalResponse.choices[0].message.content,
        toolsUsed: response.choices[0].message.tool_calls.map(tc => tc.function.name),
        reasoning: "Analysis based on current player data and draft state"
      };
    }

    return {
      recommendations: response.choices[0].message.content,
      toolsUsed: [],
      reasoning: "General draft guidance"
    };
  }

  /**
   * Execute a specific tool function
   */
  async executeTool(toolCall) {
    const { name, arguments: args } = toolCall.function;
    const parsedArgs = JSON.parse(args);

    try {
      switch (name) {
        case 'getAvailablePlayers':
          return await this.getAvailablePlayers(parsedArgs);
        case 'getPlayerDetails':
          return await this.getPlayerDetails(parsedArgs);
        case 'analyzeDraftState':
          return await this.analyzeDraftState(parsedArgs);
        case 'getPositionalAnalysis':
          return await this.getPositionalAnalysis(parsedArgs);
        case 'findSleepers':
          return await this.findSleepers(parsedArgs);
        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    } catch (error) {
      console.error(`Tool execution error for ${name}:`, error);
      return { error: `Failed to execute ${name}: ${error.message}` };
    }
  }

  /**
   * Tool: Get available players with filtering
   */
  async getAvailablePlayers({ position, team, limit = 50, minADP, maxADP }) {
    try {
      const playersData = await this.dataManager.loadData('./data-sources/processed/combined/unified-player-data.json');
      if (!playersData) {
        return { error: "Player data not available" };
      }

      let players = Object.values(playersData);

      // Apply filters
      if (position) {
        players = players.filter(p => p.position === position.toUpperCase());
      }
      if (team) {
        players = players.filter(p => p.team === team.toUpperCase());
      }
      if (minADP) {
        players = players.filter(p => p.adp >= minADP);
      }
      if (maxADP) {
        players = players.filter(p => p.adp <= maxADP);
      }

      // Sort by ADP (ascending)
      players.sort((a, b) => (a.adp || 999) - (b.adp || 999));

      return players.slice(0, limit).map(p => ({
        name: p.full_name || p.name,
        position: p.position,
        team: p.team,
        adp: p.adp,
        projectedPoints: p.projected_points,
        age: p.age,
        experience: p.years_exp,
        injury_status: p.injury_status,
        trending: {
          hot_pickup: p.trending?.adds?.rank <= 20 ? true : false,
          cold_drop: p.trending?.drops?.rank <= 20 ? true : false,
          net_interest: p.trending?.net_interest || 0
        }
      }));
    } catch (error) {
      return { error: `Failed to get available players: ${error.message}` };
    }
  }

  /**
   * Tool: Get detailed player information  
   */
  async getPlayerDetails({ playerName }) {
    try {
      const playersData = await this.dataManager.loadData('./data-sources/processed/combined/unified-player-data.json');
      if (!playersData) {
        return { error: "Player data not available" };
      }

      const player = Object.values(playersData).find(p => 
        (p.full_name && p.full_name.toLowerCase().includes(playerName.toLowerCase())) ||
        (p.name && p.name.toLowerCase().includes(playerName.toLowerCase()))
      );

      if (!player) {
        return { error: `Player '${playerName}' not found` };
      }

      return {
        name: player.full_name || player.name,
        position: player.position,
        team: player.team,
        adp: player.adp,
        projectedPoints: player.projected_points,
        age: player.age,
        experience: player.years_exp,
        height: player.height,
        weight: player.weight,
        college: player.college,
        injury_status: player.injury_status,
        depth_chart_position: player.depth_chart_position,
        trending: {
          adds_rank: player.trending?.adds?.rank || null,
          drops_rank: player.trending?.drops?.rank || null,
          net_interest: player.trending?.net_interest || 0,
          hot_pickup: player.trending?.adds?.rank <= 20 ? true : false,
          cold_drop: player.trending?.drops?.rank <= 20 ? true : false
        },
        stats_2023: player.stats_2023,
        fantasy_points_2023: player.fantasy_points_2023
      };
    } catch (error) {
      return { error: `Failed to get player details: ${error.message}` };
    }
  }

  /**
   * Tool: Analyze current draft state
   */
  async analyzeDraftState({ draftedPlayers, currentPick, userTeam, leagueSettings }) {
    try {
      const analysis = {
        userRoster: [],
        userPositionalNeeds: {},
        leaguePositionalTrends: {},
        upcomingPickStrategies: [],
        draftPhase: this.getDraftPhase(currentPick, leagueSettings?.teams || 12)
      };

      // Analyze user's roster
      analysis.userRoster = draftedPlayers
        .filter(p => p.draftedByTeam === userTeam)
        .map(p => ({
          name: p.playerName,
          position: p.position,
          pickNumber: p.pickNumber
        }));

      // Calculate positional needs for user
      const rosterCounts = analysis.userRoster.reduce((acc, player) => {
        acc[player.position] = (acc[player.position] || 0) + 1;
        return acc;
      }, {});

      const idealRoster = leagueSettings?.rosterSpots || {
        QB: 1, RB: 2, WR: 3, TE: 1, FLEX: 1, K: 1, DEF: 1, BENCH: 6
      };

      analysis.userPositionalNeeds = {
        QB: Math.max(0, idealRoster.QB - (rosterCounts.QB || 0)),
        RB: Math.max(0, (idealRoster.RB + idealRoster.FLEX) - (rosterCounts.RB || 0)),
        WR: Math.max(0, (idealRoster.WR + idealRoster.FLEX) - (rosterCounts.WR || 0)), 
        TE: Math.max(0, idealRoster.TE - (rosterCounts.TE || 0)),
        K: Math.max(0, idealRoster.K - (rosterCounts.K || 0)),
        DEF: Math.max(0, idealRoster.DEF - (rosterCounts.DEF || 0))
      };

      // Analyze league trends
      const positionCounts = draftedPlayers.reduce((acc, player) => {
        acc[player.position] = (acc[player.position] || 0) + 1;
        return acc;
      }, {});

      analysis.leaguePositionalTrends = positionCounts;

      // Determine upcoming pick strategies
      const nextFewPicks = this.calculateNextPicks(currentPick, userTeam, leagueSettings?.teams || 12);
      analysis.upcomingPickStrategies = nextFewPicks;

      return analysis;
    } catch (error) {
      return { error: `Failed to analyze draft state: ${error.message}` };
    }
  }

  /**
   * Tool: Get positional analysis and scarcity data
   */
  async getPositionalAnalysis({ position, format = 'ppr' }) {
    try {
      const playersData = await this.dataManager.loadData('./data-sources/processed/combined/unified-player-data.json');
      if (!playersData) {
        return { error: "Player data not available" };
      }

      const positionPlayers = Object.values(playersData)
        .filter(p => p.position === position.toUpperCase())
        .sort((a, b) => (a.adp || 999) - (b.adp || 999));

      const tiers = this.createTiers(positionPlayers);
      
      return {
        position,
        totalPlayers: positionPlayers.length,
        tiers: tiers.map((tier, index) => ({
          tierNumber: index + 1,
          players: tier.map(p => ({
            name: p.full_name || p.name,
            adp: p.adp,
            projectedPoints: p.projected_points
          })),
          averageADP: tier.reduce((sum, p) => sum + (p.adp || 0), 0) / tier.length,
          dropoffToNext: index < tiers.length - 1 ? this.calculateTierDropoff(tier, tiers[index + 1]) : null
        })),
        scarcityScore: this.calculateScarcityScore(positionPlayers),
        recommendedDraftRange: this.getRecommendedDraftRange(positionPlayers)
      };
    } catch (error) {
      return { error: `Failed to get positional analysis: ${error.message}` };
    }
  }

  /**
   * Tool: Find sleeper picks and value players
   */
  async findSleepers({ position, adpRange, limit = 10 }) {
    try {
      const playersData = await this.dataManager.loadData('./data-sources/processed/combined/unified-player-data.json');
      if (!playersData) {
        return { error: "Player data not available" };
      }

      let players = Object.values(playersData);
      
      if (position) {
        players = players.filter(p => p.position === position.toUpperCase());
      }

      if (adpRange) {
        players = players.filter(p => 
          p.adp >= (adpRange.min || 0) && p.adp <= (adpRange.max || 300)
        );
      }

      // Find sleepers based on value indicators
      const sleepers = players
        .filter(p => this.isSleeperCandidate(p))
        .sort((a, b) => this.calculateSleeperScore(b) - this.calculateSleeperScore(a))
        .slice(0, limit);

      return sleepers.map(p => ({
        name: p.full_name || p.name,
        position: p.position,
        team: p.team,
        adp: p.adp,
        projectedPoints: p.projected_points,
        age: p.age,
        sleeperScore: this.calculateSleeperScore(p),
        reasons: this.getSleeperReasons(p)
      }));
    } catch (error) {
      return { error: `Failed to find sleepers: ${error.message}` };
    }
  }

  // Helper methods
  getDraftPhase(currentPick, teamCount) {
    const round = Math.ceil(currentPick / teamCount);
    if (round <= 3) return 'early';
    if (round <= 8) return 'middle';
    return 'late';
  }

  calculateNextPicks(currentPick, userTeam, teamCount) {
    const userPosition = (currentPick - 1) % teamCount + 1;
    const nextPicks = [];
    
    for (let i = 1; i <= 3; i++) {
      const nextPick = currentPick + (teamCount * i) - (userPosition - 1) * 2;
      if (nextPick > 0) {
        nextPicks.push(`Pick ${nextPick} (Round ${Math.ceil(nextPick / teamCount)})`);
      }
    }
    
    return nextPicks;
  }

  createTiers(players) {
    // Simple tier creation based on ADP gaps
    const tiers = [];
    let currentTier = [];
    let lastADP = 0;

    for (const player of players.slice(0, 50)) { // Top 50 players per position
      const adp = player.adp || 999;
      
      if (currentTier.length === 0 || adp - lastADP < 15) {
        currentTier.push(player);
      } else {
        tiers.push([...currentTier]);
        currentTier = [player];
      }
      lastADP = adp;
    }
    
    if (currentTier.length > 0) {
      tiers.push(currentTier);
    }
    
    return tiers;
  }

  calculateTierDropoff(currentTier, nextTier) {
    const currentAvg = currentTier.reduce((sum, p) => sum + (p.projected_points || 0), 0) / currentTier.length;
    const nextAvg = nextTier.reduce((sum, p) => sum + (p.projected_points || 0), 0) / nextTier.length;
    return currentAvg - nextAvg;
  }

  calculateScarcityScore(players) {
    // Higher score = more scarce position
    const top12 = players.slice(0, 12);
    const next12 = players.slice(12, 24);
    
    if (top12.length === 0 || next12.length === 0) return 0;
    
    const top12Avg = top12.reduce((sum, p) => sum + (p.projected_points || 0), 0) / top12.length;
    const next12Avg = next12.reduce((sum, p) => sum + (p.projected_points || 0), 0) / next12.length;
    
    return top12Avg - next12Avg;
  }

  getRecommendedDraftRange(players) {
    const elite = players.slice(0, 3);
    const tier1 = players.slice(0, 12);
    
    return {
      elite: elite.length > 0 ? `Picks 1-${Math.max(...elite.map(p => p.adp || 0))}` : 'None',
      tier1: tier1.length > 0 ? `Picks ${Math.min(...tier1.map(p => p.adp || 0))}-${Math.max(...tier1.map(p => p.adp || 0))}` : 'None'
    };
  }

  isSleeperCandidate(player) {
    return (
      player.age < 26 ||
      player.injury_status === 'Healthy' ||
      (player.depth_chart_position && parseInt(player.depth_chart_position) <= 2) ||
      ['BUF', 'KC', 'SF', 'PHI', 'DAL', 'MIA'].includes(player.team)
    );
  }

  calculateSleeperScore(player) {
    let score = 0;
    
    if (player.age < 25) score += 2;
    if (player.age < 23) score += 1;
    if (player.injury_status === 'Healthy') score += 1;
    if (player.depth_chart_position && parseInt(player.depth_chart_position) <= 2) score += 2;
    if (['BUF', 'KC', 'SF', 'PHI', 'DAL', 'MIA'].includes(player.team)) score += 1;
    if (player.projected_points > (player.adp || 0) * 0.1) score += 2;
    
    return score;
  }

  getSleeperReasons(player) {
    const reasons = [];
    
    if (player.age < 25) reasons.push('Young player with upside');
    if (player.injury_status === 'Healthy') reasons.push('Healthy status');
    if (player.depth_chart_position && parseInt(player.depth_chart_position) <= 2) reasons.push('High on depth chart');
    if (['BUF', 'KC', 'SF', 'PHI', 'DAL', 'MIA'].includes(player.team)) reasons.push('Strong offensive system');
    
    return reasons;
  }
}
