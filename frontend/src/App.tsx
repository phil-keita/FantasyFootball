import { Routes, Route } from 'react-router-dom'
import { DraftBoard } from './components/DraftBoard'
import { PlayerList } from './components/PlayerList'
import { Navigation } from './components/Navigation'
import { DraftProvider } from './store/draftStore'

function App() {
  return (
    <DraftProvider>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <Navigation />
        <main className="container mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<DraftBoard />} />
            <Route path="/players" element={<PlayerList />} />
          </Routes>
        </main>
      </div>
    </DraftProvider>
  )
}

export default App
