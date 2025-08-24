import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { EnhancedSleeperAPI } from './src/enhanced-sleeper-api.js';

/**
 * Enhanced Fantasy Football Draft Assistant API Server
 * Comprehensive REST API with all Sleeper data capabilities
 */

const app = express();
const PORT = process.env.PORT || 3001;
const api = new EnhancedSleeperAPI();

// Middleware
app.use(helmet());
app.use(compression());
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://yourdomain.com'] 
    : ['http://localhost:3000', 'http://localhost:5173']
}));
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// ============================================================================
// HEALTH CHECK
// ============================================================================

app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    version: '2.0.0',
    features: ['enhanced-sleeper-api', 'trending-data', 'comprehensive-stats']
  });
});

// ============================================================================
// PLAYER ENDPOINTS
// ============================================================================

// Get all active players
app.get('/api/players', async (req, res) => {
  try {
    const players = await api.loadData('./data/players/active_players.json');
    if (!players) {
      return res.status(404).json({ error: 'Player data not found. Run data fetch first.' });
    }
    
    const { position, team, limit = 50 } = req.query;
    let playerList = Object.entries(players.data).map(([id, player]) => ({ id, ...player }));
    
    // Apply filters
    if (position) {
      playerList = playerList.filter(p => p.position === position.toUpperCase());
    }
    if (team) {
      playerList = playerList.filter(p => p.team === team.toUpperCase());
    }
    
    playerList = playerList.slice(0, parseInt(limit));
    
    res.json({
      success: true,
      count: playerList.length,
      filters: { position, team, limit },
      data: playerList
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Search players
app.get('/api/players/search', async (req, res) => {
  try {
    const { q: query, position, team, maxAge, limit = 20 } = req.query;
    
    if (!query) {
      return res.status(400).json({ error: 'Query parameter "q" is required' });
    }
    
    const filters = {};
    if (position) filters.position = position.toUpperCase();
    if (team) filters.team = team.toUpperCase();
    if (maxAge) filters.maxAge = parseInt(maxAge);
    
    const results = await api.searchPlayers(query, filters);
    
    res.json({
      success: true,
      query,
      filters,
      count: results.length,
      data: results.slice(0, parseInt(limit))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get player by ID
app.get('/api/players/:id', async (req, res) => {
  try {
    const playerId = req.params.id;
    const players = await api.loadData('./data/players/all_players.json');
    
    if (!players?.data?.[playerId]) {
      return res.status(404).json({ error: 'Player not found' });
    }
    
    const player = { id: playerId, ...players.data[playerId] };
    
    // Add trending info
    const trending24h = await api.loadData('./data/trending/trending_add_24h.json');
    const drops24h = await api.loadData('./data/trending/trending_drop_24h.json');
    
    const trendingInfo = {};
    if (trending24h?.data) {
      const addTrend = trending24h.data.find(t => t.player_id === playerId);
      if (addTrend) trendingInfo.trending_up = addTrend.count;
    }
    if (drops24h?.data) {
      const dropTrend = drops24h.data.find(t => t.player_id === playerId);
      if (dropTrend) trendingInfo.trending_down = dropTrend.count;
    }
    
    res.json({
      success: true,
      data: { ...player, trending: trendingInfo }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// TRENDING ENDPOINTS
// ============================================================================

// Get trending players
app.get('/api/trending/:type', async (req, res) => {
  try {
    const { type } = req.params;
    const { timeframe = '24h', limit = 25 } = req.query;
    
    if (!['add', 'drop'].includes(type)) {
      return res.status(400).json({ error: 'Type must be "add" or "drop"' });
    }
    
    const filename = `./data/trending/trending_${type}_${timeframe}.json`;
    const trending = await api.loadData(filename);
    
    if (!trending) {
      return res.status(404).json({ error: 'Trending data not found. Run data fetch first.' });
    }
    
    // Get player details
    const players = await api.loadData('./data/players/all_players.json');
    const enrichedData = trending.data.slice(0, parseInt(limit)).map(trend => {
      const player = players?.data?.[trend.player_id];
      return {
        ...trend,
        player: player ? {
          name: player.full_name,
          position: player.position,
          team: player.team
        } : null
      };
    });
    
    res.json({
      success: true,
      type,
      timeframe,
      count: enrichedData.length,
      fetched_at: trending.fetched_at,
      data: enrichedData
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// STATISTICS ENDPOINTS
// ============================================================================

// Get season stats
app.get('/api/stats/:season/:type', async (req, res) => {
  try {
    const { season, type } = req.params;
    const { position, limit = 100 } = req.query;
    
    const filename = position 
      ? `./data/stats/${type}/season_${season}_by_position.json`
      : `./data/stats/${type}/season_${season}.json`;
    
    const stats = await api.loadData(filename);
    
    if (!stats) {
      return res.status(404).json({ error: 'Stats data not found' });
    }
    
    let data = stats.data;
    
    if (position && data[position.toUpperCase()]) {
      data = data[position.toUpperCase()];
    }
    
    // Convert to array and limit
    const statsArray = Object.entries(data).map(([id, playerStats]) => ({
      player_id: id,
      ...playerStats
    })).slice(0, parseInt(limit));
    
    res.json({
      success: true,
      season,
      type,
      position: position?.toUpperCase(),
      count: statsArray.length,
      fetched_at: stats.fetched_at,
      data: statsArray
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get weekly stats
app.get('/api/stats/:season/:type/:week', async (req, res) => {
  try {
    const { season, type, week } = req.params;
    const { position, limit = 100 } = req.query;
    
    const filename = `./data/stats/${type}/week_${week}_${season}.json`;
    const stats = await api.loadData(filename);
    
    if (!stats) {
      return res.status(404).json({ error: 'Weekly stats data not found' });
    }
    
    let data = Object.entries(stats.data).map(([id, playerStats]) => ({
      player_id: id,
      ...playerStats
    }));
    
    // Filter by position if requested
    if (position) {
      const players = await api.loadData('./data/players/all_players.json');
      data = data.filter(stat => {
        const player = players?.data?.[stat.player_id];
        return player?.position === position.toUpperCase();
      });
    }
    
    data = data.slice(0, parseInt(limit));
    
    res.json({
      success: true,
      season,
      type,
      week,
      position: position?.toUpperCase(),
      count: data.length,
      fetched_at: stats.fetched_at,
      data
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// NFL STATE ENDPOINT
// ============================================================================

app.get('/api/nfl/state', async (req, res) => {
  try {
    const state = await api.loadData('./data/state/nfl_state.json');
    
    if (!state) {
      return res.status(404).json({ error: 'NFL state data not found' });
    }
    
    res.json({
      success: true,
      fetched_at: state.fetched_at,
      data: state.data
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// ANALYSIS ENDPOINTS
// ============================================================================

// Get draft analysis
app.get('/api/analysis/draft', async (req, res) => {
  try {
    const analysis = await api.loadData('./data/analysis/draft_analysis.json');
    
    if (!analysis) {
      return res.status(404).json({ error: 'Draft analysis not found' });
    }
    
    res.json({
      success: true,
      generated_at: analysis.data.generated_at,
      data: analysis.data
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get data freshness
app.get('/api/system/freshness', async (req, res) => {
  try {
    const freshness = await api.getDataFreshness();
    
    res.json({
      success: true,
      checked_at: new Date().toISOString(),
      data: freshness
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// DATA MANAGEMENT ENDPOINTS
// ============================================================================

// Trigger data refresh
app.post('/api/system/refresh', async (req, res) => {
  try {
    const { type = 'full' } = req.body;
    
    let result;
    switch (type) {
      case 'trending':
        result = await api.getAllTrendingData();
        break;
      case 'players':
        result = await api.getAllPlayers();
        break;
      case 'stats':
        const state = await api.getNFLState(false);
        if (state) {
          result = await api.getEnhancedSeasonStats(state.season, 'regular');
        }
        break;
      case 'full':
      default:
        result = await api.fetchAllDraftData();
        break;
    }
    
    res.json({
      success: true,
      type,
      message: `${type} data refresh completed`,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// LEAGUE ANALYSIS (requires league ID)
// ============================================================================

app.get('/api/league/:leagueId/analyze', async (req, res) => {
  try {
    const { leagueId } = req.params;
    const analysis = await api.analyzeLeague(leagueId, false);
    
    if (!analysis) {
      return res.status(404).json({ error: 'League analysis failed' });
    }
    
    res.json({
      success: true,
      league_id: leagueId,
      analyzed_at: new Date().toISOString(),
      data: analysis
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// ERROR HANDLING
// ============================================================================

app.use((req, res) => {
  res.status(404).json({ 
    error: 'Endpoint not found',
    available_endpoints: [
      'GET /health',
      'GET /api/players',
      'GET /api/players/search?q=name',
      'GET /api/players/:id',
      'GET /api/trending/add',
      'GET /api/trending/drop',
      'GET /api/stats/:season/:type',
      'GET /api/stats/:season/:type/:week',
      'GET /api/nfl/state',
      'GET /api/analysis/draft',
      'GET /api/system/freshness',
      'POST /api/system/refresh',
      'GET /api/league/:id/analyze'
    ]
  });
});

app.use((error, req, res, next) => {
  console.error('Server error:', error);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : undefined
  });
});

// ============================================================================
// SERVER STARTUP
// ============================================================================

app.listen(PORT, () => {
  console.log('🏈 Enhanced Fantasy Football API Server');
  console.log('=' .repeat(50));
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log(`📊 API base URL: http://localhost:${PORT}/api`);
  console.log('\n🎯 Available Features:');
  console.log('✅ Complete player database');
  console.log('✅ Real-time trending data');
  console.log('✅ Comprehensive statistics');
  console.log('✅ NFL state tracking');
  console.log('✅ Draft analysis');
  console.log('✅ League analysis');
  console.log('✅ Data freshness monitoring');
  console.log('\n📖 API Documentation:');
  console.log(`   Players: GET /api/players`);
  console.log(`   Search:  GET /api/players/search?q=mahomes`);
  console.log(`   Trending: GET /api/trending/add`);
  console.log(`   Stats:   GET /api/stats/2024/regular`);
  console.log(`   NFL:     GET /api/nfl/state`);
  console.log('=' .repeat(50));
});

export default app;
