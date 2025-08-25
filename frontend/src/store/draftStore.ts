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

export interface DraftConfig {
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

interface DraftStore {
  // Draft Settings
  draftConfig: DraftConfig | null
  numTeams: number
  numRounds: number
  currentPick: number
  currentRound: number
  currentTeam: number
  isUserTurn: boolean
  isDraftStarted: boolean
  
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
  recommendations: string | null
  recommendationReasoning: string | null
  isLoadingRecommendations: boolean
  
  // Actions
  setDraftConfig: (config: DraftConfig) => void
  initializeDraft: (config: DraftConfig) => void
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
      draftConfig: null,
      numTeams: 12,
      numRounds: 16,
      currentPick: 1,
      currentRound: 1,
      currentTeam: 1,
      isUserTurn: false,
      isDraftStarted: false,
      
      teams: [],
      allPlayers: [],
      availablePlayers: [],
      draftBoard: [],
      
      selectedPosition: null,
      searchQuery: '',
      sortBy: 'adp',
      
      recommendations: null,
      recommendationReasoning: null,
      isLoadingRecommendations: false,
      
      // Actions
      setDraftConfig: (config) => {
        set({ draftConfig: config })
      },
      
      initializeDraft: (config) => {
        const { numberOfTeams, playerPickNumber, leagueSettings } = config
        const safeLeagueSettings = leagueSettings || {
          qb: 1, rb: 2, wr: 2, te: 1, flex: 1, def: 1, k: 1, bench: 6
        }
        const totalRosterSpots = Object.values(safeLeagueSettings).reduce((sum, count) => sum + count, 0)
        
        const teamNames = Array.from({ length: numberOfTeams }, (_, i) => 
          i === playerPickNumber - 1 ? 'Your Team' : `Team ${i + 1}`
        )
        
        const teams: Team[] = teamNames.map((name, index) => ({
          id: `team-${index + 1}`,
          name,
          owner: name,
          roster: [],
          isUserTeam: index === playerPickNumber - 1
        }))
        
        const draftBoard: DraftPick[] = []
        for (let round = 1; round <= totalRosterSpots; round++) {
          for (let pick = 1; pick <= numberOfTeams; pick++) {
            const teamIndex = round % 2 === 1 ? pick - 1 : numberOfTeams - pick
            draftBoard.push({
              round,
              pick,
              overall: (round - 1) * numberOfTeams + pick,
              teamId: teams[teamIndex].id
            })
          }
        }
        
        // Calculate initial draft state (starting at pick 1)
        const currentOverallPick = 1
        const currentRound = Math.ceil(currentOverallPick / numberOfTeams)
        const currentPickInRound = ((currentOverallPick - 1) % numberOfTeams) + 1
        const currentTeamIndex = currentRound % 2 === 1 
          ? currentPickInRound - 1 
          : numberOfTeams - currentPickInRound
        const isUserTurn = teams[currentTeamIndex].isUserTeam
        
        set({
          draftConfig: {
            ...config,
            leagueSettings: safeLeagueSettings
          },
          numTeams: numberOfTeams,
          numRounds: totalRosterSpots,
          teams,
          draftBoard,
          currentPick: currentOverallPick,
          currentRound,
          currentTeam: currentTeamIndex + 1,
          isUserTurn,
          isDraftStarted: true
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
        if (!state.draftConfig) return
        
        set({ isLoadingRecommendations: true })
        
        try {
          // Import the API service
          const { apiService } = await import('../services/api')
          
          // Prepare draft state for the API
          const draftedPlayers = state.allPlayers
            .filter(p => p.isDrafted)
            .map(p => ({
              playerName: p.name,
              team: p.team,
              position: p.position,
              pickNumber: p.draftPosition || 0,
              draftedByTeam: p.draftedBy || ''
            }))
          
          const userTeam = state.teams.find(t => t.isUserTeam)
          
          const response = await apiService.getDraftRecommendations({
            draftedPlayers,
            currentPick: state.currentPick,
            userTeam: userTeam?.name || 'Your Team',
            leagueSettings: {
              teams: state.numTeams,
              format: 'PPR', // Could be derived from config
              rounds: state.numRounds
            }
          })
          
          set({ 
            recommendations: typeof response.recommendations === 'string' ? response.recommendations : JSON.stringify(response.recommendations),
            recommendationReasoning: response.reasoning || null,
            isLoadingRecommendations: false 
          })
          
        } catch (error) {
          console.error('Failed to get recommendations:', error)
          set({ 
            recommendations: 'Unable to get AI recommendations at this time.',
            recommendationReasoning: 'Please check backend connection.',
            isLoadingRecommendations: false 
          })
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
