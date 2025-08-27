import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { DraftConfig } from '../../store/draftStore'
import { DraftService } from '../../services/draftService'

interface DraftSetupProps {
  onStartDraft: (config: DraftConfig) => void
}

const COMMON_LAYOUTS = {
  standard: {
    name: "Standard (1 QB, 2 RB, 2 WR, 1 TE, 1 FLEX, 1 DEF, 1 K)",
    positions: { qb: 1, rb: 2, wr: 2, te: 1, flex: 1, def: 1, k: 1, bench: 6 }
  },
  ppr: {
    name: "PPR (1 QB, 2 RB, 3 WR, 1 TE, 1 FLEX, 1 DEF, 1 K)",
    positions: { qb: 1, rb: 2, wr: 3, te: 1, flex: 1, def: 1, k: 1, bench: 6 }
  },
  superflex: {
    name: "Superflex (2 QB, 2 RB, 3 WR, 1 TE, 1 FLEX, 1 DEF, 1 K)",
    positions: { qb: 2, rb: 2, wr: 3, te: 1, flex: 1, def: 1, k: 1, bench: 5 }
  },
  dynasty: {
    name: "Dynasty (1 QB, 2 RB, 3 WR, 1 TE, 2 FLEX, 1 DEF, 1 K)",
    positions: { qb: 1, rb: 2, wr: 3, te: 1, flex: 2, def: 1, k: 1, bench: 8 }
  },
  custom: {
    name: "Custom Layout",
    positions: { qb: 1, rb: 2, wr: 2, te: 1, flex: 1, def: 1, k: 1, bench: 6 }
  }
}

