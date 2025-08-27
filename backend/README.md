# Fantasy Football Backend API

Express.js backend server with Appwrite integration, AI-powered recommendations, and comprehensive NFL player data management.

## 🏗️ Architecture

```
backend/
├── src/                      # Core application logic
│   ├── data-manager.js       # Data management and storage
│   ├── draft-agent.js        # AI-powered draft assistant
│   ├── sleeper-api.js        # Sleeper API integration
│   └── unified-data-fetcher.js # Multi-source data fetching
├── data-sources/             # Organized data storage
│   ├── sleeper-api/          # Sleeper API data cache
│   ├── fantasy-data/         # Additional data sources
│   └── processed/            # Processed and analyzed data
├── enhanced-api-server.js    # Main API server
├── setup-database.js         # Appwrite database setup script
└── package.json             # Dependencies and scripts
```

## ✨ Key Features

- 🔐 **Appwrite Integration**: Database and authentication support
- 🤖 **AI Recommendations**: OpenAI-powered draft suggestions
- 📊 **Comprehensive Data**: 11,000+ NFL players with statistics
- 🏈 **Sleeper API**: Real-time NFL data and player information
- 🚀 **RESTful API**: Clean, documented endpoints for frontend
- ⚡ **Smart Caching**: Efficient data management and updates

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your API keys

# Set up Appwrite database
npm run setup-database

# Start development server
npm run dev

# Or start production server
npm start
```

## 🔧 Environment Configuration

Required environment variables in `.env`:

```bash
# Server Configuration
NODE_ENV=development
PORT=3001
FRONTEND_URL=http://localhost:5173

# Sleeper API
SLEEPER_BASE_URL=https://api.sleeper.app/v1
CURRENT_SEASON=2024

# Data Management
DATA_DIRECTORY=./data-sources
CACHE_DURATION_HOURS=6

# AI Recommendations (Required)
OPENAI_API_KEY=your_openai_api_key_here

# Optional: Additional APIs
SPORTSDATA_API_KEY=your_sportsdata_io_api_key_here
```

## 📡 API Endpoints

### Health & System
- `GET /api/health` - Server health check
- `GET /api/data/status` - Data availability and freshness status
- `GET /api/system/info` - System information and statistics

### Player Data
- `GET /api/players` - Get players with advanced filtering
- `GET /api/players/:id` - Get detailed player information
- `GET /api/players/search/:query` - Smart player search
- `GET /api/players/position/:position` - Players by position
- `GET /api/players/position/:position/top` - Top players by position with ADP

### Draft Intelligence
- `POST /api/draft/recommend` - AI-powered draft recommendations
- `GET /api/draft/strategy` - General draft strategy insights
- `POST /api/draft/analyze` - Analyze draft scenario

### Statistics & Trends
- `GET /api/stats/season/:season/:type` - Season statistics (regular/postseason)
- `GET /api/stats/player/:playerId` - Individual player stats
- `GET /api/trending/adds` - Trending player additions
- `GET /api/trending/drops` - Trending player drops

### Data Management
- `POST /api/data/fetch` - Comprehensive data fetch from all sources
- `POST /api/data/fetch/players` - Fetch player data only
- `POST /api/data/fetch/stats` - Fetch statistics only
- `POST /api/data/update` - Update stale data selectively

## 🔧 Query Parameters & Filters

### Players Endpoint (`/api/players`)
```
?active=true          # Active players only
?position=QB          # Filter by position (QB, RB, WR, TE, K, DEF)
?team=KC             # Filter by team abbreviation
?search=mahomes      # Search by player name
?limit=50            # Limit number of results
?injury_status=Healthy # Filter by injury status
```

### Top Players Endpoint (`/api/players/position/:position/top`)
```
?format=ppr          # Scoring format (ppr, half_ppr, standard, 2qb)
?limit=20            # Number of results to return
?min_adp=1           # Minimum ADP threshold
?max_adp=100         # Maximum ADP threshold
```

### Draft Recommendations (`POST /api/draft/recommend`)
Request body:
```json
{
  "draftedPlayers": [...],
  "currentPick": 15,
  "userTeam": "MyTeam",
  "leagueSettings": {
    "teams": 12,
    "format": "PPR",
    "rounds": 16
  }
}
```

## 📊 Example API Responses

### Player Search Response
```json
{
  "status": "success",
  "count": 1,
  "players": [{
    "id": "4881",
    "full_name": "Patrick Mahomes",
    "first_name": "Patrick",
    "last_name": "Mahomes",
    "position": "QB",
    "team": "KC",
    "age": 29,
    "height": "6'3\"",
    "weight": "230",
    "active": true,
    "injury_status": "Healthy",
    "years_exp": 7
  }]
}
```

### AI Draft Recommendation Response
```json
{
  "status": "success",
  "recommendation": "Consider targeting Christian McCaffrey or Austin Ekeler. RB scarcity in your league makes this an optimal pick.",
  "reasoning": "With 8 RBs already drafted and only 4 top-tier options remaining, securing RB depth is crucial for your championship chances.",
  "suggestedPlayers": [
    {
      "name": "Christian McCaffrey",
      "position": "RB", 
      "team": "SF",
      "reasoning": "Elite volume and TD upside"
    }
  ]
}
```

### System Status Response
```json
{
  "status": "success",
  "data": {
    "players": {
      "total": 11387,
      "active": 2847,
      "lastUpdated": "2024-08-25T10:30:00Z"
    },
    "stats": {
      "seasons": ["2023", "2024"],
      "lastUpdated": "2024-08-25T08:00:00Z"
    },
    "services": {
      "sleeper": "healthy",
      "openai": "healthy",
      "database": "connected"
    }
  }
}
```

## 🗂️ Data Architecture

### Data Sources Integration
```
data-sources/
├── sleeper-api/              # Sleeper API cache
│   ├── players/              # Player database
│   ├── stats/                # Season and weekly statistics  
│   ├── trending/             # Add/drop trends
│   └── state/                # NFL season context
├── fantasy-data/             # Additional CSV data sources
│   ├── projections/          # Player projections
│   ├── adp/                  # Average draft position
│   └── rankings/             # Expert rankings
└── processed/                # AI-enhanced data
    ├── recommendations/      # Generated insights
    └── analysis/             # Draft strategy data
