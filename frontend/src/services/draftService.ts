import { databases, DATABASE_ID, DRAFTS_COLLECTION_ID, DRAFT_HISTORY_COLLECTION_ID, generateId } from './appwrite'
import { AppwriteDraft, AppwriteDraftHistory } from './appwrite'
import { Query } from 'appwrite'

export class DraftService {
  
  // Helper method to parse documents from Appwrite format to our interface
  private static parseDocument(doc: any): AppwriteDraft {
    return {
      $id: doc.$id,
      $createdAt: doc.$createdAt,
      $updatedAt: doc.$updatedAt,
      userId: doc.userId,
      draftName: doc.draftName,
      status: doc.status,
      config: typeof doc.config === 'string' ? JSON.parse(doc.config) : doc.config,
      currentPick: doc.currentPick,
      currentRound: doc.currentRound,
      currentTeam: doc.currentTeam,
      teams: typeof doc.teams === 'string' ? JSON.parse(doc.teams) : doc.teams,
      draftBoard: typeof doc.draftBoard === 'string' ? JSON.parse(doc.draftBoard) : doc.draftBoard
    }
  }

  // Helper method to serialize draft data for storage
  private static serializeDocument(draftData: Partial<AppwriteDraft>) {
    const serialized: any = { ...draftData }
    
    if (draftData.config) {
      serialized.config = JSON.stringify(draftData.config)
    }
    if (draftData.teams) {
      serialized.teams = JSON.stringify(draftData.teams)
    }
    if (draftData.draftBoard) {
      serialized.draftBoard = JSON.stringify(draftData.draftBoard)
    }
    
    return serialized
  }
  
  // Create a new draft
  static async createDraft(draftData: Omit<AppwriteDraft, '$id' | '$createdAt' | '$updatedAt'>) {
    try {
      const doc = await databases.createDocument(
        DATABASE_ID,
        DRAFTS_COLLECTION_ID,
        'unique()',
        this.serializeDocument(draftData)
      )
      return this.parseDocument(doc)
    } catch (error) {
      console.error('Error creating draft:', error)
      throw error
    }
  }

  // Get all drafts for a user
  static async getUserDrafts(userId: string): Promise<AppwriteDraft[]> {
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        DRAFTS_COLLECTION_ID,
        [
          Query.equal('userId', userId),
          Query.orderDesc('$createdAt')
        ]
      )
      return response.documents.map(doc => this.parseDocument(doc))
    } catch (error) {
      console.error('Error getting user drafts:', error)
      throw error
    }
  }

  // Get a specific draft by ID
  static async getDraft(draftId: string): Promise<AppwriteDraft> {
    try {
      const doc = await databases.getDocument(
        DATABASE_ID,
        DRAFTS_COLLECTION_ID,
        draftId
      )
      return this.parseDocument(doc)
    } catch (error) {
      console.error('Error getting draft:', error)
      throw error
    }
  }

  // Update an existing draft
  static async updateDraft(draftId: string, updates: Partial<AppwriteDraft>): Promise<AppwriteDraft> {
    try {
      const doc = await databases.updateDocument(
        DATABASE_ID,
        DRAFTS_COLLECTION_ID,
        draftId,
        this.serializeDocument(updates)
      )
      return this.parseDocument(doc)
    } catch (error) {
      console.error('Error updating draft:', error)
      throw error
    }
  }

  // Delete a draft
  static async deleteDraft(draftId: string): Promise<void> {
    try {
      await databases.deleteDocument(
        DATABASE_ID,
        DRAFTS_COLLECTION_ID,
        draftId
      )
    } catch (error) {
      console.error('Error deleting draft:', error)
      throw error
    }
  }

  // Save draft history (picks made during draft)
  static async saveDraftHistory(userId: string, draftId: string, picks: AppwriteDraftHistory['picks']): Promise<AppwriteDraftHistory> {
    try {
      const history = await databases.createDocument(
        DATABASE_ID,
        DRAFT_HISTORY_COLLECTION_ID,
        generateId(),
        {
          userId,
          draftId,
          picks
        }
      )

      console.log('Draft history saved:', history)
      return history as unknown as AppwriteDraftHistory
    } catch (error) {
      console.error('Error saving draft history:', error)
      throw error
    }
  }

  // Get draft history
  static async getDraftHistory(draftId: string): Promise<AppwriteDraftHistory | null> {
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        DRAFT_HISTORY_COLLECTION_ID,
        [
          Query.equal('draftId', draftId),
          Query.limit(1)
        ]
      )

      return response.documents.length > 0 ? response.documents[0] as unknown as AppwriteDraftHistory : null
    } catch (error) {
      console.error('Error getting draft history:', error)
      throw error
    }
  }

  // Get drafts by status
  static async getDraftsByStatus(userId: string, status: AppwriteDraft['status']): Promise<AppwriteDraft[]> {
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        DRAFTS_COLLECTION_ID,
        [
          Query.equal('userId', userId),
          Query.equal('status', status),
          Query.orderDesc('$createdAt')
        ]
      )

      return response.documents as unknown as AppwriteDraft[]
    } catch (error) {
      console.error('Error getting drafts by status:', error)
      throw error
    }
  }

  // Quick save - update draft with current state
  static async quickSave(draftId: string, draftState: {
    currentPick: number
    currentRound: number
    currentTeam: number
    teams: AppwriteDraft['teams']
    draftBoard: AppwriteDraft['draftBoard']
  }): Promise<void> {
    try {
      await this.updateDraft(draftId, {
        ...draftState,
        status: 'in-progress'
      })
    } catch (error) {
      console.error('Error in quick save:', error)
      throw error
    }
  }
}