export const DraftSetup: React.FC<DraftSetupProps> = ({ onStartDraft }) => {
  const { draftId } = useParams()
  const navigate = useNavigate()
  const isEditMode = Boolean(draftId)
  
  const [config, setConfig] = useState<DraftConfig>({
    numberOfTeams: 12,
    playerPickNumber: 1,
    leagueSettings: COMMON_LAYOUTS.standard.positions,
    customRules: '',
    leagueName: 'My Fantasy League'
  })
  const [selectedLayout, setSelectedLayout] = useState('standard')
  const [showCustomPositions, setShowCustomPositions] = useState(false)
  const [isCreatingDraft, setIsCreatingDraft] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Load draft data if in edit mode
  useEffect(() => {
    if (isEditMode && draftId) {
      loadDraftForEdit(draftId)
    }
  }, [isEditMode, draftId])

  const loadDraftForEdit = async (draftId: string) => {
    setIsLoading(true)
    try {
      const draft = await DraftService.getDraft(draftId)
      setConfig(draft.config)      // Determine which layout matches the current config
      const matchingLayout = Object.entries(COMMON_LAYOUTS).find(([, layout]) => {
        const configPositions = draft.config.leagueSettings
        const layoutPositions = layout.positions
        return Object.keys(configPositions).every(pos => 
          configPositions[pos as keyof typeof configPositions] === layoutPositions[pos as keyof typeof layoutPositions]
        )
      })
      
      if (matchingLayout) {
        setSelectedLayout(matchingLayout[0])
        setShowCustomPositions(false)
      } else {
        setSelectedLayout('custom')
        setShowCustomPositions(true)
      }
    } catch (error) {
      console.error('Failed to load draft for editing:', error)
      navigate('/drafts') // Redirect back if draft not found
    } finally {
      setIsLoading(false)
    }
  }

  const handleLayoutChange = (layout: string) => {
    setSelectedLayout(layout)
    if (layout !== 'custom') {
      setConfig(prev => ({
        ...prev,
        leagueSettings: COMMON_LAYOUTS[layout as keyof typeof COMMON_LAYOUTS].positions
      }))
      setShowCustomPositions(false)
    } else {
      setShowCustomPositions(true)
    }
  }

  const handlePositionChange = (position: string, value: number) => {
    setConfig(prev => ({
      ...prev,
      leagueSettings: {
        ...prev.leagueSettings,
        [position]: value
      }
    }))
  }

  const handleStartDraft = async () => {
    // Validate configuration
    if (config.numberOfTeams < 4 || config.numberOfTeams > 20) {
      alert('Number of teams must be between 4 and 20')
      return
    }
    if (config.playerPickNumber < 1 || config.playerPickNumber > config.numberOfTeams) {
      alert(`Your pick number must be between 1 and ${config.numberOfTeams}`)
      return
    }
    
    setIsCreatingDraft(true)
    try {
      if (isEditMode && draftId) {
        // Update existing draft
        await DraftService.updateDraft(draftId, {
          draftName: config.leagueName,
          config: config
        })
        // Navigate to the updated draft
        navigate(`/draft/${draftId}`)
      } else {
        // Create new draft
        await onStartDraft(config)
      }
    } catch (error) {
      console.error(`Failed to ${isEditMode ? 'update' : 'create'} draft:`, error)
      alert(`Failed to ${isEditMode ? 'update' : 'create'} draft. Please try again.`)
    } finally {
      setIsCreatingDraft(false)
    }
  }

  const totalRosterSpots = Object.values(config.leagueSettings).reduce((sum, count) => sum + count, 0)
  const totalRounds = totalRosterSpots

  // Show loading state for edit mode
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-lg font-medium text-gray-700">Loading draft...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              🏈 {isEditMode ? 'Edit Draft Settings' : 'Fantasy Football Draft Setup'}
            </h1>
            <p className="text-gray-600">
              {isEditMode 
                ? 'Update your draft configuration and settings' 
                : 'Configure your draft settings to get personalized AI recommendations'
              }
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Basic Settings */}
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  League Name
                </label>
                <input
                  type="text"
                  value={config.leagueName}
                  onChange={(e) => setConfig(prev => ({ ...prev, leagueName: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your league name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Number of Teams
                </label>
                <select
                  value={config.numberOfTeams}
                  onChange={(e) => setConfig(prev => ({ ...prev, numberOfTeams: parseInt(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {Array.from({ length: 17 }, (_, i) => i + 4).map(num => (
                    <option key={num} value={num}>{num} Teams</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Draft Pick Number
                </label>
                <select
                  value={config.playerPickNumber}
                  onChange={(e) => setConfig(prev => ({ ...prev, playerPickNumber: parseInt(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {Array.from({ length: config.numberOfTeams }, (_, i) => i + 1).map(num => (
                    <option key={num} value={num}>
                      Pick #{num} {num === 1 ? '(First)' : num === config.numberOfTeams ? '(Last)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* League Layout */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  League Format
                </label>
                <div className="space-y-2">
                  {Object.entries(COMMON_LAYOUTS).map(([key, layout]) => (
                    <label key={key} className="flex items-center">
                      <input
                        type="radio"
                        name="layout"
                        value={key}
                        checked={selectedLayout === key}
                        onChange={(e) => handleLayoutChange(e.target.value)}
                        className="mr-3"
                      />
                      <span className="text-sm">{layout.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Position Settings & Rules */}
            <div className="space-y-6">
              {/* Custom Position Settings */}
              {showCustomPositions && (
                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-4">Roster Positions</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {Object.entries(config.leagueSettings).map(([position, count]) => (
                      <div key={position}>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {position.toUpperCase()}
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="10"
                          value={count}
                          onChange={(e) => handlePositionChange(position, parseInt(e.target.value) || 0)}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Roster Summary */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-medium text-blue-900 mb-2">Roster Summary</h3>
                <div className="text-sm text-blue-800">
                  <div className="flex justify-between">
                    <span>Starting Lineup:</span>
                    <span>{totalRosterSpots - config.leagueSettings.bench} positions</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Bench Spots:</span>
                    <span>{config.leagueSettings.bench}</span>
                  </div>
                  <div className="flex justify-between font-medium">
                    <span>Total Rounds:</span>
                    <span>{totalRounds}</span>
                  </div>
                </div>
              </div>

              {/* Custom Rules */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  League Rules & Scoring
                </label>
                <textarea
                  value={config.customRules}
                  onChange={(e) => setConfig(prev => ({ ...prev, customRules: e.target.value }))}
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter any special rules, scoring settings, or strategies you want the AI to consider..."
                />
                <p className="text-xs text-gray-500 mt-1">
                  Example: "PPR league, 6 pts for passing TDs, prioritize RB depth, avoid kickers until last round"
                </p>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                <p>Draft will have {totalRounds} rounds with {config.numberOfTeams} teams</p>
                <p>You'll pick at position #{config.playerPickNumber} in each round</p>
                {isEditMode && <p className="text-blue-600 mt-1">💡 Changes will be saved to your existing draft</p>}
              </div>
              <div className="flex space-x-3">
                {isEditMode && (
                  <button
                    onClick={() => navigate('/drafts')}
                    disabled={isCreatingDraft}
                    className="px-6 py-3 rounded-lg font-medium text-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>
                )}
                <button
                  onClick={handleStartDraft}
                  disabled={isCreatingDraft}
                  className={`px-8 py-3 rounded-lg font-medium text-lg transition-colors ${
                    isCreatingDraft 
                      ? 'bg-gray-400 cursor-not-allowed' 
                      : isEditMode
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-green-600 text-white hover:bg-green-700'
                  }`}
                >
                  {isCreatingDraft ? (
                    <>
                      <span className="inline-block animate-spin mr-2">⏳</span>
                      {isEditMode ? 'Updating Draft...' : 'Creating Draft...'}
                    </>
                  ) : (
                    isEditMode ? 'Save Changes 📝' : 'Start Draft 🚀'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
