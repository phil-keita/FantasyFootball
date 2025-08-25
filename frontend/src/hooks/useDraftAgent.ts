/**
 * useDraftAgent Hook
 * React hook for managing draft agent interactions and state
 */

import { useState, useCallback, useEffect } from 'react';
import { draftAgent, DraftState, DraftRecommendation, AgentStatus } from '../services/draftAgent';

interface UseDraftAgentReturn {
  // State
  recommendation: DraftRecommendation | null;
  agentStatus: AgentStatus | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  getDraftRecommendation: (draftState: DraftState) => Promise<void>;
  checkAgentStatus: () => Promise<void>;
  clearRecommendation: () => void;
  clearError: () => void;
}

export const useDraftAgent = (): UseDraftAgentReturn => {
  const [recommendation, setRecommendation] = useState<DraftRecommendation | null>(null);
  const [agentStatus, setAgentStatus] = useState<AgentStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Get draft recommendation from the agent
   */
  const getDraftRecommendation = useCallback(async (draftState: DraftState) => {
    try {
      setIsLoading(true);
      setError(null);

      // Validate draft state
      const validationErrors = draftAgent.validateDraftState(draftState);
      if (validationErrors.length > 0) {
        throw new Error(`Invalid draft state: ${validationErrors.join(', ')}`);
      }

      console.log('🤖 Requesting draft recommendation for pick', draftState.currentPick);
      
      const result = await draftAgent.getDraftRecommendation(draftState);
      setRecommendation(result);
      
      console.log('✅ Draft recommendation received:', {
        toolsUsed: result.toolsUsed,
        userTeam: result.userTeam,
        pick: result.currentPick
      });

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get draft recommendation';
      setError(errorMessage);
      console.error('❌ Draft recommendation error:', errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Check agent status and capabilities
   */
  const checkAgentStatus = useCallback(async () => {
    try {
      setError(null);
      const status = await draftAgent.getAgentStatus();
      setAgentStatus(status);
      
      console.log('🤖 Agent status:', {
        available: status.available,
        capabilities: status.capabilities.length,
        tools: status.tools.length
      });

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to check agent status';
      setError(errorMessage);
      console.error('❌ Agent status error:', errorMessage);
    }
  }, []);

  /**
   * Clear current recommendation
   */
  const clearRecommendation = useCallback(() => {
    setRecommendation(null);
  }, []);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Check agent status on mount
  useEffect(() => {
    checkAgentStatus();
  }, [checkAgentStatus]);

  return {
    recommendation,
    agentStatus,
    isLoading,
    error,
    getDraftRecommendation,
    checkAgentStatus,
    clearRecommendation,
    clearError
  };
};

/**
 * Hook for managing draft state
 */
interface UseDraftStateReturn {
  draftState: DraftState;
  updateDraftState: (updates: Partial<DraftState>) => void;
  addDraftedPlayer: (player: { 
    playerName: string; 
    team: string; 
    position: string; 
    draftedByTeam: string;
  }) => void;
  resetDraftState: () => void;
  createSampleDraft: () => void;
}

export const useDraftState = (initialUserTeam: string = 'MyTeam'): UseDraftStateReturn => {
  const [draftState, setDraftState] = useState<DraftState>({
    draftedPlayers: [],
    currentPick: 1,
    userTeam: initialUserTeam,
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
  });

  const updateDraftState = useCallback((updates: Partial<DraftState>) => {
    setDraftState(prev => ({ ...prev, ...updates }));
  }, []);

  const addDraftedPlayer = useCallback((player: { 
    playerName: string; 
    team: string; 
    position: string; 
    draftedByTeam: string;
  }) => {
    setDraftState(prev => ({
      ...prev,
      draftedPlayers: [
        ...prev.draftedPlayers,
        {
          ...player,
          pickNumber: prev.currentPick
        }
      ],
      currentPick: prev.currentPick + 1
    }));
  }, []);

  const resetDraftState = useCallback(() => {
    setDraftState({
      draftedPlayers: [],
      currentPick: 1,
      userTeam: initialUserTeam,
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
    });
  }, [initialUserTeam]);

  const createSampleDraft = useCallback(() => {
    const sampleState = draftAgent.createSampleDraftState();
    setDraftState({ ...sampleState, userTeam: initialUserTeam });
  }, [initialUserTeam]);

  return {
    draftState,
    updateDraftState,
    addDraftedPlayer,
    resetDraftState,
    createSampleDraft
  };
};
