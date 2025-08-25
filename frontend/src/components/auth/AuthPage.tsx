import React, { useState } from 'react'
import { LoginForm } from './LoginForm'
import { RegisterForm } from './RegisterForm'

interface AuthPageProps {
  onSuccess?: () => void
}

export const AuthPage: React.FC<AuthPageProps> = ({ onSuccess }) => {
  const [isLogin, setIsLogin] = useState(true)

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">🏈</h1>
          <h1 className="text-3xl font-bold text-gray-900">Fantasy Football Draft</h1>
          <p className="text-gray-600 mt-2">Your personal draft assistant</p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        {isLogin ? (
          <LoginForm 
            onSuccess={onSuccess}
            switchToRegister={() => setIsLogin(false)}
          />
        ) : (
          <RegisterForm 
            onSuccess={onSuccess}
            switchToLogin={() => setIsLogin(true)}
          />
        )}
      </div>
    </div>
  )
}
