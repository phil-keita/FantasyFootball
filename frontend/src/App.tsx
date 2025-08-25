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
import { DraftConfig } from './store/draftStore'

function App() {
  const { initializeDraft } = useDraftStore()
  const { isAuthenticated, getCurrentUser, isLoading, hasCheckedAuth } = useAuthStore()
  const navigate = useNavigate()

  // Check for existing session on app load
  useEffect(() => {
    getCurrentUser()
  }, [getCurrentUser])

  const handleStartDraft = (config: DraftConfig) => {
    initializeDraft(config)
    navigate('/draft')
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
          <Route path="/setup" element={<DraftSetup onStartDraft={handleStartDraft} />} />
        </Routes>
      </main>
    </div>
  )
}

export default App
