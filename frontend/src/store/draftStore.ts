import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

export interface Player {
  id: string
  name: string
  position: 'QB' | 'RB' | 'WR' | 'TE' | 'K' | 'DEF'
  team: string
  projectedPoints?: number
  adp?: number // Average Draft Position
  tier?: number
  byeWeek?: number
  isDrafted: boolean
  draftedBy?: string
  draftPosition?: number
  draftRound?: number
}

export interface Team {
  id: string
  name: string
  owner: string
  roster: Player[]
  isUserTeam: boolean
}

export interface DraftPick {
  round: number
  pick: number
  overall: number
  teamId: string
  player?: Player
}

interface DraftStore {
  // Draft Settings
  numTeams: number
  numRounds: number
  currentPick: number
  currentRound: number
  currentTeam: number
  isUserTurn: boolean
  
  // Teams and Players
  teams: Team[]
  allPlayers: Player[]
  availablePlayers: Player[]
  draftBoard: DraftPick[]
  
  // UI State
  selectedPosition: string | null
  searchQuery: string
  sortBy: 'adp' | 'projectedPoints' | 'name'
  
  // LLM Recommendations
  recommendations: Player[]
  isLoadingRecommendations: boolean
  
  // Actions
  initializeDraft: (numTeams: number, teamNames: string[], userTeamIndex: number) => void
  setPlayers: (players: Player[]) => void
  draftPlayer: (playerId: string, teamId?: string) => void
  undoDraft: () => void
  setSelectedPosition: (position: string | null) => void
  setSearchQuery: (query: string) => void
  setSortBy: (sortBy: 'adp' | 'projectedPoints' | 'name') => void
  getRecommendations: () => Promise<void>
  nextPick: () => void
}

