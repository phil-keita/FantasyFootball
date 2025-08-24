#!/usr/bin/env node

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import dotenv from 'dotenv';
import { SleeperAPI } from './src/sleeper-api.js';
import { FantasyAnalyzer } from './src/fantasy-analyzer.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize APIs
const sleeperAPI = new SleeperAPI();
const analyzer = new FantasyAnalyzer(sleeperAPI);

// Middleware
app.use(helmet());
app.use(compression());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// ============================================================================
// API ROUTES
// ============================================================================

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Data status
app.get('/api/data/status', async (req, res) => {
  try {
    const summary = await sleeperAPI.generateSummary();
    res.json({
      status: 'success',
      data_available: !!summary,
      summary: summary || {
        message: 'No data available. Run data fetch first.'
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// ============================================================================
// PLAYER ENDPOINTS
// ============================================================================

// Get all players
app.get('/api/players', async (req, res) => {
  try {
    const { active, position, team, search, limit = 100 } = req.query;
    
    let players = await sleeperAPI.loadData('./data/players.json');
    if (!players) {
      return res.status(404).json({
        status: 'error',
        message: 'Player data not available. Run data fetch first.'
      });
    }

    // Convert to array and filter
    let playerArray = Object.entries(players).map(([id, player]) => ({
      id,
      ...player
    }));

    // Apply filters
    if (active === 'true') {
      playerArray = playerArray.filter(p => p.active);
    }
    if (position) {
      playerArray = playerArray.filter(p => p.position === position.toUpperCase());
    }
    if (team) {
      playerArray = playerArray.filter(p => p.team === team.toUpperCase());
    }
    if (search) {
      const searchLower = search.toLowerCase();
      playerArray = playerArray.filter(p => 
        p.full_name?.toLowerCase().includes(searchLower) ||
        p.first_name?.toLowerCase().includes(searchLower) ||
        p.last_name?.toLowerCase().includes(searchLower)
      );
    }

    // Limit results
    playerArray = playerArray.slice(0, parseInt(limit));

    res.json({
      status: 'success',
      count: playerArray.length,
      players: playerArray
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// Get player by ID
app.get('/api/players/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const players = await sleeperAPI.loadData('./data/players.json');
    
    if (!players || !players[id]) {
      return res.status(404).json({
        status: 'error',
        message: 'Player not found'
      });
    }

    res.json({
      status: 'success',
      player: {
        id,
        ...players[id]
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// Search players
app.get('/api/players/search/:query', async (req, res) => {
  try {
    const { query } = req.params;
    const player = await sleeperAPI.findPlayer(query);
    
    if (!player) {
      return res.status(404).json({
        status: 'error',
        message: `Player "${query}" not found`
      });
    }

    res.json({
      status: 'success',
      player
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// Get top players by position
app.get('/api/players/position/:position/top', async (req, res) => {
  try {
    const { position } = req.params;
    const { format = 'ppr', limit = 20 } = req.query;
    
    const topPlayers = await sleeperAPI.getTopPlayersByPosition(
      position.toUpperCase(), 
      format, 
      parseInt(limit)
    );
    
    if (!topPlayers) {
      return res.status(404).json({
        status: 'error',
        message: `No data available for position ${position.toUpperCase()}`
      });
    }

    res.json({
      status: 'success',
      position: position.toUpperCase(),
      format,
      count: topPlayers.length,
      players: topPlayers
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// ============================================================================
// STATISTICS ENDPOINTS
// ============================================================================

// Get season stats
app.get('/api/stats/season/:season', async (req, res) => {
  try {
    const { season } = req.params;
    const { type = 'regular' } = req.query;
    
    const stats = await sleeperAPI.loadData(`./data/stats/${type}/season_${season}.json`);
    
    if (!stats) {
      return res.status(404).json({
        status: 'error',
        message: `Stats not available for ${season} ${type} season`
      });
    }

    res.json({
      status: 'success',
      season: parseInt(season),
      type,
      player_count: Object.keys(stats).length,
      stats
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// Get player stats
app.get('/api/stats/player/:playerId', async (req, res) => {
  try {
    const { playerId } = req.params;
    const { season = 2024, type = 'regular' } = req.query;
    
    const stats = await sleeperAPI.loadData(`./data/stats/${type}/season_${season}.json`);
    
    if (!stats || !stats[playerId]) {
      return res.status(404).json({
        status: 'error',
        message: `Stats not found for player ${playerId} in ${season} ${type} season`
      });
    }

    res.json({
      status: 'success',
      player_id: playerId,
      season: parseInt(season),
      type,
      stats: stats[playerId]
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// ============================================================================
// DATA MANAGEMENT ENDPOINTS
// ============================================================================

// Fetch all data
app.post('/api/data/fetch', async (req, res) => {
  try {
    console.log('🔄 Starting data fetch...');
    const results = await sleeperAPI.fetchAllData();
    
    res.json({
      status: 'success',
      message: 'Data fetch completed',
      results: {
        players_fetched: !!results.players,
        adp_fetched: Object.keys(results.adp || {}).length,
        stats_fetched: Object.keys(results.stats || {}).length,
        news_fetched: !!results.news
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// Quick fetch (players only)
app.post('/api/data/fetch/quick', async (req, res) => {
  try {
    console.log('🚀 Starting quick data fetch...');
    const players = await sleeperAPI.getAllPlayers();
    
    res.json({
      status: 'success',
      message: 'Quick fetch completed',
      players_count: players ? Object.keys(players).length : 0
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// ============================================================================
// ANALYSIS ENDPOINTS
// ============================================================================

// Get draft strategy
app.get('/api/analysis/draft-strategy', async (req, res) => {
  try {
    const { league_size = 12, format = 'ppr' } = req.query;
    
    const strategy = await analyzer.generateDraftStrategy(
      parseInt(league_size), 
      format
    );
    
    res.json({
      status: 'success',
      league_size: parseInt(league_size),
      format,
      strategy
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// Get trending players
app.get('/api/analysis/trending', async (req, res) => {
  try {
    const { format = 'ppr', limit = 20 } = req.query;
    
    const trending = await analyzer.getTrendingPlayers(format, parseInt(limit));
    
    if (!trending) {
      return res.status(404).json({
        status: 'error',
        message: 'Trending data not available'
      });
    }

    res.json({
      status: 'success',
      format,
      count: trending.length,
      trending_players: trending
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// ============================================================================
// ERROR HANDLING
// ============================================================================

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    status: 'error',
    message: 'Endpoint not found',
    available_endpoints: [
      'GET /api/health',
      'GET /api/data/status',
      'GET /api/players',
      'GET /api/players/:id',
      'GET /api/players/search/:query',
      'GET /api/players/position/:position/top',
      'GET /api/stats/season/:season',
      'GET /api/stats/player/:playerId',
      'POST /api/data/fetch',
      'POST /api/data/fetch/quick',
      'GET /api/analysis/draft-strategy',
      'GET /api/analysis/trending'
    ]
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('❌ Server Error:', error);
  res.status(500).json({
    status: 'error',
    message: 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { details: error.message })
  });
});

// ============================================================================
// SERVER STARTUP
// ============================================================================

app.listen(PORT, () => {
  console.log('🏈 Fantasy Football Backend API Server');
  console.log('=' .repeat(50));
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 API endpoints available at http://localhost:${PORT}/api`);
  console.log(`💚 Health check: http://localhost:${PORT}/api/health`);
  console.log('=' .repeat(50));
  
  // Check data availability on startup
  sleeperAPI.generateSummary().then(summary => {
    if (summary) {
      console.log(`✅ Data available: ${summary.total_players} players`);
    } else {
      console.log('⚠️  No data found. Run data fetch: POST /api/data/fetch');
    }
  }).catch(() => {
    console.log('⚠️  Data status unknown. Run data fetch: POST /api/data/fetch');
  });
});
