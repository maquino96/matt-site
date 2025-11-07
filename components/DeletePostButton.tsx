'use client'

import { useState } from 'react'
import DeletePostModal from './DeletePostModal'

interface DeletePostButtonProps {
  postId: string
  postTitle: string
  hasImages: boolean
}

export default function DeletePostButton({ postId, postTitle, hasImages }: DeletePostButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-red-400 hover:bg-red-900/20 rounded transition-colors"
        title="Delete post"
        aria-label="Delete post"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
      <DeletePostModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        postId={postId}
        postTitle={postTitle}
        hasImages={hasImages}
      />
    </>
  )
}

