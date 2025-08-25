/**
 * Draft Agent Service
 * Frontend service for interacting with the AI-powered draft recommendations
 */

export interface DraftState {
  draftedPlayers: DraftedPlayer[];
  currentPick: number;
  userTeam: string;
  leagueSettings?: LeagueSettings;
}

export interface DraftedPlayer {
  playerName: string;
  team: string;
  position: string;
  pickNumber: number;
  draftedByTeam: string;
}

export interface LeagueSettings {
  teams: number;
  format: 'ppr' | 'half_ppr' | 'standard';
  rounds: number;
  rosterSpots: {
    QB: number;
    RB: number;
    WR: number;
    TE: number;
    FLEX: number;
    K: number;
    DEF: number;
    BENCH: number;
  };
}

export interface DraftRecommendation {
  success: boolean;
  currentPick: number;
  userTeam: string;
  recommendation: string;
  toolsUsed: string[];
  reasoning: string;
  timestamp: string;
}

export interface AgentStatus {
  available: boolean;
  capabilities: string[];
  tools: string[];
  requirements: string[];
  fallbacks: string[];
}

class DraftAgentService {
  private baseUrl: string;

  constructor(baseUrl: string = 'http://localhost:3001') {
    this.baseUrl = baseUrl;
  }

  /**
   * Get AI-powered draft recommendations based on current draft state
   */
  async getDraftRecommendation(draftState: DraftState): Promise<DraftRecommendation> {
    try {
      const response = await fetch(`${this.baseUrl}/api/draft/recommend`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(draftState),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Network error' }));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Draft recommendation error:', error);
      throw new Error(`Failed to get draft recommendation: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Check draft agent availability and capabilities
   */
  async getAgentStatus(): Promise<AgentStatus> {
    try {
      const response = await fetch(`${this.baseUrl}/api/draft/agent-status`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Agent status error:', error);
      // Return fallback status if can't reach server
      return {
        available: false,
        capabilities: [],
        tools: [],
        requirements: ['Server connection', 'OpenAI API key'],
        fallbacks: ['Manual draft analysis', 'Static player rankings']
      };
    }
  }

  /**
   * Create a sample draft state for testing
   */
  createSampleDraftState(): DraftState {
    return {
      draftedPlayers: [
        {
          playerName: 'Christian McCaffrey',
          team: 'SF',
          position: 'RB',
          pickNumber: 1,
          draftedByTeam: 'Team1'
        },
        {
          playerName: 'Tyreek Hill',
          team: 'MIA',
          position: 'WR',
          pickNumber: 2,
          draftedByTeam: 'Team2'
        },
        {
          playerName: 'Austin Ekeler',
          team: 'LAC',
          position: 'RB',
          pickNumber: 3,
          draftedByTeam: 'MyTeam'
        }
      ],
      currentPick: 4,
      userTeam: 'MyTeam',
      leagueSettings: {
        teams: 12,
        format: 'ppr',
        rounds: 15,
        rosterSpots: {
          QB: 1,
          RB: 2,
          WR: 3,
          TE: 1,
          FLEX: 1,
          K: 1,
          DEF: 1,
          BENCH: 6
        }
      }
    };
  }

  /**
   * Validate draft state before sending to API
   */
  validateDraftState(draftState: DraftState): string[] {
    const errors: string[] = [];

    if (!draftState.draftedPlayers || !Array.isArray(draftState.draftedPlayers)) {
      errors.push('draftedPlayers must be an array');
    }

    if (!draftState.currentPick || typeof draftState.currentPick !== 'number') {
      errors.push('currentPick must be a number');
    }

    if (!draftState.userTeam || typeof draftState.userTeam !== 'string') {
      errors.push('userTeam must be a string');
    }

    // Validate drafted players structure
    draftState.draftedPlayers?.forEach((player, index) => {
      if (!player.playerName) errors.push(`Player ${index}: playerName is required`);
      if (!player.position) errors.push(`Player ${index}: position is required`);
      if (!player.draftedByTeam) errors.push(`Player ${index}: draftedByTeam is required`);
      if (typeof player.pickNumber !== 'number') errors.push(`Player ${index}: pickNumber must be a number`);
    });

    return errors;
  }

  /**
   * Format recommendation text for display
   */
  formatRecommendation(recommendation: string): string {
    // Basic formatting for better readability
    return recommendation
      .replace(/\n\n/g, '\n\n')  // Preserve paragraph breaks
      .replace(/\*\*(.*?)\*\*/g, '$1')  // Remove markdown bold
      .replace(/\*(.*?)\*/g, '$1')  // Remove markdown italic
      .trim();
  }

  /**
   * Parse player names from recommendation text
   */
  extractPlayerNames(recommendation: string): string[] {
    // Simple regex to find potential player names (capitalized words)
    const playerPattern = /\b[A-Z][a-z]+\s+[A-Z][a-z]+\b/g;
    const matches = recommendation.match(playerPattern) || [];
    
    // Filter out common false positives
    const excludeWords = ['Draft', 'Pick', 'Round', 'Team', 'League', 'Fantasy', 'Football'];
    
    return matches.filter(name => 
      !excludeWords.some(word => name.includes(word)) &&
      name.length > 5  // Reasonable minimum for player names
    );
  }
}

// Create and export singleton instance
export const draftAgent = new DraftAgentService();

// Export types and service class
export { DraftAgentService };
