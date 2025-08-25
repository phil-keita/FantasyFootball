import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { useDraftStore } from '../store/draftStore'
import { DraftService } from '../services/draftService'
import { AppwriteDraft } from '../services/appwrite'
import { Play, Edit, Trash2, Plus, Calendar, Users } from 'lucide-react'

export const MyDraftsPage: React.FC = () => {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { setDraftConfig, initializeDraft } = useDraftStore()
  
  const [drafts, setDrafts] = useState<AppwriteDraft[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (user) {
      loadUserDrafts()
    }
  }, [user])

  const loadUserDrafts = async () => {
    if (!user) return
    
    setIsLoading(true)
    try {
      const userDrafts = await DraftService.getUserDrafts(user.$id)
      setDrafts(userDrafts)
      setError('') // Clear any previous errors
    } catch (err: any) {
      if (err.message?.includes('Database not found') || err.message?.includes('Collection not found')) {
        console.log('ℹ️ Database not set up yet - showing setup message')
        setError('Database not set up yet. Please follow the APPWRITE_SETUP.md guide to create the database structure.')
      } else {
        setError(err.message || 'Failed to load drafts')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleStartDraft = async (draft: AppwriteDraft) => {
    try {
      // Set the draft configuration in the store
      setDraftConfig(draft.config)
      
      // Initialize the draft with the stored data
      initializeDraft(draft.config)
      
      // Navigate to the draft board
      navigate('/draft')
    } catch (error) {
      console.error('Error starting draft:', error)
    }
  }

  const handleEditDraft = (draft: AppwriteDraft) => {
    // Set the draft configuration and navigate to setup
    setDraftConfig(draft.config)
    navigate('/setup')
  }

  const handleDeleteDraft = async (draftId: string) => {
    if (!confirm('Are you sure you want to delete this draft?')) {
      return
    }

    try {
      await DraftService.deleteDraft(draftId)
      setDrafts(drafts.filter(draft => draft.$id !== draftId))
    } catch (err: any) {
      setError(err.message || 'Failed to delete draft')
    }
  }

  const getStatusColor = (status: AppwriteDraft['status']) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800'
      case 'in-progress': return 'bg-blue-100 text-blue-800'
      case 'completed': return 'bg-green-100 text-green-800'
      case 'paused': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: AppwriteDraft['status']) => {
    switch (status) {
      case 'draft': return 'Draft'
      case 'in-progress': return 'In Progress'
      case 'completed': return 'Completed'
      case 'paused': return 'Paused'
      default: return status
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-lg font-medium text-gray-700">Loading your drafts...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Fantasy Drafts</h1>
          <p className="text-gray-600 mt-2">Manage and track all your fantasy football drafts</p>
        </div>
        
        <button
          onClick={() => navigate('/setup')}
          className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>New Draft</span>
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {drafts.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <div className="text-gray-400 text-6xl mb-4">🏈</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No drafts yet</h3>
          <p className="text-gray-600 mb-6">Create your first fantasy football draft to get started</p>
          <button
            onClick={() => navigate('/setup')}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Create Your First Draft
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {drafts.map((draft) => (
            <div
              key={draft.$id}
              className="bg-white rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 truncate">
                    {draft.config.leagueName}
                  </h3>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(draft.status)}`}>
                    {getStatusText(draft.status)}
                  </span>
                </div>

                <div className="space-y-2 text-sm text-gray-600 mb-4">
                  <div className="flex items-center space-x-2">
                    <Users className="h-4 w-4" />
                    <span>{draft.config.numberOfTeams} teams</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4" />
                    <span>Pick #{draft.config.playerPickNumber}</span>
                  </div>
                  {draft.$createdAt && (
                    <div className="text-xs text-gray-500">
                      Created: {new Date(draft.$createdAt).toLocaleDateString()}
                    </div>
                  )}
                </div>

                <div className="flex space-x-2">
                  {draft.status !== 'completed' && (
                    <button
                      onClick={() => handleStartDraft(draft)}
                      className="flex-1 flex items-center justify-center space-x-1 bg-green-600 text-white px-3 py-2 rounded text-sm hover:bg-green-700 transition-colors"
                    >
                      <Play className="h-4 w-4" />
                      <span>{draft.status === 'draft' ? 'Start' : 'Resume'}</span>
                    </button>
                  )}
                  
                  <button
                    onClick={() => handleEditDraft(draft)}
                    className="flex items-center justify-center p-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors"
                    title="Edit draft settings"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  
                  <button
                    onClick={() => handleDeleteDraft(draft.$id!)}
                    className="flex items-center justify-center p-2 border border-red-300 text-red-600 rounded hover:bg-red-50 transition-colors"
                    title="Delete draft"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
