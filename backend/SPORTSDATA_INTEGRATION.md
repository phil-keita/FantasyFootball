# SportsData.io Integration Guide

## Overview

This document explains the SportsData.io API integration for the Fantasy Football Draft Assistant. SportsData.io provides comprehensive NFL data including fantasy projections, player stats, injuries, and betting odds.

## Setup Instructions

### 1. Get API Key
1. Sign up at [sportsdata.io](https://sportsdata.io/)
2. Choose a subscription plan (free tier available)
3. Get your API key from the dashboard

### 2. Configure Environment
Add your API key to the `.env` file:
```bash
SPORTSDATA_API_KEY=your-key-here
```

### 3. Test Integration
```bash
# Test basic API connectivity
npm run sportsdata:test

# Fetch sample data
npm run sportsdata:sample

# Full comprehensive data fetch
npm run sportsdata:full
```

## Available Data Sources

### Player Information
- **Players**: Complete player profiles with biographical data
- **Teams**: Team information and rosters  
- **Depth Charts**: Position depth charts for all teams

### Fantasy Projections
- **Season Projections**: Full season fantasy point projections
- **Weekly Projections**: Week-by-week fantasy projections
- **ADP Data**: Average Draft Position data
- **Auction Values**: Fantasy auction draft values

### Statistics & Performance
- **Season Stats**: Complete season statistics
- **Weekly Stats**: Week-by-week player performance
- **Advanced Metrics**: Snap counts, targets, air yards, etc.
- **Red Zone Stats**: Red zone usage and efficiency

### Real-Time Information
- **Injuries**: Current injury reports and status
- **News**: Player news and updates
- **Depth Chart Changes**: Real-time depth chart updates

### Daily Fantasy Sports (DFS)
- **Salaries**: DFS salaries for major platforms (DraftKings, FanDuel)
- **Ownership**: Projected ownership percentages
- **Optimal Lineups**: DFS lineup optimization data

### Betting & Odds
- **Game Odds**: Betting lines and spreads
- **Player Props**: Individual player betting props
- **O/U Totals**: Over/under betting totals

## API Client Usage

### Basic Usage
```javascript
import { SportsDataIOAPI } from './src/sportsdata-io-api.js';

const api = new SportsDataIOAPI();

// Get all players
const players = await api.getPlayers(2024);

// Get season projections
const projections = await api.getSeasonProjections(2024);

// Get current injuries
const injuries = await api.getInjuries();
```

### Player Search
```javascript
// Find player by name
const mahomes = await api.findPlayer('Mahomes');

// Get comprehensive player profile
const profile = await api.getPlayerProfile('Patrick Mahomes');
```

### Data Fetching
```javascript
// Fetch all fantasy-relevant data
const allData = await api.fetchAllFantasyData(2024);

// Weekly projections
const week1Proj = await api.getWeeklyProjections(2024, 1);

// DFS data
const dfsSalaries = await api.getDFSSalaries(1);
```

## Multi-Source Analysis

The system combines SportsData.io with Sleeper API and FantasyData CSVs for comprehensive analysis:

```bash
# Run complete multi-source demo
npm run multi-source:demo

# Test all data sources
npm run multi-source:test

# Quick single player analysis
npm run multi-source:quick
```

### Multi-Source Player Profile
```javascript
import { MultiSourceAnalyzer } from './src/multi-source-analyzer.js';

const analyzer = new MultiSourceAnalyzer();

// Create comprehensive profile combining all data sources
const profile = await analyzer.createSuperProfile('Josh Allen');

// Generate draft report for multiple players
const report = await analyzer.generateDraftReport([
  'Josh Allen', 'Christian McCaffrey', 'Cooper Kupp'
]);
```

## Data Structure

### Player Profile
```javascript
{
  player_name: "Josh Allen",
  timestamp: "2024-01-01T00:00:00.000Z",
  data_sources: {
    sleeper: {
      player_id: "4881",
      full_name: "Josh Allen",
      position: "QB",
      team: "BUF",
      age: 28,
      // ... more Sleeper data
    },
    sportsdata: {
      basic: {
        PlayerID: 20678,
        FirstName: "Josh",
        LastName: "Allen",
        Position: "QB",
        Team: "BUF",
        // ... more SportsData.io data
      },
      projections: {
        FantasyPoints: 285.5,
        PassingYards: 4200,
        // ... more projections
      },
      stats: {
        // Current season stats
      }
    },
    fantasydata: {
      adp: {
        "Overall Rank": "8",
        "Position Rank": "2",
        // ... more ADP data
      },
      projections: {
        "Fantasy Points": "290.2",
        // ... more CSV projections
      }
    }
  },
  analysis: {
    consensus_projection: {
      average_points: 287.85,
      confidence: "High"
    },
    value_analysis: {
      adp_rank: 8,
      adp_tier: "Elite (Round 1)",
      value_assessment: "Fair value"
    },
    risk_assessment: {
      risk_level: "Low",
      risk_factors: []
    },
    draft_recommendation: {
      overall_grade: "A",
      target_rounds: [1],
      llm_summary: "Josh Allen (QB) receives an A grade..."
    }
  }
}
```

## LLM Integration

The multi-source data is structured for optimal LLM analysis:

1. **Comprehensive Profiles**: Each player gets data from all available sources
2. **Consensus Projections**: Multiple projection sources averaged with confidence scores
3. **Value Analysis**: ADP vs projection analysis for draft value
4. **Risk Assessment**: Injury, age, and performance risk factors
5. **LLM-Ready Summaries**: Natural language summaries for each player

### Sample LLM Prompt Integration
```javascript
const profile = await analyzer.createSuperProfile('Cooper Kupp');
const llmPrompt = `
Based on this comprehensive fantasy football data for ${profile.player_name}:

${profile.analysis.draft_recommendation.llm_summary}

Data completeness: ${profile.analysis.data_quality.completeness_score}%
Consensus projection: ${profile.analysis.consensus_projection?.average_points} points
Value assessment: ${profile.analysis.value_analysis?.value_assessment}

Should I draft this player in Round ${Math.ceil(profile.analysis.value_analysis?.adp_rank / 12)}?
`;
```

## API Rate Limits

SportsData.io has rate limits depending on your subscription:
- **Free Tier**: 1,000 calls/month
- **Paid Tiers**: Higher limits based on plan

The API client includes:
- Automatic retry logic
- Rate limiting protection
- Error handling for exceeded limits

## Data Storage

All fetched data is automatically saved to:
```
/backend/data-sources/sportsdata-io/
├── players/
│   ├── players_2024.json
│   ├── teams.json
│   └── depth_charts.json
├── projections/
│   ├── season_2024.json
│   └── week_1_2024.json
├── stats/
│   ├── season_stats_2024.json
│   └── week_1_stats_2024.json
├── injuries/
│   └── current_injuries.json
├── news/
│   └── player_news.json
├── fantasy/
│   ├── adp_2024.json
│   └── dfs_salaries_week_1.json
└── odds/
    └── week_1_odds_2024.json
```

## Error Handling

The API client handles common errors:
- Invalid API key
- Rate limit exceeded
- Network timeouts
- Missing data endpoints

All errors are logged with helpful troubleshooting information.

## Performance Tips

1. **Batch Requests**: Use `fetchAllFantasyData()` for initial setup
2. **Cache Data**: Data is automatically cached to local files
3. **Selective Updates**: Update only specific weeks/data types as needed
4. **Monitor Usage**: Track API calls to stay within limits

## Support

For SportsData.io API issues:
- Documentation: [sportsdata.io/developers](https://sportsdata.io/developers)
- Support: Contact SportsData.io support team
- Coverage: [NFL API Coverage](https://sportsdata.io/developers/coverages/nfl)
