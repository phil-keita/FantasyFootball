import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useDraftStore, Player } from '../../store/draftStore'
import { usePlayerData } from '../../hooks/useApi'
import { DraftService } from '../../services/draftService'

export const SimpleDraftBoard: React.FC = () => {
  const navigate = useNavigate()
  const { draftId } = useParams<{ draftId: string }>()
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
    setDraftConfig,
    getRecommendations
  } = store
  
  // Force cast to handle TypeScript compilation issues
  const recommendationReasoning = (store as any).recommendationReasoning || ''

  const { isLoading: playersLoading, error: playersError, isBackendConnected } = usePlayerData()

  // Draft pick tracking logic
  const userPickingOrder = draftConfig?.playerPickNumber || 1
  const totalTeams = draftConfig?.numberOfTeams || 12
  const currentPickIndex = currentPick - 1 // Convert to 0-based index
  
  // Calculate whose turn it is based on snake draft logic
  const getCurrentPickingTeam = () => {
    const round = Math.floor(currentPickIndex / totalTeams) + 1
    const pickInRound = (currentPickIndex % totalTeams) + 1
    
    // Snake draft logic: odd rounds go 1->totalTeams, even rounds go totalTeams->1
    if (round % 2 === 1) {
      return pickInRound
    } else {
      return totalTeams - pickInRound + 1
    }
  }
  
  const currentPickingTeam = getCurrentPickingTeam()
  const isCurrentUserTurn = currentPickingTeam === userPickingOrder
  const currentPickingTeamName = isCurrentUserTurn ? 'Your Team' : `Team ${currentPickingTeam}`

  // State for player search in "Record Pick" section
  const [otherTeamSearchQuery, setOtherTeamSearchQuery] = useState('')
  const [otherTeamSelectedPlayer, setOtherTeamSelectedPlayer] = useState<Player | null>(null)
  const [showOtherTeamDropdown, setShowOtherTeamDropdown] = useState(false)

  // Filter available players for the "Record Pick" search
  const filteredPlayersForOtherTeam = availablePlayers.filter(player => 
    player.name.toLowerCase().includes(otherTeamSearchQuery.toLowerCase()) ||
    player.team.toLowerCase().includes(otherTeamSearchQuery.toLowerCase())
  ).slice(0, 10) // Limit to 10 results for performance

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (!target.closest('.player-search-container')) {
        setShowOtherTeamDropdown(false)
      }
    }

    if (showOtherTeamDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showOtherTeamDropdown])

  useEffect(() => {
    const loadDraft = async () => {
      if (draftId) {
        try {
          // Load the specific draft from the database
          const draft = await DraftService.getDraft(draftId)
          
          // Set the draft configuration in the store
          setDraftConfig(draft.config)
          
          // Initialize the draft with the loaded data
          initializeDraft(draft.config)
          
          // If draft status is still 'draft', update it to 'in-progress' when the board is loaded
          if (draft.status === 'draft') {
            await DraftService.updateDraft(draftId, { status: 'in-progress' })
          }
          
          console.log('Draft loaded:', draft)
        } catch (error) {
          console.error('Failed to load draft:', error)
          // Navigate back to drafts page if draft not found
          navigate('/drafts')
        }
      } else {
        // Only initialize if there's no existing draft and no configuration (backward compatibility)
        if (teams.length === 0 && !draftConfig) {
          // Create a default configuration for backward compatibility
          const defaultConfig = {
            numberOfTeams: 12,
            playerPickNumber: 6,
            leagueSettings: {
              qb: 1, rb: 2, wr: 2, te: 1, flex: 1, def: 1, k: 1, bench: 6
            },
            customRules: '',
            leagueName: 'Mock Draft'
          }
          
          setDraftConfig(defaultConfig)
          initializeDraft(defaultConfig)
        }
      }
    }

    loadDraft()
  }, [draftId, teams.length, draftConfig, initializeDraft, setDraftConfig, navigate])

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
            onClick={() => navigate('/create')}
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
            onClick={() => navigate(draftId ? `/edit/${draftId}` : '/create')}
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

        {/* Draft Pick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Record Other Team's Pick */}
          <div className={`bg-white border-2 rounded-lg p-6 transition-all ${
            isCurrentUserTurn ? 'border-gray-200 opacity-50' : 'border-blue-200 shadow-lg'
          }`}>
            <div className="flex items-center mb-4">
              <span className="text-2xl mr-3">📝</span>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Record Pick</h3>
                <p className="text-sm text-gray-600">
                  {isCurrentUserTurn ? 'Disabled - It\'s your turn to pick' : `Enter ${currentPickingTeamName}'s selection`}
                </p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="relative player-search-container">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search Player
                </label>
                <input
                  type="text"
                  value={otherTeamSelectedPlayer ? otherTeamSelectedPlayer.name : otherTeamSearchQuery}
                  onChange={(e) => {
                    if (!otherTeamSelectedPlayer) {
                      setOtherTeamSearchQuery(e.target.value)
                      setShowOtherTeamDropdown(e.target.value.length > 0)
                    }
                  }}
                  onFocus={() => {
                    if (!otherTeamSelectedPlayer && otherTeamSearchQuery.length > 0) {
                      setShowOtherTeamDropdown(true)
                    }
                  }}
                  placeholder="Search by player name or team..."
                  disabled={isCurrentUserTurn}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    isCurrentUserTurn ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white'
                  }`}
                />
                
                {/* Selected Player Display */}
                {otherTeamSelectedPlayer && (
                  <div className="absolute right-2 top-9 flex items-center">
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded mr-2">
                      {otherTeamSelectedPlayer.position} - {otherTeamSelectedPlayer.team}
                    </span>
                    <button
                      onClick={() => {
                        setOtherTeamSelectedPlayer(null)
                        setOtherTeamSearchQuery('')
                        setShowOtherTeamDropdown(false)
                      }}
                      disabled={isCurrentUserTurn}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      ✕
                    </button>
                  </div>
                )}

                {/* Search Results Dropdown */}
                {showOtherTeamDropdown && !otherTeamSelectedPlayer && !isCurrentUserTurn && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {filteredPlayersForOtherTeam.length > 0 ? (
                      filteredPlayersForOtherTeam.map((player) => (
                        <button
                          key={player.id}
                          onClick={() => {
                            setOtherTeamSelectedPlayer(player)
                            setOtherTeamSearchQuery('')
                            setShowOtherTeamDropdown(false)
                          }}
                          className="w-full text-left px-3 py-2 hover:bg-blue-50 border-b border-gray-100 last:border-b-0"
                        >
                          <div className="flex justify-between items-center">
                            <div>
                              <span className="font-medium">{player.name}</span>
                              <span className="text-sm text-gray-500 ml-2">
                                {player.position} - {player.team}
                              </span>
                            </div>
                            {player.adp && (
                              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                                ADP: {Math.round(player.adp)}
                              </span>
                            )}
                          </div>
                        </button>
                      ))
                    ) : (
                      <div className="px-3 py-2 text-gray-500 text-sm">
                        {otherTeamSearchQuery.length > 0 ? 'No players found' : 'Start typing to search...'}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <button
                disabled={isCurrentUserTurn || !otherTeamSelectedPlayer}
                className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
                  isCurrentUserTurn || !otherTeamSelectedPlayer
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
                onClick={() => {
                  if (otherTeamSelectedPlayer) {
                    // TODO: Add logic to record the pick
                    console.log('Recording pick:', otherTeamSelectedPlayer.name, 'for', currentPickingTeamName)
                    setOtherTeamSelectedPlayer(null)
                    setOtherTeamSearchQuery('')
                  }
                }}
              >
                Record {currentPickingTeamName}'s Pick
                {otherTeamSelectedPlayer && (
                  <span className="ml-2 text-blue-200">
                    ({otherTeamSelectedPlayer.name})
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Make Your Pick */}
          <div className={`bg-white border-2 rounded-lg p-6 transition-all ${
            !isCurrentUserTurn ? 'border-gray-200 opacity-50' : 'border-green-200 shadow-lg bg-green-50'
          }`}>
            <div className="flex items-center mb-4">
              <span className="text-2xl mr-3">🏈</span>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Make Your Pick</h3>
                <p className="text-sm text-gray-600">
                  {!isCurrentUserTurn ? 'Wait for your turn' : 'Select your player'}
                </p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search Available Players
                </label>
                <input
                  type="text"
                  placeholder="Search players..."
                  disabled={!isCurrentUserTurn}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                    !isCurrentUserTurn ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white'
                  }`}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Filter by Position
                  </label>
                  <select 
                    disabled={!isCurrentUserTurn}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                      !isCurrentUserTurn ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white'
                    }`}
                  >
                    <option value="">All Positions</option>
                    <option value="QB">QB</option>
                    <option value="RB">RB</option>
                    <option value="WR">WR</option>
                    <option value="TE">TE</option>
                    <option value="DEF">DEF</option>
                    <option value="K">K</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sort by
                  </label>
                  <select 
                    disabled={!isCurrentUserTurn}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                      !isCurrentUserTurn ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white'
                    }`}
                  >
                    <option value="adp">ADP</option>
                    <option value="projectedPoints">Projected Points</option>
                    <option value="name">Name</option>
                  </select>
                </div>
              </div>
              <button
                disabled={!isCurrentUserTurn}
                className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
                  !isCurrentUserTurn 
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-green-600 text-white hover:bg-green-700'
                }`}
              >
                Confirm My Pick
              </button>
            </div>
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
