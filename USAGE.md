# 🏈 Fantasy Football Draft Assistant - Complete Usage Guide

## 📋 What You Have

Your Fantasy Football Draft Assistant successfully connects to the Sleeper API and provides:

### ✅ **Working Features**
- **Complete NFL Player Database**: 11,387 players with metadata
- **2023 Season Statistics**: Complete regular season stats for 7,550 players
- **2024 Season Statistics**: Current season stats for 7,565 players  
- **Player Search**: Find any player by name
- **Position Analysis**: Filter and analyze by position, team, status
- **Interactive Draft Assistant**: Command-line tool for draft help

### ⏳ **Temporarily Unavailable** 
- ADP (Average Draft Position) data - endpoints returning 500 errors
- NFL News - endpoint temporarily down
- Weekly stats for 2024 - may become available as season progresses

## 🚀 Quick Start Commands

```bash
# Test the API connection
npm run demo

# Fetch and save all available data
npm run fetch-data

# Start interactive draft assistant
npm start

# Quick test of core functionality
npm run test-api
```

## 📊 Available Data Structure

After running `npm run fetch-data`, you'll have:

```
data/
├── players.json          # All 11K+ NFL players
├── stats/
│   ├── regular/
│   │   ├── season_2023.json    # 2023 complete stats
│   │   ├── season_2024.json    # 2024 current stats
│   │   └── week_*.json         # Weekly stats (when available)
│   ├── postseason/
│   └── preseason/
├── adp/                  # ADP data (when endpoints recover)
└── news.json            # NFL news (when endpoint recovers)
```

## 🎯 Example Usage in Code

```javascript
import { SleeperAPI } from './src/sleeper-api.js';

const api = new SleeperAPI();

// Find a specific player
const mahomes = await api.findPlayer('Patrick Mahomes');
console.log(mahomes); // Full player data

// Get all active QBs
const players = await api.getAllPlayers();
const activeQBs = Object.values(players).filter(p => 
  p.active && p.position === 'QB'
);

// Load 2023 stats
const stats2023 = await api.loadData('./data/stats/regular/season_2023.json');
```

## 🔍 Player Search Examples

The interactive mode (`npm start`) lets you:

1. **Search Players**: "mahomes", "tyreek hill", "jonathan taylor"
2. **View Top Players by Position**: QB, RB, WR, TE rankings
3. **Compare Players**: Side-by-side analysis
4. **View Team Analysis**: Players by team strength

## 📈 Draft Analysis Features

### Position Analysis
- Players by position with team distribution
- Active vs inactive player counts
- Team depth analysis

### Statistical Analysis
- 2023 season performance data
- Current 2024 season stats
- Historical comparison capabilities

### Future LLM Integration
The structure is ready for LLM integration to provide:
- Draft pick recommendations
- Player value analysis  
- Matchup insights
- Sleeper/bust predictions

## 🛠️ Customization Options

### Data Fetching
```bash
npm run fetch-data --quick    # Players + basic data only
npm run fetch-data --stats    # Statistics only
npm run fetch-data --news     # News only (when available)
```

### API Configuration
Edit `src/sleeper-api.js` to:
- Change current season (default: 2024)
- Modify retry logic
- Add custom data filters
- Integrate additional endpoints

## 🔄 Troubleshooting

### ADP Data Not Available
The ADP endpoints are currently returning 500 errors. This is likely temporary:
- Try again in a few hours/days
- ADP data is most critical closer to draft season
- For now, use historical stats for player rankings

### Rate Limiting
If you hit rate limits:
- The API includes retry logic with exponential backoff
- Increase delays between requests in `sleeper-api.js`
- Use `--quick` mode for faster testing

### Data Updates
- Run `npm run fetch-data` weekly during season
- Player data changes frequently (injuries, trades, etc.)
- Stats update after each game week

## 🎮 Interactive Mode Features

When you run `npm start`:

1. **Player Search**: Find any NFL player instantly
2. **Position Rankings**: View top players by position  
3. **Data Summary**: Quick overview of available data
4. **Refresh Data**: Update data without restarting

## 📁 File Structure

```
FantasyFootball/
├── src/
│   ├── sleeper-api.js      # Main API client
│   ├── data-fetcher.js     # Comprehensive data fetching
│   ├── index.js           # Interactive draft assistant
│   ├── fantasy-analyzer.js # Analysis utilities
│   ├── demo.js            # Feature demonstration
│   └── test-api.js        # API testing
├── data/                  # All fetched data (auto-created)
├── package.json
└── README.md
```

## 🚀 Next Steps

1. **Immediate Use**: Run `npm run fetch-data` to get all current data
2. **Draft Season**: Retry ADP endpoints when draft season approaches
3. **LLM Integration**: Add OpenAI/Anthropic API for intelligent recommendations
4. **Web Interface**: Build React frontend for better UX
5. **Real-time Updates**: Add webhook support for live data

## 📞 API Endpoints Summary

### ✅ Working Endpoints
- `GET /players/nfl` - All NFL players ✅
- `GET /stats/nfl/regular/2023` - 2023 season stats ✅  
- `GET /stats/nfl/regular/2024` - 2024 season stats ✅
- `GET /stats/nfl/regular/2024/{week}` - Weekly stats ✅

### ⏳ Temporarily Down
- `GET /players/nfl/adp/*` - ADP data (500 errors)
- `GET /players/nfl/news` - NFL news (500 errors)

Your fantasy football draft assistant is ready to use with comprehensive player data and statistics! 🏆
