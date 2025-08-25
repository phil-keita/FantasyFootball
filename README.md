# Fantasy Football Draft Assistant

A modern full-stack fantasy football draft management application with user authentication, multi-draft support, and AI-powered recommendations.

## 🏗️ Architecture

This project is structured as a monorepo with separate frontend and backend applications:

```
FantasyFootball/
├── backend/                 # Express.js API server + Appwrite integration
│   ├── src/                 # Core application logic
│   ├── enhanced-api-server.js # REST API server
│   ├── setup-database.js    # Appwrite database setup script
│   └── package.json         # Backend dependencies and scripts
├── frontend/                # React.js application
│   ├── src/                 # Organized component structure
│   │   ├── components/      # Feature-based component organization
│   │   ├── services/        # API and external service integration
│   │   ├── store/           # Zustand state management
│   │   └── types/           # TypeScript type definitions
│   └── package.json         # Frontend dependencies and scripts
├── package.json             # Workspace management and unified scripts
└── README.md                # This file
```

## ✨ Key Features

### 🔐 **Authentication & User Management**
- User registration and login via Appwrite
- Secure session management
- User-specific draft isolation

### 🏈 **Multi-Draft Management**
- Create and manage multiple drafts per user
- Configurable league settings (teams, positions, scoring)
- Draft history and state persistence
- Resume drafts in progress

### 🤖 **AI-Powered Recommendations**
- Context-aware draft suggestions
- Real-time analysis based on current picks
- Position scarcity awareness
- League-specific strategy recommendations

### 📊 **Player Database**
- Comprehensive NFL player data
- Advanced search and filtering
- Position-based views
- Player statistics and projections

### 🎯 **Interactive Draft Board**
- Real-time draft tracking
- Snake draft support
- Team roster management
- Pick history and undo functionality

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Appwrite account (for database and authentication)

### Initial Setup

1. **Clone and install dependencies:**
```bash
git clone <repository-url>
cd FantasyFootball
npm run install:all
```

2. **Set up Appwrite:**
   - Follow the [APPWRITE_SETUP.md](./APPWRITE_SETUP.md) guide
   - Create your Appwrite project and database
   - Configure environment variables

3. **Initialize the database:**
```bash
npm run setup-database
```

4. **Start the development servers:**
```bash
# Start both backend and frontend
npm run dev

# Or start individually:
npm run dev:backend  # Backend on http://localhost:3001
npm run dev:frontend # Frontend on http://localhost:5173
```

## 📋 Available Scripts

### 🚀 Development
- `npm run dev` - Start both backend and frontend
- `npm run dev:backend` - Start backend server only
- `npm run dev:frontend` - Start frontend development server

### 🏗️ Build & Deploy
- `npm run build` - Build both applications for production
- `npm run build:backend` - Build backend only
- `npm run build:frontend` - Build frontend only

### 🛠️ Setup & Maintenance
- `npm run install:all` - Install dependencies for all workspaces
- `npm run setup-database` - Initialize Appwrite database collections
- `npm run clean` - Clean all node_modules and build artifacts

### 🧪 Testing & Health
- `npm run test-api` - Test backend API connectivity
- `npm run health` - Check backend health status

## 🔧 Configuration

### Backend Configuration
Create `backend/.env`:
```bash
NODE_ENV=development
PORT=3001
FRONTEND_URL=http://localhost:5173
SLEEPER_BASE_URL=https://api.sleeper.app/v1
CURRENT_SEASON=2024
DATA_DIRECTORY=./data
CACHE_DURATION_HOURS=6
OPENAI_API_KEY=your_openai_api_key_here
```

### Frontend Configuration  
Create `frontend/.env`:
```bash
VITE_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
VITE_APPWRITE_PROJECT_ID=your-project-id
APPWRITE_API_KEY=your-api-key
```

## 📁 Project Structure

### Frontend Organization
```
frontend/src/
├── components/
│   ├── auth/           # Authentication components
│   ├── draft/          # Draft management components  
│   ├── layout/         # Navigation and layout
│   ├── players/        # Player-related components
│   └── index.ts        # Component exports
├── services/           # API and external services
├── store/              # Zustand state management
├── types/              # TypeScript definitions
└── hooks/              # Custom React hooks
```

### Backend Organization
```
backend/src/
├── data-manager.js          # Data management and storage
├── draft-agent.js           # Draft assistant logic
├── sleeper-api.js          # Sleeper API integration
└── unified-data-fetcher.js  # Multi-source data fetching
```

## 🛡️ Authentication & Security

- **Appwrite Authentication**: Secure user management
- **Document-level permissions**: Users can only access their own drafts
- **Session management**: Automatic session handling and renewal
- **CORS configuration**: Secure cross-origin requests

## 📊 Database Schema

### Drafts Collection
- User-specific draft configurations
- League settings and team information
- Current draft state and progress
- Draft board and pick tracking

### Draft History Collection
- Complete pick-by-pick draft history
- User actions and timestamps
- Draft completion tracking

## 🎯 API Endpoints

### Authentication
- User registration and login handled by Appwrite

### Draft Management
- `GET /api/drafts` - Get user's drafts
- `POST /api/drafts` - Create new draft
- `GET /api/drafts/:id` - Get specific draft
- `PUT /api/drafts/:id` - Update draft state
- `DELETE /api/drafts/:id` - Delete draft

### Player Data
- `GET /api/players` - Get players with filters
- `GET /api/players/search` - Search players
- `POST /api/draft/recommend` - Get AI recommendations

## 🚢 Deployment

### Backend Deployment
- Supports Heroku, Railway, DigitalOcean, AWS, etc.
- Configure environment variables for production
- Ensure Appwrite endpoints are accessible

### Frontend Deployment  
- Supports Vercel, Netlify, GitHub Pages
- Build with `npm run build:frontend`
- Configure production environment variables

## 🔄 Development Workflow

1. **Start with the backend:** `npm run dev:backend`
2. **Test API endpoints:** `npm run test-api`
3. **Start the frontend:** `npm run dev:frontend`
4. **Create user account** and test authentication
5. **Create a draft** and test functionality
6. **Check Appwrite console** to verify data persistence

## 🤝 Contributing

1. **Component Development**: Add new components following the organized structure
2. **API Enhancements**: Extend backend functionality and endpoints
3. **Features**: Implement new draft features and user experience improvements
4. **Testing**: Add tests for both frontend and backend components

## 📜 License

ISC License - Philippe Keita

---

## 🏆 Ready to Draft!

Your comprehensive fantasy football draft assistant is ready to help you dominate your league! 

Start with `npm run dev` and navigate to `http://localhost:5173` to begin drafting.

For detailed setup instructions, see [APPWRITE_SETUP.md](./APPWRITE_SETUP.md).
