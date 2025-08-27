// Fantasy Football Draft Assistant API Server
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { DataManager } from './src/data-manager.js';
import { DraftAgent } from './src/draft-agent.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize data manager and draft agent
const dataManager = new DataManager();
let draftAgent = null;

// Initialize draft agent if OpenAI API key is available
try {
  draftAgent = new DraftAgent();
  console.log('🤖 Draft Agent initialized successfully');
} catch (error) {
  console.log('⚠️ Draft Agent not available:', error.message);
}

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    service: 'Fantasy Football Draft Assistant API'
  });
});

// ============================================================================
// DRAFT AGENT ENDPOINTS
// ============================================================================

// Get AI-powered draft recommendations
app.post('/api/draft/recommend', async (req, res) => {
  try {
    if (!draftAgent) {
      return res.status(503).json({
        error: 'Draft Agent not available',
        message: 'OpenAI API key not configured. Set OPENAI_API_KEY environment variable.',
        fallback: 'Use /api/analysis/summary for basic recommendations'
      });
    }

    const draftState = req.body;
    
    // Validate draft state
    if (!draftState.draftedPlayers || !Array.isArray(draftState.draftedPlayers)) {
      return res.status(400).json({
        error: 'Invalid draft state',
        message: 'draftedPlayers array is required'
      });
    }

    if (!draftState.currentPick || !draftState.userTeam) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'currentPick and userTeam are required'
      });
    }

    console.log(`🤖 Getting draft recommendation for pick ${draftState.currentPick}`);
    
    const recommendation = await draftAgent.getDraftRecommendation(draftState);
    
    res.json({
      success: true,
      currentPick: draftState.currentPick,
      userTeam: draftState.userTeam,
      recommendation: recommendation.recommendations,
      toolsUsed: recommendation.toolsUsed,
      reasoning: recommendation.reasoning,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Draft recommendation error:', error);
    res.status(500).json({
      error: 'Failed to get draft recommendation',
      message: error.message,
      fallback: 'Try /api/analysis/summary for basic analysis'
    });
  }
});

// Get draft agent status and capabilities
app.get('/api/draft/agent-status', (req, res) => {
  res.json({
    available: !!draftAgent,
    capabilities: draftAgent ? [
      'AI-powered draft recommendations',
      'Real-time draft state analysis', 
      'Positional scarcity evaluation',
      'Sleeper identification',
      'Player-specific insights',
      'League context adaptation'
    ] : [],
    tools: draftAgent ? draftAgent.tools.map(t => t.function.name) : [],
    requirements: !draftAgent ? ['OPENAI_API_KEY environment variable'] : [],
    fallbacks: [
      'GET /api/analysis/summary - Basic draft analysis',
      'GET /api/players - Player data access',
      'GET /api/rankings/:position - Position rankings'
    ]
  });
});

// ============================================================================
// PLAYER DATA ENDPOINTS
// ============================================================================

