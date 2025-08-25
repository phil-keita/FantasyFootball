const API_BASE_URL = 'http://localhost:3001';

export interface ApiPlayer {
  sleeper_id: string;
  name?: string;
  first_name?: string;
  last_name?: string;
  position: 'QB' | 'RB' | 'WR' | 'TE' | 'K' | 'DEF';
  team: string;
  age?: number;
  years_exp?: number;
  college?: string;
  height?: string;
  weight?: string;
  adp?: number | null;
  adp_change?: number | null;
  // Sleeper data
  sleeper_stats_2024?: any;
  trending?: any;
  // FantasyData
  fantasy_data?: any;
  // Processed data
  analysis?: {
    data_sources: string[];
    last_updated: string;
  };
}

export interface PlayersResponse {
  players: ApiPlayer[];
  count: number;
  total_in_db: number;
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
    const endpoint = `/api/rankings/${position.toLowerCase()}${limit ? `?limit=${limit}` : ''}`;
    const response = await this.fetchApi<{ players: ApiPlayer[]; count: number }>(endpoint);
    return response.players || [];
  }

  // Search players by name
  async searchPlayers(query: string, limit: number = 20): Promise<ApiPlayer[]> {
    const endpoint = `/api/players/search/${encodeURIComponent(query)}?limit=${limit}`;
    const response = await this.fetchApi<{ results: ApiPlayer[]; count: number }>(endpoint);
    return response.results || [];
  }

  // Get top available players (not drafted)
  async getTopAvailablePlayers(limit: number = 50): Promise<ApiPlayer[]> {
    const response = await this.getPlayers({ limit });
    return response.players;
  }

  // Get draft recommendations from LLM agent
  async getDraftRecommendations(data: {
    draftedPlayers: Array<{
      playerName: string;
      team: string;
      position: string;
      pickNumber: number;
      draftedByTeam: string;
    }>;
    currentPick: number;
    userTeam: string;
    leagueSettings: {
      teams: number;
      format: string;
      rounds: number;
    };
  }): Promise<{ 
    recommendations: Array<{
      playerName: string;
      position: string;
      team: string;
      reasoning: string;
      confidence: number;
    }>;
    reasoning: string;
  }> {
    try {
      return await this.fetchApi<any>('/api/draft/recommend', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch (error) {
      console.warn('Draft recommendations API not available:', error);
      return { recommendations: [], reasoning: 'API unavailable' };
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
export function convertApiPlayerToFrontendPlayer(apiPlayer: any): import('../store/draftStore').Player {
  // Handle different name field combinations from the API
  const getPlayerName = (player: any): string => {
    if (player.name) return player.name;
    if (player.first_name && player.last_name) {
      return `${player.first_name} ${player.last_name}`;
    }
    if (player.first_name) return player.first_name;
    if (player.last_name) return player.last_name;
    return 'Unknown Player';
  };

  return {
    id: apiPlayer.sleeper_id || apiPlayer.id || 'unknown',
    name: getPlayerName(apiPlayer),
    position: apiPlayer.position || 'N/A',
    team: apiPlayer.team || 'FA',
    projectedPoints: apiPlayer.sleeper_stats_2024?.pts_ppr || 0,
    adp: apiPlayer.adp || undefined,
    tier: undefined,
    byeWeek: undefined,
    isDrafted: false, // Will be managed by frontend state
  };
}
