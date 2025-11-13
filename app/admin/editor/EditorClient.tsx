'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import TiptapEditor from '@/components/editor/TiptapEditor'
import { generateSlug } from '@/lib/tiptap/utils'

export interface EditorClientProps {
  content: string
  onChange: (content: string) => void
  isSaving?: boolean
  onSavingChange?: (isSaving: boolean) => void
  onDraftSaved?: () => void
  editable?: boolean
}

export default function EditorClient({
  content,
  onChange,
  isSaving: externalIsSaving,
  onSavingChange,
  onDraftSaved,
  editable = true
}: EditorClientProps) {
  const router = useRouter()
  const [tags, setTags] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  
  // Use external saving state if provided, otherwise manage internally
  const [internalIsSaving, setInternalIsSaving] = useState(false)
  const isSaving = externalIsSaving !== undefined ? externalIsSaving : internalIsSaving
  const setIsSaving = onSavingChange || setInternalIsSaving

  // Animation on mount
  useEffect(() => {
    setIsLoaded(true)
  }, [])

  const handleSave = useCallback(async (publish: boolean = false) => {
    const title = extractTitleFromContent(content)
    if (!title.trim()) {
      setError('Title is required')
      return
    }

    setIsSaving(true)
    setError(null)

    try {
      const slug = generateSlug(title)
      const cleanedContent = cleanEditorContent(content)
      const response = await fetch('/api/posts/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: title.trim(),
          slug,
          tags,
          content: cleanedContent,
          published: publish,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to save post')
      }

      const post = await response.json()
      
      if (publish) {
        // Redirect immediately to the new post without delay
        router.push(`/blog/${post.slug}`)
      } else {
        // For drafts, stay on page and notify parent
        setIsSaving(false)
        onDraftSaved?.()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      setIsSaving(false)
    }
  }, [content, tags, router, setIsSaving, onDraftSaved])

  // Keyboard shortcuts: Cmd/Ctrl+S = Save draft, Cmd/Ctrl+Enter = Publish
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const meta = e.metaKey || e.ctrlKey
      if (meta && e.key.toLowerCase() === 's') {
        e.preventDefault()
        if (!isSaving) handleSave(false)
      }
      if (meta && e.key === 'Enter') {
        e.preventDefault()
        if (!isSaving) handleSave(true)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [isSaving, handleSave])

  const extractTitleFromContent = (html: string): string => {
    const parser = new DOMParser()
    const doc = parser.parseFromString(html, 'text/html')
    const firstH1 = doc.querySelector('h1')
    return firstH1?.textContent?.trim() || ''
  }

  const cleanEditorContent = (html: string): string => {
    const parser = new DOMParser()
    const doc = parser.parseFromString(html, 'text/html')
    
    // Remove the first H1 element
    const firstH1 = doc.querySelector('h1')
    if (firstH1) {
      firstH1.remove()
    }
    
    // Return the cleaned HTML
    return doc.body.innerHTML.trim() || '<p></p>'
  }

  return (
    <>
      <div className="w-full h-full flex flex-col">
        <div className={`flex-1 w-full flex flex-col transition-opacity duration-600 ease-out transition-transform duration-1000 ease-out ${
          isLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
        }`}>
          <TiptapEditor
            tags={tags}
            onTagsChange={setTags}
            content={content}
            onChange={onChange}
            editable={editable}
          />
        </div>

        {/* Messages */}
        {error && (
          <div className="w-full px-4 mb-4">
            <div className="p-4 bg-red-900/20 border border-red-700 rounded-md text-red-400">
              {error}
            </div>
          </div>
        )}
      </div>
    </>
  )
}

