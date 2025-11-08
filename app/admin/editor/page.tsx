'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import TiptapEditor from '@/components/editor/TiptapEditor'
import PreviewPane from '@/components/editor/PreviewPane'
import TagInput from '@/components/editor/TagInput'
import { generateSlug } from '@/lib/tiptap/utils'

// Check if editor is enabled
const isEditorEnabled = () => {
  if (typeof window === 'undefined') return false
  return process.env.NEXT_PUBLIC_ENABLE_EDITOR === 'true' || 
         process.env.NODE_ENV === 'development'
}

export default function EditorPage() {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [content, setContent] = useState('<p></p>')
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [previewMode, setPreviewMode] = useState<'edit' | 'preview'>('edit')

  // Redirect if editor not enabled
  useEffect(() => {
    if (!isEditorEnabled()) {
      router.push('/')
    }
  }, [router])

  if (!isEditorEnabled()) {
    return null
  }

  const handleSave = async (publish: boolean = false) => {
    if (!title.trim()) {
      setError('Title is required')
      return
    }

    setIsSaving(true)
    setError(null)
    setSuccess(false)

    try {
      const slug = generateSlug(title)
      const response = await fetch('/api/posts/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: title.trim(),
          slug,
          tags,
          content,
          published: publish,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to save post')
      }

      const post = await response.json()
      setSuccess(true)
      
      // Redirect to the new post after a short delay
      setTimeout(() => {
        router.push(`/blog/${post.slug}`)
      }, 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="container-content py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-accent mb-2">Create New Post</h1>
        <p className="text-gray-400">Write and preview your blog post</p>
      </div>

      {/* Form Fields */}
      <div className="space-y-6 mb-6">
        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Title *
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter post title"
            className="w-full px-4 py-2 bg-primary-900 border border-primary-700 rounded-md text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>

        {/* Tags */}
        <TagInput tags={tags} onChange={setTags} />
      </div>

      {/* Preview Mode Toggle */}
      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={() => setPreviewMode(previewMode === 'preview' ? 'edit' : 'preview')}
          className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
            previewMode === 'preview'
              ? 'bg-accent text-primary-900'
              : 'bg-primary-800 text-gray-300 hover:bg-primary-700'
          }`}
        >
          {previewMode === 'preview' ? 'Edit' : 'Preview'}
        </button>
      </div>

      {/* Editor and Preview */}
      <div className="grid gap-4 mb-6 grid-cols-1">
        {previewMode === 'edit' && (
          <div>
            <h2 className="text-lg font-semibold text-gray-200 mb-2">Editor</h2>
            <TiptapEditor content={content} onChange={setContent} />
          </div>
        )}
        {previewMode === 'preview' && (
          <div>
            <h2 className="text-lg font-semibold text-gray-200 mb-2">Preview</h2>
            <PreviewPane htmlContent={content} />
          </div>
        )}
      </div>

      {/* Messages */}
      {error && (
        <div className="mb-4 p-4 bg-red-900/20 border border-red-700 rounded-md text-red-400">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 p-4 bg-green-900/20 border border-green-700 rounded-md text-green-400">
          Post saved successfully! Redirecting...
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-4">
        <button
          onClick={() => handleSave(false)}
          disabled={isSaving}
          className="btn btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving ? 'Saving...' : 'Save Draft'}
        </button>
        <button
          onClick={() => handleSave(true)}
          disabled={isSaving}
          className="btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving ? 'Publishing...' : 'Publish'}
        </button>
      </div>
    </div>
  )
}

