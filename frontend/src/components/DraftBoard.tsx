import { useEffect } from 'react'
import { useDraftStore } from '../store/draftStore'
import { DraftPickCard } from './DraftPickCard'
import { TeamRoster } from './TeamRoster'
import { RecommendationPanel } from './RecommendationPanel'
import { DraftControls } from './DraftControls'
import { DraftAgent } from './DraftAgent'
import { usePlayerData } from '../hooks/useApi'

export const DraftBoard = () => {
  const {
    teams,
    draftBoard,
    currentPick,
    currentRound,
    isUserTurn,
    initializeDraft,
  } = useDraftStore()

  const { isLoading, error: playersError, isBackendConnected } = usePlayerData()

  useEffect(() => {
    // Initialize draft if not already done
    if (teams.length === 0) {
      const teamNames = [
        'Your Team',
        'Team Alpha',
        'Team Beta',
        'Team Gamma',
        'Team Delta',
        'Team Echo',
        'Team Foxtrot',
        'Team Golf',
        'Team Hotel',
        'Team India',
        'Team Juliet',
        'Team Kilo'
      ]
      initializeDraft(12, teamNames, 0) // User is team 0
    }
  }, [teams.length, initializeDraft])

  const picksToShow = draftBoard.slice(currentPick - 1, currentPick + 11) // Show current + next 12 picks

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <div className="mt-4 text-lg font-medium text-gray-700">
            Loading players from backend...
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Error Banner */}
      {playersError && (
        <div className="lg:col-span-4 mb-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <span className="text-yellow-600">⚠️</span>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  Backend Connection Issue
                </h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>
                    {playersError}. Using mock data for demonstration.
                    Make sure your backend is running on port 3001.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Draft Board */}
      <div className="lg:col-span-2">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Draft Board</h2>
            <div className="text-sm text-gray-600">
              Round {currentRound} • Pick {((currentPick - 1) % 12) + 1}
            </div>
          </div>
          
          <DraftControls />
          
          <div className="mt-6 space-y-2">
            {picksToShow.map((pick) => (
              <DraftPickCard 
                key={`${pick.round}-${pick.pick}`}
                pick={pick}
                team={teams.find(t => t.id === pick.teamId)}
                isCurrent={pick.overall === currentPick}
                isUserTeam={teams.find(t => t.id === pick.teamId)?.isUserTeam || false}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Recommendations Panel */}
      <div className="lg:col-span-1 space-y-4">
        {/* AI Draft Agent */}
        <DraftAgent />
        
        {/* Traditional Recommendations Panel */}
        {isUserTurn && <RecommendationPanel />}
      </div>

      {/* Team Rosters */}
      <div className="lg:col-span-1">
        <div className="space-y-4">
          {teams.map((team) => (
            <TeamRoster 
              key={team.id}
              team={team}
              isExpanded={team.isUserTeam}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