// Get all players with combined data
app.get('/api/players', async (req, res) => {
  try {
    const { position, team, limit, search } = req.query;
    
    let players = await dataManager.loadData('./data-sources/processed/combined/unified-player-data.json');
    
    if (!players) {
      return res.status(404).json({ 
        error: 'Player data not found. Run data fetcher first.',
        suggestion: 'Execute: npm run fetch-data'
      });
    }
    
    let results = Object.values(players);
    
    // Apply filters
    if (position) {
      results = results.filter(p => p.position === position.toUpperCase());
    }
    
    if (team) {
      results = results.filter(p => p.team === team.toUpperCase());
    }
    
    if (search) {
      const searchTerm = search.toLowerCase();
      results = results.filter(p => 
        (p.name || '').toLowerCase().includes(searchTerm)
      );
    }
    
    // Sort by ADP if available, otherwise by name
    results.sort((a, b) => {
      if (a.adp && b.adp) return a.adp - b.adp;
      if (a.adp && !b.adp) return -1;
      if (!a.adp && b.adp) return 1;
      return (a.name || '').localeCompare(b.name || '');
    });
    
    // Apply limit
    if (limit) {
      results = results.slice(0, parseInt(limit));
    }
    
    res.json({
      players: results,
      count: results.length,
      filters: { position, team, limit, search }
    });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get active players only (server-side filtered)
app.get('/api/players/active', async (req, res) => {
  try {
    console.log('📋 Getting active players only (using live Sleeper API)...');
    
    // Get live player data from Sleeper API and filter for active players
    const sleeperAPI = dataManager.sleeperAPI;
    const allPlayerData = await sleeperAPI.getAllPlayers(false); // Don't save to avoid overwriting cache
    
    if (!allPlayerData) {
      throw new Error('Failed to fetch player data from Sleeper API');
    }
    
    // Filter for active players and transform to consistent format
    const activePlayers = Object.entries(allPlayerData)
      .filter(([id, player]) => player.active)
      .map(([id, player]) => ({
        sleeper_id: id,
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
        status: player.status,
        injury_status: player.injury_status,
        active: player.active,
        search_rank: player.search_rank,
        fantasy_positions: player.fantasy_positions
      }));
    
    console.log(`📋 Found ${activePlayers.length} active players`);
    
    res.json({
      players: activePlayers,
      count: activePlayers.length,
      activeOnly: true,
      filters: req.query,
      source: 'live-sleeper-api (active filtered)',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error fetching active players:', error);
    res.status(500).json({ 
      error: 'Failed to fetch active players',
      message: error.message 
    });
  }
});

// Get specific player by ID
app.get('/api/players/:id', async (req, res) => {
  try {
    const player = await dataManager.getPlayerProfile(req.params.id);
    
    if (!player) {
      return res.status(404).json({ error: 'Player not found' });
    }
    
    res.json({ player });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Search players
app.get('/api/players/search/:query', async (req, res) => {
  try {
    const results = await dataManager.searchPlayers(req.params.query);
    
    res.json({
      results,
      count: results.length,
      query: req.params.query
    });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get top players by position
app.get('/api/rankings/:position', async (req, res) => {
  try {
    const { limit = 50 } = req.query;
    const players = await dataManager.getTopPlayersByPosition(req.params.position, parseInt(limit));
    
    res.json({
      position: req.params.position.toUpperCase(),
      players,
      count: players.length
    });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// DATA SOURCE ENDPOINTS
// ============================================================================

// Get Sleeper API data
app.get('/api/sleeper/players', async (req, res) => {
  try {
    const players = await dataManager.loadData('./data-sources/sleeper-api/players/players.json');
    
    if (!players) {
      return res.status(404).json({ error: 'Sleeper player data not found' });
    }
    
    const activeOnly = req.query.active === 'true';
    let results = Object.values(players);
    
    if (activeOnly) {
      results = results.filter(p => p.active);
    }
    
    res.json({
      players: results,
      count: results.length,
      source: 'sleeper-api'
    });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get ADP data
app.get('/api/sleeper/adp/:format?', async (req, res) => {
  try {
    const format = req.params.format || 'ppr';
    const adp = await dataManager.loadData(`./data-sources/sleeper-api/adp/adp_${format}.json`);
    
    if (!adp) {
      return res.status(404).json({ 
        error: `ADP data for ${format} format not found`,
        availableFormats: ['standard', 'ppr', 'half_ppr', '2qb']
      });
    }
    
    res.json({
      adp,
      format,
      count: Object.keys(adp).length,
      source: 'sleeper-api'
    });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get FantasyData processed results
app.get('/api/fantasy-data/:category?', async (req, res) => {
  try {
    const csvData = await dataManager.loadData('./data-sources/processed/fantasy-data-csvs.json');
    
    if (!csvData) {
      return res.status(404).json({ error: 'FantasyData CSV data not found' });
    }
    
    if (req.params.category) {
      const category = req.params.category;
      if (!csvData[category]) {
        return res.status(404).json({ 
          error: `Category '${category}' not found`,
          availableCategories: Object.keys(csvData)
        });
      }
      
      res.json({
        category,
        data: csvData[category],
        source: 'fantasy-data-csv'
      });
    } else {
      res.json({
        categories: Object.keys(csvData),
        summary: Object.fromEntries(
          Object.entries(csvData).map(([cat, files]) => [
            cat, 
            files.length + ' files'
          ])
        ),
        source: 'fantasy-data-csv'
      });
    }
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// ANALYSIS ENDPOINTS
// ============================================================================

// Get data summary
app.get('/api/analysis/summary', async (req, res) => {
  try {
    const summary = await dataManager.loadData('./data-sources/processed/analysis/data-summary.json');
    
    if (!summary) {
      return res.status(404).json({ error: 'Data summary not found' });
    }
    
    res.json(summary);
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get position analysis
app.get('/api/analysis/positions', async (req, res) => {
  try {
    const combinedData = await dataManager.loadData('./data-sources/processed/combined/unified-player-data.json');
    
    if (!combinedData) {
      return res.status(404).json({ error: 'Combined data not found' });
    }
    
    const analysis = {};
    const players = Object.values(combinedData);
    
    // Group by position
    const positions = [...new Set(players.map(p => p.position))];
    
    for (const position of positions) {
      const positionPlayers = players.filter(p => p.position === position);
      
      analysis[position] = {
        total_players: positionPlayers.length,
        with_adp: positionPlayers.filter(p => p.adp).length,
        with_fantasy_data: positionPlayers.filter(p => Object.keys(p.fantasy_data).length > 0).length,
        avg_age: positionPlayers.filter(p => p.age).reduce((sum, p) => sum + p.age, 0) / positionPlayers.filter(p => p.age).length || 0,
        teams: [...new Set(positionPlayers.map(p => p.team).filter(Boolean))].length
      };
    }
    
    res.json({
      analysis,
      generated_at: new Date().toISOString()
    });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// DATA MANAGEMENT ENDPOINTS
// ============================================================================

// Trigger data fetch
app.post('/api/data/fetch', async (req, res) => {
  try {
    const { source = 'all' } = req.body;
    
    let result;
    switch (source) {
      case 'sleeper':
        result = await dataManager.fetchSleeperData();
        break;
      case 'csv':
        result = await dataManager.processFantasyDataCSVs();
        break;
      case 'combine':
        result = await dataManager.combineAllData();
        break;
      default:
        result = await dataManager.executeFullDataPipeline();
    }
    
    res.json({
      success: true,
      source,
      message: 'Data fetch completed',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// ============================================================================
// ERROR HANDLING
// ============================================================================

app.use((req, res) => {
  res.status(404).json({ 
    error: 'Endpoint not found',
    available_endpoints: {
      players: '/api/players',
      players_active: '/api/players/active',
      search: '/api/players/search/:query',
      rankings: '/api/rankings/:position',
      sleeper: '/api/sleeper/players',
      adp: '/api/sleeper/adp/:format',
      fantasy_data: '/api/fantasy-data/:category',
      analysis: '/api/analysis/summary',
      data_fetch: 'POST /api/data/fetch'
    }
  });
});

app.use((error, req, res, next) => {
  console.error('Server error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

// ============================================================================
// SERVER STARTUP
// ============================================================================

app.listen(PORT, () => {
  console.log(`🏈 Fantasy Football Draft Assistant API`);
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Available endpoints:`);
  console.log(`   🤖 POST /api/draft/recommend`);
  console.log(`   🤖 GET  /api/draft/agent-status`);
  console.log(`   GET  /api/players`);
  console.log(`   GET  /api/players/active`);
  console.log(`   GET  /api/players/:id`);
  console.log(`   GET  /api/players/search/:query`);
  console.log(`   GET  /api/rankings/:position`);
  console.log(`   GET  /api/sleeper/players`);
  console.log(`   GET  /api/sleeper/adp/:format`);
  console.log(`   GET  /api/fantasy-data/:category`);
  console.log(`   GET  /api/analysis/summary`);
  console.log(`   POST /api/data/fetch`);
  console.log(`\n🤖 Draft Agent: ${draftAgent ? '✅ Ready' : '❌ Not Available (Set OPENAI_API_KEY)'}`);
  console.log(`💡 Try: http://localhost:${PORT}/api/draft/agent-status`);
});
