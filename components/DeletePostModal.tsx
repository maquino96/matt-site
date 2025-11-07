'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface DeletePostModalProps {
  isOpen: boolean
  onClose: () => void
  postId: string
  postTitle: string
  hasImages: boolean
}

export default function DeletePostModal({
  isOpen,
  onClose,
  postId,
  postTitle,
  hasImages,
}: DeletePostModalProps) {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null

  const handleDelete = async () => {
    setIsDeleting(true)
    setError(null)

    try {
      const response = await fetch(`/api/posts/${postId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to delete post')
      }

      // Close modal and force a hard refresh to ensure deleted posts are removed
      onClose()
      // Use window.location for a hard refresh to clear any cached data
      window.location.reload()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      setIsDeleting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        className="bg-primary-800 border border-primary-700 rounded-lg p-6 max-w-md w-full mx-4 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold text-gray-200 mb-4">Delete Post</h2>
        
        <p className="text-gray-300 mb-2">
          Are you sure you want to delete <strong className="text-accent">&quot;{postTitle}&quot;</strong>?
        </p>
        
        {hasImages && (
          <p className="text-yellow-400 text-sm mb-4">
            ⚠️ This post contains images that will also be deleted from storage.
          </p>
        )}
        
        <p className="text-gray-400 text-sm mb-6">
          This action cannot be undone.
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-900/20 border border-red-700 rounded text-red-400 text-sm">
            {error}
          </div>
        )}

        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2 text-sm bg-primary-700 hover:bg-primary-600 text-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="px-4 py-2 text-sm bg-red-600 hover:bg-red-700 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  )
}

