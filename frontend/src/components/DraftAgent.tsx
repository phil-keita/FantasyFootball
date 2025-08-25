/**
 * DraftAgent Component
 * AI-powered draft recommendation interface
 */

import React, { useState } from 'react';
import { useDraftAgent, useDraftState } from '../hooks/useDraftAgent';

interface DraftAgentProps {
  className?: string;
}

export const DraftAgent: React.FC<DraftAgentProps> = ({ className = '' }) => {
  const { 
    recommendation, 
    agentStatus, 
    isLoading, 
    error,
    getDraftRecommendation,
    checkAgentStatus,
    clearError 
  } = useDraftAgent();

  const { 
    draftState, 
    addDraftedPlayer, 
    resetDraftState, 
    createSampleDraft,
    updateDraftState 
  } = useDraftState();

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [newPlayer, setNewPlayer] = useState({
    playerName: '',
    team: '',
    position: 'RB',
    draftedByTeam: ''
  });

  const handleGetRecommendation = async () => {
    await getDraftRecommendation(draftState);
  };

  const handleAddPlayer = () => {
    if (newPlayer.playerName && newPlayer.team && newPlayer.draftedByTeam) {
      addDraftedPlayer(newPlayer);
      setNewPlayer({
        playerName: '',
        team: '',
        position: 'RB',
        draftedByTeam: ''
      });
    }
  };

  const formatRecommendation = (text: string) => {
    return text.split('\n').map((line, index) => (
      <p key={index} className={line.startsWith('**') || line.startsWith('#') ? 'font-semibold mt-3' : 'mt-1'}>
        {line.replace(/\*\*(.*?)\*\*/g, '$1')}
      </p>
    ));
  };

  return (
    <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
            <span className="text-white text-sm font-bold">🤖</span>
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">AI Draft Assistant</h2>
            <p className="text-sm text-gray-500">
              {agentStatus?.available ? '✅ Ready' : '❌ Not Available'}
            </p>
          </div>
        </div>
        
        <div className="flex space-x-2">
          <button
            onClick={checkAgentStatus}
            className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
          >
            Refresh Status
          </button>
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="px-3 py-1 text-xs bg-blue-100 hover:bg-blue-200 rounded-md transition-colors"
          >
            {showAdvanced ? 'Hide' : 'Show'} Controls
          </button>
        </div>
      </div>

      {/* Agent Status */}
      {!agentStatus?.available && (
        <div className="mb-4 p-3 bg-yellow-50 border-l-4 border-yellow-400 rounded">
          <div className="flex items-center">
            <div className="ml-3">
              <p className="text-sm text-yellow-800">
                <strong>AI Agent Not Available</strong>
              </p>
              <p className="text-xs text-yellow-700 mt-1">
                Requirements: {agentStatus?.requirements?.join(', ') || 'OpenAI API key'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-400 rounded">
          <div className="flex items-center justify-between">
            <p className="text-sm text-red-800">{error}</p>
            <button
              onClick={clearError}
              className="text-red-600 hover:text-red-800 text-xs underline"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Advanced Controls */}
      {showAdvanced && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Draft Configuration</h3>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Current Pick</label>
              <input
                type="number"
                value={draftState.currentPick}
                onChange={(e) => updateDraftState({ currentPick: parseInt(e.target.value) || 1 })}
                className="w-full px-2 py-1 text-sm border rounded"
                min="1"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Your Team Name</label>
              <input
                type="text"
                value={draftState.userTeam}
                onChange={(e) => updateDraftState({ userTeam: e.target.value })}
                className="w-full px-2 py-1 text-sm border rounded"
                placeholder="My Team"
              />
            </div>
          </div>

          <div className="mb-4">
            <h4 className="text-xs font-medium text-gray-600 mb-2">Add Drafted Player</h4>
            <div className="grid grid-cols-4 gap-2">
              <input
                type="text"
                placeholder="Player Name"
                value={newPlayer.playerName}
                onChange={(e) => setNewPlayer({ ...newPlayer, playerName: e.target.value })}
                className="px-2 py-1 text-xs border rounded"
              />
              <select
                value={newPlayer.position}
                onChange={(e) => setNewPlayer({ ...newPlayer, position: e.target.value })}
                className="px-2 py-1 text-xs border rounded"
              >
                <option value="QB">QB</option>
                <option value="RB">RB</option>
                <option value="WR">WR</option>
                <option value="TE">TE</option>
                <option value="K">K</option>
                <option value="DEF">DEF</option>
              </select>
              <input
                type="text"
                placeholder="Team"
                value={newPlayer.team}
                onChange={(e) => setNewPlayer({ ...newPlayer, team: e.target.value.toUpperCase() })}
                className="px-2 py-1 text-xs border rounded"
                maxLength={3}
              />
              <input
                type="text"
                placeholder="Drafted By"
                value={newPlayer.draftedByTeam}
                onChange={(e) => setNewPlayer({ ...newPlayer, draftedByTeam: e.target.value })}
                className="px-2 py-1 text-xs border rounded"
              />
            </div>
            <button
              onClick={handleAddPlayer}
              disabled={!newPlayer.playerName || !newPlayer.team || !newPlayer.draftedByTeam}
              className="mt-2 px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
            >
              Add Player
            </button>
          </div>

          <div className="flex space-x-2">
            <button
              onClick={createSampleDraft}
              className="px-3 py-1 text-xs bg-purple-600 text-white rounded hover:bg-purple-700"
            >
              Load Sample Draft
            </button>
            <button
              onClick={resetDraftState}
              className="px-3 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              Reset Draft
            </button>
          </div>
        </div>
      )}

      {/* Draft Status */}
      <div className="mb-4 p-3 bg-blue-50 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-blue-900">
              Pick #{draftState.currentPick} • {draftState.userTeam}
            </p>
            <p className="text-xs text-blue-700">
              {draftState.draftedPlayers.length} players drafted
            </p>
          </div>
          <button
            onClick={handleGetRecommendation}
            disabled={isLoading || !agentStatus?.available}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {isLoading ? (
              <>
                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                <span>Analyzing...</span>
              </>
            ) : (
              <>
                <span>🎯</span>
                <span>Get Recommendation</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Recently Drafted Players */}
      {draftState.draftedPlayers.length > 0 && (
        <div className="mb-4">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Recent Picks</h3>
          <div className="space-y-1">
            {draftState.draftedPlayers.slice(-5).map((player, index) => (
              <div key={index} className="flex items-center justify-between text-xs p-2 bg-gray-50 rounded">
                <span className="font-medium">#{player.pickNumber} {player.playerName}</span>
                <span className="text-gray-500">{player.position} • {player.team} → {player.draftedByTeam}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendation Display */}
      {recommendation && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-green-800">
              🎯 AI Recommendation for Pick #{recommendation.currentPick}
            </h3>
            <div className="flex items-center space-x-2 text-xs text-green-600">
              <span>Tools: {recommendation.toolsUsed.join(', ')}</span>
            </div>
          </div>
          
          <div className="text-sm text-green-800 leading-relaxed">
            {formatRecommendation(recommendation.recommendation)}
          </div>
          
          <div className="mt-3 pt-3 border-t border-green-200">
            <p className="text-xs text-green-600">
              Generated at {new Date(recommendation.timestamp).toLocaleTimeString()}
            </p>
          </div>
        </div>
      )}

      {/* Agent Capabilities */}
      {agentStatus?.available && (
        <div className="mt-4 text-xs text-gray-500">
          <details className="cursor-pointer">
            <summary className="font-medium">AI Capabilities ({agentStatus.capabilities.length})</summary>
            <ul className="mt-1 ml-4 space-y-1">
              {agentStatus.capabilities.map((capability, index) => (
                <li key={index}>• {capability}</li>
              ))}
            </ul>
          </details>
        </div>
      )}
    </div>
  );
};
