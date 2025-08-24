import { useState, useMemo } from 'react'
import { useDraftStore } from '../store/draftStore'
import { PlayerCard } from './PlayerCard'
import { Search, Filter } from 'lucide-react'

export const PlayerList = () => {
  const {
    availablePlayers,
    selectedPosition,
    searchQuery,
    sortBy,
    setSelectedPosition,
    setSearchQuery,
    setSortBy
  } = useDraftStore()

  const [showOnlyAvailable, setShowOnlyAvailable] = useState(true)

  const positions = ['All', 'QB', 'RB', 'WR', 'TE', 'K', 'DEF']

  const filteredPlayers = useMemo(() => {
    let filtered = showOnlyAvailable 
      ? availablePlayers 
      : availablePlayers // Could include all players if needed

    // Filter by position
    if (selectedPosition && selectedPosition !== 'All') {
      filtered = filtered.filter(player => player.position === selectedPosition)
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(player => 
        player.name.toLowerCase().includes(query) ||
        player.team.toLowerCase().includes(query)
      )
    }

    // Sort players
    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'adp':
          return (a.adp || 999) - (b.adp || 999)
        case 'projectedPoints':
          return (b.projectedPoints || 0) - (a.projectedPoints || 0)
        case 'name':
          return a.name.localeCompare(b.name)
        default:
          return 0
      }
    })
  }, [availablePlayers, selectedPosition, searchQuery, sortBy, showOnlyAvailable])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Player Pool</h2>
        
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search players..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          {/* Position Filter */}
          <select
            value={selectedPosition || 'All'}
            onChange={(e) => setSelectedPosition(e.target.value === 'All' ? null : e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            {positions.map(pos => (
              <option key={pos} value={pos}>{pos}</option>
            ))}
          </select>

          {/* Sort By */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'adp' | 'projectedPoints' | 'name')}
            className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="adp">Sort by ADP</option>
            <option value="projectedPoints">Sort by Projected Points</option>
            <option value="name">Sort by Name</option>
          </select>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-6 text-sm text-gray-600">
          <span>{filteredPlayers.length} players shown</span>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={showOnlyAvailable}
              onChange={(e) => setShowOnlyAvailable(e.target.checked)}
              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <span>Show only available</span>
          </label>
        </div>
      </div>

      {/* Player Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredPlayers.map(player => (
          <PlayerCard
            key={player.id}
            player={player}
            showDraftButton={true}
          />
        ))}
      </div>

      {filteredPlayers.length === 0 && (
        <div className="text-center py-12">
          <Filter className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No players found</h3>
          <p className="mt-1 text-sm text-gray-500">
            Try adjusting your search criteria or filters.
          </p>
        </div>
      )}
    </div>
  )
}
