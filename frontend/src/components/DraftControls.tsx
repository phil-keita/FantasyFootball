import { useState } from 'react'
import { useDraftStore } from '../store/draftStore'

export const DraftControls = () => {
  const { 
    isUserTurn, 
    currentRound, 
    currentPick, 
    numRounds,
    draftPlayer,
    availablePlayers 
  } = useDraftStore()

  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null)
  const selectedPlayer = availablePlayers.find(p => p.id === selectedPlayerId)

  const handleDraftPlayer = () => {
    if (selectedPlayerId && isUserTurn) {
      draftPlayer(selectedPlayerId)
      setSelectedPlayerId(null)
    }
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="font-bold text-lg mb-4 text-gray-900">
        Draft Controls
      </h3>

      {/* Draft Status */}
      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-600">Round:</span>
          <span className="text-sm text-gray-900">{currentRound} of {numRounds}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-600">Pick:</span>
          <span className="text-sm text-gray-900">{currentPick}</span>
        </div>
      </div>

      {/* Turn Indicator */}
      <div className="mb-4">
        {isUserTurn ? (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <span className="font-medium text-green-800">Your Turn!</span>
            </div>
            <div className="text-sm text-green-700 mt-1">
              Select a player and click "Draft Player" to make your pick
            </div>
          </div>
        ) : (
          <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
              <span className="font-medium text-gray-700">Waiting...</span>
            </div>
            <div className="text-sm text-gray-600 mt-1">
              Other teams are making their picks
            </div>
          </div>
        )}
      </div>

      {/* Player Selection */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Player to Draft:
        </label>
        <select
          value={selectedPlayerId || ''}
          onChange={(e) => setSelectedPlayerId(e.target.value || null)}
          disabled={!isUserTurn}
          className="w-full p-2 border border-gray-300 rounded-lg disabled:bg-gray-100 disabled:text-gray-500"
        >
          <option value="">Choose a player...</option>
          {availablePlayers
            .filter(p => !p.isDrafted)
            .slice(0, 20) // Show top 20 available players
            .map(player => (
              <option key={player.id} value={player.id}>
                {player.name} - {player.position} ({player.team})
              </option>
            ))
          }
        </select>
      </div>

      {/* Draft Actions */}
      <div className="space-y-3">
        {/* Draft Player Button */}
        <button
          onClick={handleDraftPlayer}
          disabled={!selectedPlayer || !isUserTurn}
          className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
            selectedPlayer && isUserTurn
              ? 'bg-blue-500 hover:bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-500 cursor-not-allowed'
          }`}
        >
          {selectedPlayer 
            ? `Draft ${selectedPlayer.name}` 
            : 'Select a player to draft'
          }
        </button>
      </div>

      {/* Selected Player Info */}
      {selectedPlayer && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <h4 className="font-medium text-gray-700 mb-2">Selected Player:</h4>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="font-semibold text-blue-900">
              {selectedPlayer.name}
            </div>
            <div className="text-sm text-blue-700">
              {selectedPlayer.position} - {selectedPlayer.team}
            </div>
            {selectedPlayer.projectedPoints && (
              <div className="text-sm text-blue-600 mt-1">
                Projected: {selectedPlayer.projectedPoints} pts
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
