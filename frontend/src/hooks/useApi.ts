import { useState, useEffect, useCallback } from 'react'
import { apiService, convertApiPlayerToFrontendPlayer } from '../services/api'
import { useDraftStore } from '../store/draftStore'

export function usePlayerData() {
  const { setPlayers } = useDraftStore()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isBackendConnected, setIsBackendConnected] = useState(false)

  // Check backend health
  const checkBackendHealth = useCallback(async () => {
    try {
      await apiService.healthCheck()
      setIsBackendConnected(true)
      return true
    } catch (error) {
      setIsBackendConnected(false)
      console.warn('Backend health check failed:', error)
      return false
    }
  }, [])

  // Load players from backend
  const loadPlayers = useCallback(async (filters?: {
    position?: string
    team?: string
    limit?: number
    search?: string
  }) => {
    setIsLoading(true)
    setError(null)

    try {
      const isHealthy = await checkBackendHealth()
      
      if (!isHealthy) {
        throw new Error('Backend is not available')
      }

      const response = await apiService.getPlayers(filters)
      
      if (response.players && response.players.length > 0) {
        const frontendPlayers = response.players.map(convertApiPlayerToFrontendPlayer)
        setPlayers(frontendPlayers)
        console.log(`✅ Loaded ${frontendPlayers.length} players from backend`)
        return frontendPlayers
      } else {
        throw new Error('No players returned from backend')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load players'
      setError(errorMessage)
      console.error('Failed to load players:', err)
      return []
    } finally {
      setIsLoading(false)
    }
  }, [checkBackendHealth, setPlayers])

  // Search players
  const searchPlayers = useCallback(async (query: string, limit: number = 20) => {
    try {
      const players = await apiService.searchPlayers(query, limit)
      return players.map(convertApiPlayerToFrontendPlayer)
    } catch (error) {
      console.error('Failed to search players:', error)
      return []
    }
  }, [])

  // Get players by position
  const getPlayersByPosition = useCallback(async (position: string, limit?: number) => {
    try {
      const players = await apiService.getPlayersByPosition(position, limit)
      return players.map(convertApiPlayerToFrontendPlayer)
    } catch (error) {
      console.error('Failed to get players by position:', error)
      return []
    }
  }, [])

  // Initialize on mount
  useEffect(() => {
    loadPlayers({ limit: 500 })
  }, [loadPlayers])

  return {
    isLoading,
    error,
    isBackendConnected,
    loadPlayers,
    searchPlayers,
    getPlayersByPosition,
    checkBackendHealth,
  }
}
