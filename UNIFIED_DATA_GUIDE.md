# 🏈 Fantasy Football Draft Assistant - Unified Data Sources

A comprehensive fantasy football draft assistant that combines data from multiple sources:
- **Sleeper API**: Player database, ADP, statistics
- **FantasyData CSV**: Advanced metrics, projections, rankings
- **Combined Analytics**: Unified player profiles with enriched data

## 🏗️ Architecture

```
FantasyFootball/
├── backend/                    # Node.js API server
│   ├── src/                   # Source code
│   │   ├── data-manager.js    # Unified data management
│   │   ├── sleeper-api.js     # Sleeper API client
│   │   ├── unified-data-fetcher.js  # Multi-source data fetcher
│   │   └── ...
│   ├── data-sources/          # Organized data storage
│   │   ├── sleeper-api/       # Sleeper API data
│   │   ├── fantasy-data/      # FantasyData CSV files
│   │   └── processed/         # Combined & analyzed data
│   └── enhanced-api-server.js # REST API server
├── frontend/                  # React app (to be built)
└── shared/                    # Shared types and constants
```

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm run install:all
```

### 2. Fetch All Data Sources
```bash
# Full pipeline - fetches and combines all data
npm run fetch-data

# Or fetch specific sources
npm run fetch-sleeper    # Sleeper API only
npm run fetch-csv        # FantasyData CSVs only
npm run combine-data     # Combine existing data
```

### 3. Start Backend Server
```bash
npm run server           # Production server
npm run dev:backend      # Development with auto-reload
```

### 4. Access Data via API
```bash
# Get all players with combined data
curl http://localhost:3001/api/players

# Search for specific players
curl http://localhost:3001/api/players/search/mahomes

# Get QB rankings
curl http://localhost:3001/api/rankings/qb?limit=20

# Get data summary
curl http://localhost:3001/api/analysis/summary
```

## 📊 Data Sources

### Sleeper API
- **Players**: Complete NFL player database (11,000+ players)
- **ADP**: Average Draft Position in multiple formats
- **Statistics**: Season and weekly stats (2023, 2024)
- **League Data**: Public league information
- **News**: NFL news updates (when available)

### FantasyData CSV Files
Located in `backend/data-sources/fantasy-data/`:
- `nfl-adp-*.csv` - Average Draft Position data
- `nfl-advanced-*-metrics-*.csv` - Advanced player metrics
- `nfl-fantasy-football-*.csv` - Fantasy projections and stats
- `nfl-rankings-*.csv` - Player rankings
- `nfl-*-efficiency-*.csv` - Efficiency metrics by position

### Combined Data
The system automatically matches and combines data from both sources:
- **Unified Player Profiles**: Complete player data with all available metrics
- **Enhanced Analytics**: Cross-source insights and comparisons
- **Data Quality Tracking**: Source attribution and coverage analysis

## 🛠️ Available Scripts

### Data Management
```bash
npm run fetch-data        # Full data pipeline
npm run fetch-sleeper     # Sleeper API data only
npm run fetch-csv         # Process FantasyData CSVs only
npm run combine-data      # Combine existing data sources
```

### Server Operations
```bash
npm run dev               # Full dev environment
npm run server            # Backend API server
npm run enhanced-server   # Enhanced server with all features
```

### Development
```bash
npm run test-api          # Test API connections
npm run demo              # Data demonstration
npm run health            # Health check
npm run clean             # Clean all data and dependencies
```

## 🌐 API Endpoints

### Player Data
- `GET /api/players` - All players with filters
- `GET /api/players/:id` - Specific player profile
- `GET /api/players/search/:query` - Search players
- `GET /api/rankings/:position` - Position rankings

### Data Sources
- `GET /api/sleeper/players` - Sleeper player data
- `GET /api/sleeper/adp/:format` - ADP by format
- `GET /api/fantasy-data/:category` - FantasyData categories

### Analytics
- `GET /api/analysis/summary` - Data summary
- `GET /api/analysis/positions` - Position analysis
- `POST /api/data/fetch` - Trigger data refresh

## 📈 Data Structure

### Unified Player Profile
```json
{
  "sleeper_id": "4046",
  "name": "Patrick Mahomes",
  "position": "QB",
  "team": "KC",
  "age": 29,
  "adp": 15.4,
  "sleeper_stats_2024": { ... },
  "fantasy_data": {
    "advanced-metrics": [ ... ],
    "projections": [ ... ],
    "rankings": [ ... ]
  },
  "analysis": {
    "data_sources": ["sleeper", "fantasy_data"],
    "last_updated": "2025-08-02T..."
  }
}
```

### Data Coverage
- **Total Players**: ~8,600 active NFL players
- **Sleeper Data**: Complete for all active players
- **FantasyData Enhancement**: Available for skill position players
- **Combined Profiles**: Enriched data for fantasy-relevant players

## 🔍 Usage Examples

### Find Top QBs with ADP
```javascript
fetch('/api/rankings/qb?limit=15')
  .then(res => res.json())
  .then(data => {
    data.players.forEach(qb => {
      console.log(`${qb.name}: ADP ${qb.adp}`);
    });
  });
```

### Search and Get Full Player Profile
```javascript
// Search for player
const search = await fetch('/api/players/search/tyreek hill');
const results = await search.json();

// Get full profile with all data sources
const profile = await fetch(`/api/players/${results.results[0].sleeper_id}`);
const player = await profile.json();

console.log('Sleeper Data:', player.player.sleeper_stats_2024);
console.log('FantasyData:', player.player.fantasy_data);
```

### Trigger Data Refresh
```javascript
fetch('/api/data/fetch', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ source: 'sleeper' })
});
```

## 🎯 Benefits of Unified Approach

1. **Comprehensive Data**: Best of both Sleeper API and FantasyData
2. **Automated Matching**: Smart player name matching across sources
3. **Data Quality**: Track coverage and source attribution
4. **Extensible**: Easy to add new data sources
5. **API Ready**: Clean REST API for frontend integration

## 🔄 Data Pipeline

1. **Fetch Sleeper API**: Players, ADP, stats, leagues
2. **Process FantasyData CSVs**: Parse and categorize all CSV files
3. **Match Players**: Smart name matching between sources
4. **Combine Data**: Create unified player profiles
5. **Generate Analytics**: Summary statistics and insights
6. **Serve via API**: REST endpoints for all data

## 🚧 Next Steps

1. **Build React Frontend**: User interface for draft assistant
2. **Add More Sources**: ESPN, Yahoo, FantasyPros APIs
3. **LLM Integration**: AI-powered draft recommendations
4. **Real-time Updates**: Live data refresh during draft season
5. **Advanced Analytics**: Predictive modeling and insights

---

🏆 **Ready to dominate your fantasy draft with comprehensive data!**
