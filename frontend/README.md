# Fantasy Football Frontend

A React-based fantasy football draft management application with user authentication and multi-draft support.

## Project Structure

```
src/
├── components/           # React components organized by feature
│   ├── auth/            # Authentication components
│   │   ├── AuthPage.tsx
│   │   ├── LoginForm.tsx
│   │   └── RegisterForm.tsx
│   ├── draft/           # Draft-related components
│   │   ├── DraftSetup.tsx
│   │   └── SimpleDraftBoard.tsx
│   ├── layout/          # Layout and navigation components
│   │   └── Navigation.tsx
│   ├── players/         # Player-related components
│   │   ├── PlayerCard.tsx
│   │   └── PlayerList.tsx
│   ├── MyDraftsPage.tsx # Main drafts management page
│   └── index.ts         # Component exports
├── hooks/               # Custom React hooks
│   └── useApi.ts        # API and data fetching hooks
├── services/            # External service integrations
│   ├── api.ts          # Backend API service
│   ├── appwrite.ts     # Appwrite configuration and types
│   └── draftService.ts # Draft-specific database operations
├── store/              # State management (Zustand)
│   ├── authStore.ts    # Authentication state
│   └── draftStore.ts   # Draft and player state
├── types/              # TypeScript type definitions
│   ├── env.d.ts        # Environment variables
│   └── index.ts        # Type exports
├── App.tsx             # Main application component
├── main.tsx           # Application entry point
└── index.css          # Global styles and Tailwind CSS
```

## Key Features

- **Multi-user Authentication**: User registration and login via Appwrite
- **Multi-draft Management**: Users can create and manage multiple drafts
- **Real-time Draft Board**: Interactive draft interface with AI recommendations
- **Player Database**: Comprehensive player data with filtering and search
- **Responsive Design**: Mobile-friendly interface built with Tailwind CSS

## Technology Stack

- **React 18** with TypeScript
- **Vite** for build tooling and development server
- **Zustand** for state management
- **React Router** for client-side routing
- **Appwrite** for authentication and database
- **Tailwind CSS** for styling
- **Lucide React** for icons
- **React Hot Toast** for notifications

## Environment Setup

Create a `.env` file with the following variables:

```env
VITE_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
VITE_APPWRITE_PROJECT_ID=your-project-id
APPWRITE_API_KEY=your-api-key
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking

## Component Organization

### Authentication (`auth/`)
- **AuthPage**: Main authentication wrapper
- **LoginForm**: User login form
- **RegisterForm**: User registration form

### Draft Management (`draft/`)
- **DraftSetup**: Draft configuration and creation
- **SimpleDraftBoard**: Interactive draft board with AI recommendations

### Player Components (`players/`)
- **PlayerCard**: Individual player card with draft capabilities
- **PlayerList**: Filterable and searchable player listing

### Layout (`layout/`)
- **Navigation**: Top navigation with user account controls

## State Management

### Auth Store (`authStore.ts`)
Manages user authentication state including:
- User session management
- Login/logout functionality
- Authentication status

### Draft Store (`draftStore.ts`)
Manages draft-related state including:
- Draft configuration and settings
- Player data and availability
- Draft board state and picks
- AI recommendations
- Team rosters and draft history

## Database Integration

The application integrates with Appwrite for:
- User authentication and session management
- Draft data persistence
- Draft history and picks tracking
- User-specific data isolation

## Development Guidelines

1. **Component Structure**: Components are organized by feature in separate directories
2. **Import Organization**: Use the centralized exports from `components/index.ts`
3. **Type Safety**: All components use TypeScript with proper type definitions
4. **State Management**: Use Zustand stores for complex state, local state for UI-only data
5. **Styling**: Use Tailwind CSS classes with component-specific styles in `index.css`

## Recent Changes

- ✅ Reorganized components into feature-based directories
- ✅ Removed duplicate store files and unused components
- ✅ Updated all import paths for new structure
- ✅ Centralized type definitions and component exports
- ✅ Cleaned up routing for multi-draft architecture
- ✅ Verified TypeScript compilation and build process
