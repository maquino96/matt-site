'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import TiptapEditor from '@/components/editor/TiptapEditor'
import { generateSlug } from '@/lib/tiptap/utils'

export default function EditorClient() {
  const router = useRouter()
  const [tags, setTags] = useState<string[]>([])
  const [content, setContent] = useState('<h1 style="text-align: center;"></h1><p></p>')
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)

  // Animation on mount
  useEffect(() => {
    setIsLoaded(true)
  }, [])

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
  }, [isSaving, content])

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

  const handleSave = async (publish: boolean = false) => {
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
      
      // Redirect immediately to the new post without delay
      router.push(`/blog/${post.slug}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      setIsSaving(false)
    }
  }

  return (
    <div className="w-full h-full flex flex-col">
      <div className={`flex-1 w-full flex flex-col transition-opacity duration-600 ease-out transition-transform duration-1000 ease-out ${
        isLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
      }`}>
        <TiptapEditor
          tags={tags}
          onTagsChange={setTags}
          content={content}
          onChange={setContent}
          editable={!isSaving}
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
  )
}