```

### Core Services
- **Data Manager** (`data-manager.js`): Handles data storage, caching, and freshness
- **Draft Agent** (`draft-agent.js`): AI-powered draft recommendations using OpenAI
- **Sleeper API** (`sleeper-api.js`): Complete Sleeper API integration
- **Unified Fetcher** (`unified-data-fetcher.js`): Multi-source data aggregation

### Database Integration
- **Appwrite Database**: User drafts and draft history
- **Local Data Cache**: Player data and statistics for fast access
- **Smart Sync**: Automatic data freshness management

## � Available Scripts

### Development
- `npm run dev` - Start development server with auto-reload
- `npm run dev:server` - Start server only (no data fetching)
- `npm run server` - Start production server

### Data Management
- `npm run fetch-data` - Fetch all data from sources
- `npm run fetch-data:force` - Force refresh all data
- `npm run fetch-players` - Update player database only
- `npm run fetch-stats` - Update statistics only
- `npm run setup-database` - Initialize Appwrite collections

### Testing & Analysis
- `npm run test-api` - Test API connectivity
- `npm run health` - Backend health check
- `npm run demo` - Interactive data demo
- `npm run analyze-league <id>` - Analyze specific league

### Utilities
- `npm run clean` - Clean cached data
- `npm run build` - Build for production

## 🔄 Development Workflow

1. **Start the server**: `npm run dev`
2. **Fetch initial data**: `npm run fetch-data` (first time only)
3. **Test API endpoints**: `npm run test-api`
4. **Access API**: Server runs on `http://localhost:3001`
5. **Monitor logs**: Watch for data updates and API requests

## 🤖 AI Integration

### OpenAI Draft Agent
The backend includes sophisticated AI-powered draft recommendations:

- **Context Analysis**: Evaluates current draft state, remaining players, and team needs
- **Strategy Intelligence**: Considers positional scarcity and value-based drafting
- **League Awareness**: Adapts recommendations to specific league settings
- **Real-time Updates**: Provides dynamic suggestions as draft progresses

### Configuration
Requires `OPENAI_API_KEY` in environment variables. The draft agent uses GPT-4 for:
- Draft pick recommendations
- Strategic analysis
- Player comparisons
- Situational advice

## 🛡️ Security & Performance

### Security Features
- **Helmet.js**: Security headers and protection
- **CORS**: Configured for frontend integration
- **Environment Protection**: Secure API key management
- **Request Validation**: Input sanitization and validation
- **Rate Limiting**: API endpoint protection

### Performance Optimizations
- **Smart Caching**: 6-hour cache duration for player data
- **Request Compression**: Gzip compression for API responses
- **Database Connection Pooling**: Efficient Appwrite integration
- **Selective Updates**: Update only stale data sources
- **Memory Management**: Optimized data structures for large datasets

### Monitoring
- **Health Endpoints**: Real-time system status
- **Request Logging**: Comprehensive API request tracking
- **Error Handling**: Graceful error responses and logging
- **Data Freshness**: Automatic monitoring of data staleness

## 🚀 Production Deployment

### Prerequisites
- Node.js 18+
- OpenAI API key for AI recommendations
- Appwrite project configured
- Environment variables set

### Environment Variables for Production
```bash
NODE_ENV=production
PORT=3001
OPENAI_API_KEY=your_production_key
FRONTEND_URL=https://your-frontend-domain.com
```

### Deployment Platforms
- **Heroku**: `git push heroku main`
- **Railway**: Connect GitHub repository
- **DigitalOcean**: App Platform deployment
- **AWS/GCP/Azure**: Container or serverless deployment

## 🔗 Integration Points

### Frontend Integration
- RESTful API endpoints for all data needs
- CORS configured for cross-origin requests
- JSON responses with consistent error handling
- Real-time draft recommendations

### External Services
- **Sleeper API**: Primary data source for NFL information
- **OpenAI**: AI-powered draft recommendations
- **Appwrite**: User data and draft persistence
- **SportsData.io**: Optional additional statistics (if configured)

---

## 📞 Support & Development

For questions or issues:
1. Check the health endpoint: `GET /api/health`
2. Review server logs for error details
3. Verify environment variable configuration
4. Test individual API endpoints

The backend provides comprehensive NFL data and intelligent draft assistance to power your fantasy football success! 🏆
