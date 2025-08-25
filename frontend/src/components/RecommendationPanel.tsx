import { useState, useEffect } from 'react'
import { useDraftStore, Player } from '../store/draftStore'

export const RecommendationPanel = () => {
  const { availablePlayers, currentPick, currentRound, isUserTurn, teams } = useDraftStore()
  const [recommendations, setRecommendations] = useState<Player[]>([])
  const [loading, setLoading] = useState(false)

  const userTeam = teams.find(t => t.isUserTeam)

  // Get LLM recommendations when it's the user's turn
  const fetchRecommendations = async () => {
    if (!isUserTurn || !userTeam) return

    setLoading(true)
    try {
      // TODO: Replace with actual API call to your backend
      // const response = await fetch('/api/recommendations', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     currentRoster: userTeam.roster,
      //     availablePlayers: availablePlayers.slice(0, 50), // Send top 50
      //     round: currentPick.round,
      //     pick: currentPick.pickNumber
      //   })
      // })
      // const data = await response.json()
      // setRecommendations(data.recommendations)

      // For now, use simple logic based on highest projected points
      const topRecommendations = availablePlayers
        .filter(p => !p.isDrafted)
        .sort((a, b) => (b.projectedPoints || 0) - (a.projectedPoints || 0))
        .slice(0, 5)
      
      setRecommendations(topRecommendations)
    } catch (error) {
      console.error('Failed to fetch recommendations:', error)
      setRecommendations([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isUserTurn) {
      fetchRecommendations()
    }
  }, [isUserTurn, currentRound, currentPick])

  if (!isUserTurn) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="font-bold text-lg mb-4 text-gray-900">
          AI Recommendations
        </h3>
        <div className="text-center text-gray-500">
          <div className="text-sm">Waiting for your turn...</div>
          <div className="text-xs mt-1">
            Current pick: Round {currentRound}, Pick {currentPick}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-lg text-gray-900">
          AI Recommendations
        </h3>
        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
          Your Turn!
        </span>
      </div>

      {loading ? (
        <div className="text-center py-6">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          <div className="text-sm text-gray-500 mt-2">
            Analyzing optimal picks...
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {recommendations.length > 0 ? (
            recommendations.map((player, idx) => (
              <div 
                key={player.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <div>
                      <div className="font-semibold text-gray-900">
                        {player.name}
                      </div>
                      <div className="text-sm text-gray-600">
                        {player.position} - {player.team}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  {player.projectedPoints && (
                    <div className="text-sm font-medium text-gray-900">
                      {player.projectedPoints} pts
                    </div>
                  )}
                  {player.adp && (
                    <div className="text-xs text-gray-500">
                      ADP: {player.adp}
                    </div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-6 text-gray-500">
              <div className="text-sm">No recommendations available</div>
              <div className="text-xs mt-1">
                Try refreshing the analysis
              </div>
            </div>
          )}
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-gray-100">
        <button
          onClick={fetchRecommendations}
          disabled={loading}
          className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white font-medium py-2 px-4 rounded-lg transition-colors"
        >
          {loading ? 'Analyzing...' : 'Refresh Recommendations'}
        </button>
      </div>
    </div>
  )
}
