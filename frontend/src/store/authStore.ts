import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { account } from '../services/appwrite'
import { Models } from 'appwrite'

export interface AuthUser extends Models.User<Models.Preferences> {}

interface AuthState {
  user: AuthUser | null
  isLoading: boolean
  isAuthenticated: boolean
  hasCheckedAuth: boolean  // Track if we've completed initial auth check
  
  // Actions
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, name: string) => Promise<void>
  logout: () => Promise<void>
  getCurrentUser: () => Promise<void>
  forgotPassword: (email: string) => Promise<void>
  resetPassword: (userId: string, secret: string, password: string) => Promise<void>
}

export const useAuthStore = create<AuthState>()(
  devtools(
    (set, get) => ({
      user: null,
      isLoading: false,
      isAuthenticated: false,
      hasCheckedAuth: false,

      login: async (email: string, password: string) => {
        set({ isLoading: true })
        try {
          const session = await account.createEmailPasswordSession(email, password)
          console.log('Login successful:', session)
          
          // Get user details after login
          await get().getCurrentUser()
        } catch (error) {
          console.error('Login error:', error)
          throw error
        } finally {
          set({ isLoading: false })
        }
      },

      register: async (email: string, password: string, name: string) => {
        set({ isLoading: true })
        try {
          const user = await account.create('unique()', email, password, name)
          console.log('Registration successful:', user)
          
          // Automatically log in after registration
          await get().login(email, password)
        } catch (error) {
          console.error('Registration error:', error)
          throw error
        } finally {
          set({ isLoading: false })
        }
      },

      logout: async () => {
        set({ isLoading: true })
        try {
          await account.deleteSession('current')
          set({ 
            user: null, 
            isAuthenticated: false,
            isLoading: false,
            hasCheckedAuth: true
          })
          console.log('✅ Logout successful')
        } catch (error) {
          console.error('❌ Logout error:', error)
          set({ isLoading: false })
          throw error
        }
      },

      getCurrentUser: async () => {
        set({ isLoading: true })
        try {
          const user = await account.get()
          set({ 
            user, 
            isAuthenticated: true,
            isLoading: false,
            hasCheckedAuth: true 
          })
          console.log('✅ Current user loaded:', user.name || user.email)
        } catch (error: any) {
          // Don't log error if it's just "no user logged in" - that's expected
          if (error.code === 401 || error.message?.includes('guests') || error.message?.includes('scope')) {
            // Silent handling for "no user logged in" - this is normal
            console.log('ℹ️ No user session found (user not logged in)')
          } else {
            console.error('❌ Unexpected auth error:', error)
          }
          set({ 
            user: null, 
            isAuthenticated: false,
            isLoading: false,
            hasCheckedAuth: true
          })
          // Don't throw error here as this is called on app init
        }
      },

      forgotPassword: async (email: string) => {
        try {
          await account.createRecovery(
            email,
            `${window.location.origin}/reset-password`
          )
          console.log('Password recovery email sent')
        } catch (error) {
          console.error('Forgot password error:', error)
          throw error
        }
      },

      resetPassword: async (userId: string, secret: string, password: string) => {
        try {
          await account.updateRecovery(userId, secret, password)
          console.log('Password reset successful')
        } catch (error) {
          console.error('Reset password error:', error)
          throw error
        }
      }
    }),
    { name: 'auth-store' }
  )
)
