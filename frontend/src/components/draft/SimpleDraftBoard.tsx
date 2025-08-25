import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDraftStore } from '../../store/draftStore'
import { usePlayerData } from '../../hooks/useApi'

export const SimpleDraftBoard: React.FC = () => {
  const navigate = useNavigate()
  const store = useDraftStore()
  const {
    draftConfig,
    teams,
    currentPick,
    currentRound,
    isUserTurn,
    availablePlayers,
    recommendations,
    isLoadingRecommendations,
    initializeDraft,
    getRecommendations
  } = store
  
  // Force cast to handle TypeScript compilation issues
  const recommendationReasoning = (store as any).recommendationReasoning || ''

  const { isLoading: playersLoading, error: playersError, isBackendConnected } = usePlayerData()

  useEffect(() => {
    // Only initialize if there's no existing draft and no configuration
    if (teams.length === 0 && !draftConfig) {
      // Create a default configuration for backward compatibility
      const defaultConfig = {
        numberOfTeams: 12,
        playerPickNumber: 1,
        leagueSettings: {
          qb: 1,
          rb: 2,
          wr: 2,
          te: 1,
          flex: 1,
          def: 1,
          k: 1,
          bench: 6
        },
        customRules: 'Standard PPR league',
        leagueName: 'Quick Draft'
      }
      initializeDraft(defaultConfig)
    }
  }, [teams.length, draftConfig, initializeDraft])

  if (playersLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-lg font-medium text-gray-700">Loading players...</p>
        </div>
      </div>
    )
  }

  if (playersError || !isBackendConnected) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center p-8 bg-red-50 rounded-lg max-w-md">
          <div className="text-red-500 text-4xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-red-800 mb-2">Backend Not Connected</h2>
          <p className="text-red-600 mb-4">
            {playersError || 'Unable to connect to the backend API server'}
          </p>
          <p className="text-sm text-red-500">
            Make sure the backend server is running on http://localhost:3001
          </p>
        </div>
      </div>
    )
  }

  // Show setup prompt if no configuration
  if (!draftConfig) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center p-8 bg-blue-50 rounded-lg max-w-md">
          <div className="text-blue-500 text-4xl mb-4">🏈</div>
          <h2 className="text-xl font-semibold text-blue-800 mb-2">Draft Setup Required</h2>
          <p className="text-blue-600 mb-4">
            Please configure your draft settings before starting.
          </p>
          <button
            onClick={() => navigate('/setup')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 font-medium"
          >
            Go to Draft Setup
          </button>
        </div>
      </div>
    )
  }

  const currentTeamName = teams.find((_, index) => index + 1 === store.currentTeam)?.name || 'Unknown'
  const pickInRound = ((currentPick - 1) % (draftConfig?.numberOfTeams || 12)) + 1

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg mb-6 p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {draftConfig?.leagueName || 'Fantasy Football Draft'}
        </h1>
        <div className="flex items-center justify-between mb-4">
          <p className="text-gray-600">
            {draftConfig?.numberOfTeams} teams • Your pick: #{draftConfig?.playerPickNumber}
          </p>
          <button
            onClick={() => navigate('/setup')}
            className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded-lg transition-colors flex items-center space-x-1"
          >
            <span>⚙️</span>
            <span>Edit Setup</span>
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold text-blue-900">Current Pick</h3>
            <p className="text-2xl font-bold text-blue-600">
              #{currentPick}
            </p>
            <p className="text-sm text-blue-700">
              Round {currentRound}, Pick {pickInRound}
            </p>
          </div>
          
          <div className={`p-4 rounded-lg ${isUserTurn ? 'bg-green-50' : 'bg-gray-50'}`}>
            <h3 className={`font-semibold ${isUserTurn ? 'text-green-900' : 'text-gray-900'}`}>
              Your Turn
            </h3>
            <p className={`text-2xl font-bold ${isUserTurn ? 'text-green-600' : 'text-gray-600'}`}>
              {isUserTurn ? 'YES' : 'NO'}
            </p>
            <p className={`text-sm ${isUserTurn ? 'text-green-700' : 'text-gray-700'}`}>
              {isUserTurn ? 'Make your pick!' : `${currentTeamName} is up`}
            </p>
          </div>
          
          <div className="bg-purple-50 p-4 rounded-lg">
            <h3 className="font-semibold text-purple-900">Available</h3>
            <p className="text-2xl font-bold text-purple-600">
              {availablePlayers.length}
            </p>
            <p className="text-sm text-purple-700">players left</p>
          </div>
          
          <div className="bg-orange-50 p-4 rounded-lg">
            <h3 className="font-semibold text-orange-900">Your Roster</h3>
            <p className="text-2xl font-bold text-orange-600">
              {teams.find(t => t.isUserTeam)?.roster.length || 0}
            </p>
            <p className="text-sm text-orange-700">
              / {Object.values(draftConfig?.leagueSettings || {}).reduce((a, b) => a + b, 0)} picks
            </p>
          </div>
        </div>

        {/* AI Recommendations */}
        {isUserTurn && (
          <div className="mb-6 bg-gradient-to-r from-indigo-50 to-purple-50 p-6 rounded-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-indigo-900">🤖 AI Draft Recommendations</h3>
              <button
                onClick={getRecommendations}
                disabled={isLoadingRecommendations}
                className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 disabled:bg-indigo-300"
              >
                {isLoadingRecommendations ? 'Getting Recommendations...' : 'Get AI Recommendations'}
              </button>
            </div>

            {recommendationReasoning && (
              <div className="mb-4 p-4 bg-white rounded border-l-4 border-indigo-500">
                <h4 className="font-semibold text-gray-900 mb-2">Strategic Analysis:</h4>
                <p className="text-gray-700">{recommendationReasoning}</p>
              </div>
            )}

            {recommendations && typeof recommendations === 'string' && (
              <div className="bg-white p-4 rounded border">
                <h3 className="font-semibold text-gray-900 mb-2">AI Recommendations</h3>
                <div className="prose text-sm text-gray-700 whitespace-pre-wrap">
                  {recommendations}
                </div>
                {recommendationReasoning && (
                  <div className="mt-3 pt-3 border-t">
                    <p className="text-xs text-gray-500">{recommendationReasoning}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
