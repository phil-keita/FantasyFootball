import { useEffect } from 'react'
import { useDraftStore } from '../store/draftStore'
import { DraftPickCard } from './DraftPickCard'
import { TeamRoster } from './TeamRoster'
import { RecommendationPanel } from './RecommendationPanel'
import { DraftControls } from './DraftControls'

export const DraftBoard = () => {
  const {
    teams,
    draftBoard,
    currentPick,
    currentRound,
    isUserTurn,
    initializeDraft,
    setPlayers
  } = useDraftStore()

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

  useEffect(() => {
    // Load players from API
    const loadPlayers = async () => {
      try {
        const response = await fetch('/api/players')
        if (response.ok) {
          const players = await response.json()
          setPlayers(players)
        }
      } catch (error) {
        console.error('Failed to load players:', error)
      }
    }
    
    loadPlayers()
  }, [setPlayers])

  const picksToShow = draftBoard.slice(currentPick - 1, currentPick + 11) // Show current + next 12 picks

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
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
      <div className="lg:col-span-1">
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
