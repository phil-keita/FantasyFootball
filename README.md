# Fantasy Football Draft Assistant

A comprehensive tool to help you dominate your fantasy football draft using Sleeper API data and LLM analysis.

## 🏗️ **Architecture**

This project is structured as a full-stack application:

```
FantasyFootball/
├── backend/          # Express.js API server
├── frontend/         # React.js user interface (coming soon)
├── shared/           # Shared constants and utilities
└── package.json      # Workspace management
```

### � **Backend** (Ready)
- Express.js REST API server
- Sleeper API integration
- Data fetching and caching
- Fantasy football analysis tools
- Comprehensive player and statistics endpoints

### 🎨 **Frontend** (Planned)
- React.js user interface
- Interactive draft board
- Player analytics dashboard
- Real-time draft recommendations

## 🚀 **Quick Start**

```bash
# Install all dependencies
npm run install:all

# Start backend server
npm run dev:backend

# Test API connection
npm run test-api

# Fetch data from Sleeper API
npm run fetch-data
```

## 📡 **Backend API**

The backend server provides comprehensive REST endpoints:

### 🏃‍♂️ **Quick Test**
```bash
# Start the backend
cd backend && npm run dev

# Test the API
curl http://localhost:3001/api/health
```

### 📊 **Key Endpoints**
- `GET /api/players` - Get all players with filtering
- `GET /api/players/search/mahomes` - Search for players
- `GET /api/players/position/QB/top` - Top QBs with ADP
- `POST /api/data/fetch` - Refresh data from Sleeper API
- `GET /api/analysis/draft-strategy` - Get draft recommendations

## 📊 **Available Data**

✅ **Currently Working:**
- **11,387 NFL Players** with complete metadata
- **2023 & 2024 Season Statistics** (7,500+ players each)
- **Player Search** and filtering capabilities
- **Position Analysis** and rankings
- **Draft Strategy** recommendations

⏳ **Temporarily Unavailable:**
- ADP (Average Draft Position) data
- NFL News updates

## 🛠️ **Development**

### Backend Development
```bash
cd backend

# Install dependencies
npm install

# Start development server with auto-reload
npm run dev

# Fetch fresh data
npm run fetch-data

# Run API tests
npm run test-api
```

### Frontend Development (When Ready)
```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

### Full Stack Development
```bash
# Start both backend and frontend simultaneously
npm run dev

# Install dependencies for all workspaces
npm run install:all
```

## 📋 **API Examples**

### Get Top QBs
```bash
curl "http://localhost:3001/api/players/position/QB/top?limit=10&format=ppr"
```

### Search for a Player
```bash
curl "http://localhost:3001/api/players/search/mahomes"
```

### Get Draft Strategy
```bash
curl "http://localhost:3001/api/analysis/draft-strategy?league_size=12&format=ppr"
```

### Fetch New Data
```bash
curl -X POST "http://localhost:3001/api/data/fetch"
```

## 🎯 **Features**

### ✅ **Current Features**
- 📊 Complete NFL player database access
- 📈 Historical and current season statistics
- 🔍 Advanced player search and filtering
- 🎯 Position-based rankings and analysis
- 📋 Draft strategy recommendations
- 🚀 RESTful API with comprehensive endpoints
- 🔄 Automatic data fetching and caching

### 🚧 **Coming Soon**
- 🎨 React-based user interface
- 📱 Interactive draft board
- 📊 Advanced analytics dashboard
- 🤖 LLM-powered draft recommendations
- 📰 Real-time news and updates
- 📈 ADP tracking and analysis

## 🔧 **Configuration**

### Backend Configuration
```bash
cd backend
cp .env.example .env
# Edit .env with your preferences
```

### Environment Variables
- `PORT=3001` - Backend server port
- `FRONTEND_URL=http://localhost:3000` - Frontend URL for CORS
- `NODE_ENV=development` - Environment mode

## 📂 **Data Structure**

The backend organizes data in:
```
backend/data/
├── players.json              # All NFL players
├── stats/
│   ├── regular/
│   │   ├── season_2023.json  # 2023 season stats
│   │   ├── season_2024.json  # 2024 season stats
│   │   └── week_*.json       # Weekly stats
│   ├── postseason/
│   └── preseason/
├── adp/                      # ADP data (when available)
└── news.json                 # NFL news (when available)
```

## 🧪 **Testing**

```bash
# Test backend API
npm run test-api

# Demo all features
npm run demo

# Check data status
curl http://localhost:3001/api/data/status
```

## 🚀 **Deployment**

### Backend Deployment
The backend is ready for deployment to platforms like:
- Heroku
- Railway
- DigitalOcean App Platform
- AWS/GCP/Azure

### Frontend Deployment (When Ready)
The frontend will be deployable to:
- Vercel
- Netlify
- GitHub Pages

## 🤝 **Contributing**

1. Backend improvements and new endpoints
2. Frontend development (when ready)
3. Additional data sources and analysis
4. LLM integration for smarter recommendations

## 📜 **License**

ISC License - Philippe Keita

---

**Ready to dominate your fantasy draft!** 🏆

Start with `npm run dev:backend` and explore the API at `http://localhost:3001/api`
Fantasy Football Drafting Tool
