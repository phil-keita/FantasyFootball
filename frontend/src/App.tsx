import { Routes, Route, useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import { 
  SimpleDraftBoard, 
  Navigation, 
  DraftSetup, 
  AuthPage, 
  MyDraftsPage 
} from './components'
import { useDraftStore } from './store/draftStore'
import { useAuthStore } from './store/authStore'
import { DraftService } from './services/draftService'
import { DraftConfig } from './store/draftStore'

function App() {
  const { initializeDraft, setDraftConfig } = useDraftStore()
  const { isAuthenticated, getCurrentUser, isLoading, hasCheckedAuth, user } = useAuthStore()
  const navigate = useNavigate()

  // Check for existing session on app load
  useEffect(() => {
    getCurrentUser()
  }, [getCurrentUser])

  const handleStartDraft = async (config: DraftConfig) => {
    if (!user) {
      console.error('No user found, cannot create draft')
      return
    }

    try {
      // Create the draft in the database first
      const savedDraft = await DraftService.createDraft({
        userId: user.$id,
        draftName: config.leagueName,
        config,
        status: 'draft',
        currentPick: 1,
        currentRound: 1,
        currentTeam: 1,
        teams: [],
        draftBoard: []
      })

      // Set the draft configuration in the store
      setDraftConfig(config)
      
      // Initialize the draft in local state
      initializeDraft(config)
      
      // Navigate to the draft board with the saved draft ID
      navigate(`/draft/${savedDraft.$id}`)
    } catch (error) {
      console.error('Failed to create draft:', error)
      // You might want to show an error toast here
      alert('Failed to create draft. Please try again.')
    }
  }

  // Show loading while checking authentication
  if (isLoading && !hasCheckedAuth) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-lg font-medium text-gray-700">Checking authentication...</p>
        </div>
      </div>
    )
  }

  // Show auth page if not authenticated
  if (!isAuthenticated) {
    return <AuthPage />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <Navigation />
      <main className="container mx-auto px-4 py-8">
        <Routes>
          <Route path="/" element={<MyDraftsPage />} />
          <Route path="/drafts" element={<MyDraftsPage />} />
          <Route path="/draft/:draftId" element={<SimpleDraftBoard />} />
          <Route path="/create" element={<DraftSetup onStartDraft={handleStartDraft} />} />
          <Route path="/edit/:draftId" element={<DraftSetup onStartDraft={handleStartDraft} />} />
        </Routes>
      </main>
    </div>
  )
}

export default App
