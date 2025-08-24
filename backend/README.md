# Fantasy Football Backend API

Express.js backend server providing RESTful API for fantasy football data.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Start development server
npm run dev

# Or start production server
npm start
```

## 📡 API Endpoints

### Health & Status
- `GET /api/health` - Server health check
- `GET /api/data/status` - Data availability status

### Players
- `GET /api/players` - Get all players (with filters)
- `GET /api/players/:id` - Get player by ID
- `GET /api/players/search/:query` - Search players by name
- `GET /api/players/position/:position/top` - Top players by position

### Statistics
- `GET /api/stats/season/:season` - Season statistics
- `GET /api/stats/player/:playerId` - Player statistics

### Data Management
- `POST /api/data/fetch` - Fetch all data from Sleeper API
- `POST /api/data/fetch/quick` - Quick fetch (players only)

### Analysis
- `GET /api/analysis/draft-strategy` - Get draft strategy recommendations
- `GET /api/analysis/trending` - Get trending players

## 🔧 Query Parameters

### Players Endpoint
- `active=true` - Filter active players only
- `position=QB` - Filter by position
- `team=KC` - Filter by team
- `search=mahomes` - Search by name
- `limit=50` - Limit results

### Top Players Endpoint
- `format=ppr` - Scoring format (ppr, half_ppr, standard, 2qb)
- `limit=20` - Number of results

## 📊 Example Responses

### Player Data
```json
{
  "status": "success",
  "count": 1,
  "players": [{
    "id": "4881",
    "full_name": "Patrick Mahomes",
    "position": "QB",
    "team": "KC",
    "age": 29,
    "active": true
  }]
}
```

### Draft Strategy
```json
{
  "status": "success",
  "strategy": {
    "earlyRounds": ["Prioritize RBs early due to position scarcity"],
    "middleRounds": ["Wait on QB - good value in middle rounds"],
    "lateRounds": ["Target high-upside handcuffs"],
    "sleepers": {
      "QB": [...],
      "RB": [...],
      "WR": [...],
      "TE": [...]
    }
  }
}
```

## 🗂️ Data Structure

The backend manages data in the following structure:
```
backend/
├── data/
│   ├── players.json
│   ├── stats/
│   │   ├── regular/
│   │   ├── postseason/
│   │   └── preseason/
│   ├── adp/
│   └── news.json
├── src/
│   ├── sleeper-api.js
│   ├── fantasy-analyzer.js
│   └── ...
└── server.js
```

## 🔄 Development

- Server runs on port 3001 by default
- CORS enabled for frontend on port 3000
- Auto-restart with `npm run dev`
- Request logging enabled in development mode

## 🛡️ Security

- Helmet.js for security headers
- CORS configuration
- Request compression
- Environment variable protection
