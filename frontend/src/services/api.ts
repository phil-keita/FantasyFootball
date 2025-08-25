const API_BASE_URL = 'http://localhost:3001';

export interface ApiPlayer {
  id: string;
  name: string;
  position: 'QB' | 'RB' | 'WR' | 'TE' | 'K' | 'DEF';
  team: string;
  adp?: number;
  projectedPoints?: number;
  tier?: number;
  byeWeek?: number;
  // Additional backend fields
  depthChart?: string;
  experience?: number;
  height?: string;
  weight?: number;
  college?: string;
}

export interface PlayersResponse {
  players: ApiPlayer[];
  count: number;
  filters?: {
    position?: string;
    team?: string;
    limit?: number;
    search?: string;
  };
}

export interface ApiRecommendation {
  playerId: string;
  score: number;
  reasoning: string;
}

class ApiService {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  // Generic fetch wrapper with error handling
  private async fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
        ...options,
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Failed to fetch ${endpoint}:`, error);
      throw error;
    }
  }

  // Get all players with optional filters
  async getPlayers(filters?: {
    position?: string;
    team?: string;
    limit?: number;
    search?: string;
  }): Promise<PlayersResponse> {
    const params = new URLSearchParams();
    
    if (filters?.position) params.append('position', filters.position);
    if (filters?.team) params.append('team', filters.team);
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.search) params.append('search', filters.search);

    const queryString = params.toString();
    const endpoint = `/api/players${queryString ? `?${queryString}` : ''}`;
    
    return this.fetchApi<PlayersResponse>(endpoint);
  }

  // Get players by position
  async getPlayersByPosition(position: string, limit?: number): Promise<ApiPlayer[]> {
    const response = await this.getPlayers({ position, limit });
    return response.players;
  }

  // Search players by name
  async searchPlayers(query: string, limit: number = 20): Promise<ApiPlayer[]> {
    const response = await this.getPlayers({ search: query, limit });
    return response.players;
  }

  // Get top available players (not drafted)
  async getTopAvailablePlayers(limit: number = 50): Promise<ApiPlayer[]> {
    const response = await this.getPlayers({ limit });
    return response.players;
  }

  // Get draft recommendations (placeholder for LLM integration)
  async getDraftRecommendations(data: {
    currentRoster: ApiPlayer[];
    availablePlayers: ApiPlayer[];
    round: number;
    pick: number;
  }): Promise<ApiRecommendation[]> {
    try {
      return await this.fetchApi<ApiRecommendation[]>('/api/recommendations', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch (error) {
      // If recommendations API is not available, return empty array
      console.warn('Recommendations API not available:', error);
      return [];
    }
  }

  // Health check
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    return this.fetchApi<{ status: string; timestamp: string }>('/health');
  }
}

// Export singleton instance
export const apiService = new ApiService();

// Helper function to convert API player to frontend player format
export function convertApiPlayerToFrontendPlayer(apiPlayer: ApiPlayer): import('../store/draftStore').Player {
  return {
    id: apiPlayer.id,
    name: apiPlayer.name,
    position: apiPlayer.position,
    team: apiPlayer.team,
    projectedPoints: apiPlayer.projectedPoints,
    adp: apiPlayer.adp,
    tier: apiPlayer.tier,
    byeWeek: apiPlayer.byeWeek,
    isDrafted: false, // Will be managed by frontend state
  };
}