export const useDraftStore = create<DraftStore>()(
  devtools(
    (set, get) => ({
      // Initial state
      numTeams: 12,
      numRounds: 16,
      currentPick: 1,
      currentRound: 1,
      currentTeam: 1,
      isUserTurn: false,
      
      teams: [],
      allPlayers: [],
      availablePlayers: [],
      draftBoard: [],
      
      selectedPosition: null,
      searchQuery: '',
      sortBy: 'adp',
      
      recommendations: [],
      isLoadingRecommendations: false,
      
      // Actions
      initializeDraft: (numTeams, teamNames, userTeamIndex) => {
        const teams: Team[] = teamNames.map((name, index) => ({
          id: `team-${index + 1}`,
          name,
          owner: name,
          roster: [],
          isUserTeam: index === userTeamIndex
        }))
        
        const draftBoard: DraftPick[] = []
        for (let round = 1; round <= 16; round++) {
          for (let pick = 1; pick <= numTeams; pick++) {
            const teamIndex = round % 2 === 1 ? pick - 1 : numTeams - pick
            draftBoard.push({
              round,
              pick,
              overall: (round - 1) * numTeams + pick,
              teamId: teams[teamIndex].id
            })
          }
        }
        
        set({
          numTeams,
          numRounds: 16,
          teams,
          draftBoard,
          currentPick: 1,
          currentRound: 1,
          currentTeam: 1,
          isUserTurn: teams[0].isUserTeam
        })
      },
      
      setPlayers: (players) => {
        const availablePlayers = players.filter(p => !p.isDrafted)
        set({ 
          allPlayers: players, 
          availablePlayers 
        })
      },
      
      draftPlayer: (playerId, teamId) => {
        const state = get()
        const player = state.allPlayers.find(p => p.id === playerId)
        const currentDraftPick = state.draftBoard[state.currentPick - 1]
        const draftTeamId = teamId || currentDraftPick.teamId
        
        if (!player || player.isDrafted) return
        
        // Update player
        const updatedPlayer = {
          ...player,
          isDrafted: true,
          draftedBy: draftTeamId,
          draftPosition: state.currentPick,
          draftRound: state.currentRound
        }
        
        // Update all players
        const allPlayers = state.allPlayers.map(p => 
          p.id === playerId ? updatedPlayer : p
        )
        
        // Update team roster
        const teams = state.teams.map(team => 
          team.id === draftTeamId 
            ? { ...team, roster: [...team.roster, updatedPlayer] }
            : team
        )
        
        // Update draft board
        const draftBoard = state.draftBoard.map((pick, index) => 
          index === state.currentPick - 1 
            ? { ...pick, player: updatedPlayer }
            : pick
        )
        
        // Advance to next pick
        const nextPickIndex = state.currentPick
        const nextPick = state.draftBoard[nextPickIndex]
        const nextRound = Math.ceil((state.currentPick + 1) / state.numTeams)
        const nextTeam = nextPick ? state.teams.findIndex(t => t.id === nextPick.teamId) + 1 : 1
        const isUserTurn = nextPick ? state.teams.find(t => t.id === nextPick.teamId)?.isUserTeam || false : false
        
        set({
          allPlayers,
          availablePlayers: allPlayers.filter(p => !p.isDrafted),
          teams,
          draftBoard,
          currentPick: state.currentPick + 1,
          currentRound: nextRound,
          currentTeam: nextTeam,
          isUserTurn
        })
      },
      
      undoDraft: () => {
        const state = get()
        if (state.currentPick <= 1) return
        
        const previousPickIndex = state.currentPick - 2
        const previousPick = state.draftBoard[previousPickIndex]
        
        if (!previousPick.player) return
        
        // Restore player
        const allPlayers = state.allPlayers.map(p => 
          p.id === previousPick.player!.id 
            ? { ...p, isDrafted: false, draftedBy: undefined, draftPosition: undefined, draftRound: undefined }
            : p
        )
        
        // Remove from team roster
        const teams = state.teams.map(team => ({
          ...team,
          roster: team.roster.filter(p => p.id !== previousPick.player!.id)
        }))
        
        // Clear draft board pick
        const draftBoard = state.draftBoard.map((pick, index) => 
          index === previousPickIndex 
            ? { ...pick, player: undefined }
            : pick
        )
        
        const prevRound = Math.ceil((state.currentPick - 1) / state.numTeams)
        const prevTeam = state.teams.findIndex(t => t.id === previousPick.teamId) + 1
        const isUserTurn = state.teams.find(t => t.id === previousPick.teamId)?.isUserTeam || false
        
        set({
          allPlayers,
          availablePlayers: allPlayers.filter(p => !p.isDrafted),
          teams,
          draftBoard,
          currentPick: state.currentPick - 1,
          currentRound: prevRound,
          currentTeam: prevTeam,
          isUserTurn
        })
      },
      
      setSelectedPosition: (position) => set({ selectedPosition: position }),
      setSearchQuery: (query) => set({ searchQuery: query }),
      setSortBy: (sortBy) => set({ sortBy }),
      
      getRecommendations: async () => {
        const state = get()
        set({ isLoadingRecommendations: true })
        
        try {
          const response = await fetch('/api/recommendations', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              availablePlayers: state.availablePlayers,
              userTeam: state.teams.find(t => t.isUserTeam),
              currentRound: state.currentRound,
              currentPick: state.currentPick,
              draftedPlayers: state.allPlayers.filter(p => p.isDrafted),
            }),
          })
          
          if (response.ok) {
            const recommendations = await response.json()
            set({ recommendations, isLoadingRecommendations: false })
          }
        } catch (error) {
          console.error('Failed to get recommendations:', error)
          set({ isLoadingRecommendations: false })
        }
      },
      
      nextPick: () => {
        const state = get()
        const nextPickIndex = state.currentPick
        const nextPick = state.draftBoard[nextPickIndex]
        
        if (!nextPick) return
        
        const nextRound = Math.ceil((state.currentPick + 1) / state.numTeams)
        const nextTeam = state.teams.findIndex(t => t.id === nextPick.teamId) + 1
        const isUserTurn = state.teams.find(t => t.id === nextPick.teamId)?.isUserTeam || false
        
        set({
          currentPick: state.currentPick + 1,
          currentRound: nextRound,
          currentTeam: nextTeam,
          isUserTurn
        })
      }
    }),
    {
      name: 'draft-store',
    }
  )
)

// Provider component for React
export const DraftProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <>{children}</>
}
