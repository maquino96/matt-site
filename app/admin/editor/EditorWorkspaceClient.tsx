'use client'

import { useState, useCallback, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import EditorClient from './EditorClient'
import ThinSideNav from '@/components/nav/ThinSideNav'
import { Provider } from '@/components/ui/provider'
import { Post } from '@/components/nav/ThinSideNav'

export default function EditorWorkspaceClient() {
  const [content, setContent] = useState('<h1 style="text-align: center;"></h1><p></p>')
  const [isSaving, setIsSaving] = useState(false)
  const [isLoadingDraft, setIsLoadingDraft] = useState(false)
  const [refetchDrafts, setRefetchDrafts] = useState<() => void>(() => {})
  const router = useRouter()
  const searchParams = useSearchParams()
  const draftId = searchParams.get('draftId')

  // Load draft by ID on page load if draftId param is present
  useEffect(() => {
    if (draftId) {
      loadDraftById(draftId)
    }
  }, [draftId])

  const loadDraftById = useCallback(async (id: string) => {
    setIsLoadingDraft(true)
    try {
      const response = await fetch(`/api/posts/${id}`)
      if (!response.ok) {
        throw new Error('Failed to fetch draft')
      }
      const post: Post = await response.json()
      
      // Build the editor content structure
      const editorHtml = buildEditorHtmlFromPost(post)
      
      // Set the content after a brief delay to ensure loading state is visible
      setTimeout(() => {
        setContent(editorHtml)
        setIsLoadingDraft(false)
        // Clean URL by removing draftId param
        router.replace('/admin/editor')
      }, 100)
    } catch (error) {
      console.error('Error loading draft:', error)
      setIsLoadingDraft(false)
      // Clean URL even on error
      router.replace('/admin/editor')
    }
  }, [router])

  const handleDraftSelect = useCallback(async (post: Post) => {
    setIsLoadingDraft(true)
    
    // Build the editor content structure: H1 title + blank line + HR + content
    const editorHtml = buildEditorHtmlFromPost(post)
    
    // Set the content after a brief delay to ensure loading state is visible
    setTimeout(() => {
      setContent(editorHtml)
      setIsLoadingDraft(false)
    }, 100)
  }, [])

  const handleDraftSaved = useCallback(() => {
    // Trigger refetch of drafts in the nav
    refetchDrafts()
  }, [refetchDrafts])

  const handleSetRefetchDrafts = useCallback((refetchFn: () => void) => {
    setRefetchDrafts(() => refetchFn)
  }, [])

  // Add useEffect import if not already present
  useEffect(() => {
    if (draftId) {
      loadDraftById(draftId)
    }
  }, [draftId, loadDraftById])

  return (
    <>
      <Provider>
        <ThinSideNav 
          onDraftSelect={handleDraftSelect}
          setRefetchDrafts={handleSetRefetchDrafts}
        />
        {/* Other themed chrome goes here */}
      </Provider>

      {/* Editor with loading overlay */}
      <div className="relative w-full h-full">
        {isLoadingDraft && (
          <div className="absolute inset-0 bg-primary-900/80 flex items-center justify-center z-50">
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
              <p className="mt-4 text-gray-300">Loading draft...</p>
            </div>
          </div>
        )}
        
        <EditorClient
          content={content}
          onChange={setContent}
          isSaving={isSaving}
          onSavingChange={setIsSaving}
          onDraftSaved={handleDraftSaved}
          editable={!isSaving && !isLoadingDraft}
        />
      </div>
    </>
  )
}

function buildEditorHtmlFromPost(post: { title: string; content: string; content_html?: string }): string {
  // Escape HTML to prevent XSS
  const escapedTitle = escapeHtml(post.title)
  const h1 = `<h1 style="text-align: center;">${escapedTitle}</h1>`
  
  // Structure: H1 title + blank paragraph + horizontal rule + blank paragraph + content
  const postContent = post.content_html ?? post.content ?? '<p></p>'
  return `${h1}<p></p><hr /><p></p>${postContent}`
}

function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}
