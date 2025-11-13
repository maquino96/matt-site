'use client'

import { useState, FormEvent } from 'react'

interface AdminPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AdminPasswordModal({ isOpen, onClose }: AdminPasswordModalProps) {
  const [password, setPassword] = useState('')
  const [isAuthenticating, setIsAuthenticating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    
    if (!password.trim()) {
      setError('Password is required')
      return
    }

    setIsAuthenticating(true)
    setError(null)

    try {
      const response = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Authentication failed')
      }

      // Success - reload page to show editor with session cookie
      window.location.reload()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      setIsAuthenticating(false)
      setPassword('') // Clear password on error
    }
  }

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }} onClick={onClose}>
      <div className="bg-primary-800 border border-primary-700 rounded-lg p-6 max-w-md w-full mx-4 shadow-xl" style={{ backgroundColor: '#08263C' }} onClick={(e) => e.stopPropagation()}>
        <h2 className="text-xl font-bold text-gray-200 mb-4">Admin Access Required</h2>
        
        <p className="text-gray-300 mb-6">
          Enter the admin password to access the editor.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              disabled={isAuthenticating}
              autoFocus
              className="w-full px-4 py-2 bg-primary-900 border border-primary-700 rounded text-gray-200 placeholder-gray-500 focus:outline-none focus:border-accent disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: '#071A2F' }}
            />
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-900/20 border border-red-700 rounded text-red-400 text-sm">
              {error}
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isAuthenticating}
              className="px-6 py-2 text-sm bg-accent hover:bg-accent/90 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isAuthenticating ? 'Authenticating...' : 'Access Editor'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

