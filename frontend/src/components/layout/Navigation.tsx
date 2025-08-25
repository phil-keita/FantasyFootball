import { Link, useLocation } from 'react-router-dom'
import { Trophy, Users, LogOut } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'

export const Navigation = () => {
  const location = useLocation()
  const { user, logout, isAuthenticated } = useAuthStore()
  
  const isActive = (path: string) => location.pathname === path

  const handleLogout = async () => {
    try {
      await logout()
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  if (!isAuthenticated) {
    return null // Don't show navigation when not authenticated
  }
  
  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-2">
            <Trophy className="h-8 w-8 text-primary-600" />
            <h1 className="text-xl font-bold text-gray-900">Fantasy Draft Assistant</h1>
          </div>
          
          <div className="flex items-center space-x-6">
            <Link
              to="/drafts"
              className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive('/drafts') || isActive('/') 
                  ? 'bg-primary-100 text-primary-700' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <Users className="h-4 w-4" />
              <span>My Drafts</span>
            </Link>

            <div className="flex items-center space-x-3 border-l pl-4">
              <span className="text-sm text-gray-600">
                {user?.name || user?.email}
              </span>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-1 px-2 py-1 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
              >
                <LogOut className="h-4 w-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}
