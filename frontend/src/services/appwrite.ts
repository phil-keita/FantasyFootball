import { Client, Account, Databases, ID } from 'appwrite'

// Appwrite configuration
const client = new Client()

// Get configuration from environment variables
const APPWRITE_ENDPOINT = import.meta.env.VITE_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1'
const APPWRITE_PROJECT_ID = import.meta.env.VITE_APPWRITE_PROJECT_ID

if (!APPWRITE_PROJECT_ID) {
  console.error('⚠️ VITE_APPWRITE_PROJECT_ID is not set in environment variables')
}

client
  .setEndpoint(APPWRITE_ENDPOINT)
  .setProject(APPWRITE_PROJECT_ID)

// Initialize Appwrite services
export const account = new Account(client)
export const databases = new Databases(client)

// Database and collection IDs
export const DATABASE_ID = '68aca4e90038b2ac2c28'
export const DRAFTS_COLLECTION_ID = 'drafts'
export const DRAFT_HISTORY_COLLECTION_ID = 'draft-history'

// Helper to generate unique IDs
export const generateId = () => ID.unique()

// Appwrite client instance (in case needed elsewhere)
export { client }

// Database schema types for TypeScript
export interface AppwriteDraft {
  $id?: string
  $createdAt?: string
  $updatedAt?: string
  userId: string
  draftName: string
  status: 'draft' | 'in-progress' | 'completed' | 'paused'
  
  // Draft Configuration
  config: {
    numberOfTeams: number
    playerPickNumber: number
    leagueSettings: {
      qb: number
      rb: number
      wr: number
      te: number
      flex: number
      def: number
      k: number
      bench: number
    }
    customRules: string
    leagueName: string
  }
  
  // Current Draft State
  currentPick: number
  currentRound: number
  currentTeam: number
  isDraftStarted: boolean
  
  // Teams and Rosters
  teams: Array<{
    id: string
    name: string
    owner: string
    isUserTeam: boolean
    roster: Array<{
      id: string
      name: string
      position: string
      team: string
      draftRound: number
      draftPosition: number
      projectedPoints?: number
    }>
  }>
  
  // Draft Board State
  draftBoard: Array<{
    round: number
    pick: number
    overall: number
    teamId: string
    player?: {
      id: string
      name: string
      position: string
      team: string
    }
  }>
}

export interface AppwriteDraftHistory {
  $id?: string
  $createdAt?: string
  draftId: string
  userId: string
  picks: Array<{
    pick: number
    round: number
    overall: number
    teamId: string
    playerId: string
    playerName: string
    position: string
    team: string
    timestamp: string
  }>
}
