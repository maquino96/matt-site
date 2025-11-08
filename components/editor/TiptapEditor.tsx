'use client'

import { EditorContent, useEditor } from '@tiptap/react'
import { extensions } from '@/lib/tiptap/extensions'
import Toolbar from './Toolbar'
import { useEffect, useCallback, useState } from 'react'

interface TiptapEditorProps {
  content: string
  onChange: (content: string) => void
  editable?: boolean
}

// Detect theme preference
function useTheme() {
  const [isDark, setIsDark] = useState(true) // Default to dark

  useEffect(() => {
    // Check for dark mode class on html element
    const htmlElement = document.documentElement
    const checkTheme = () => {
      // Check if html has dark class or if system prefers dark
      const hasDarkClass = htmlElement.classList.contains('dark')
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      setIsDark(hasDarkClass || (!htmlElement.classList.contains('light') && prefersDark))
    }

    checkTheme()

    // Watch for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = () => checkTheme()
    mediaQuery.addEventListener('change', handleChange)

    // Watch for class changes on html element
    const observer = new MutationObserver(checkTheme)
    observer.observe(htmlElement, {
      attributes: true,
      attributeFilter: ['class'],
    })

    return () => {
      mediaQuery.removeEventListener('change', handleChange)
      observer.disconnect()
    }
  }, [])

  return isDark
}

export default function TiptapEditor({ 
  content, 
  onChange, 
  editable = true 
}: TiptapEditorProps) {
  const isDark = useTheme()

  const editor = useEditor({
    extensions,
    content,
    editable,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class: `prose max-w-none focus:outline-none min-h-[400px] p-4 ${
          isDark ? 'prose-invert' : 'prose-slate'
        }`,
      },
    },
  })

  // Update editor content when prop changes
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content)
    }
  }, [content, editor])

  // Handle drag and drop for image uploads
  const handleDrop = useCallback(async (e: React.DragEvent) => {
    if (!editable || !editor) return

    const file = e.dataTransfer.files?.[0]
    if (!file || !file.type.startsWith('image/')) return

    e.preventDefault()
    e.stopPropagation()

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/upload/image', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Upload failed')
      }

      const data = await response.json()
      editor.chain().focus().setImage({ src: data.url }).run()
    } catch (err) {
      console.error('Error uploading image:', err)
      // Could show a toast notification here
    }
  }, [editable, editor])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    if (!editable) return
    e.preventDefault()
    e.stopPropagation()
  }, [editable])

  if (!editor) {
    return (
      <div className={`${
        isDark 
          ? 'bg-primary-900 border-primary-700 text-gray-400' 
          : 'bg-white border-gray-300 text-gray-600'
      } border rounded-lg p-4 min-h-[400px] flex items-center justify-center`}>
        <div>Loading editor...</div>
      </div>
    )
  }

  return (
    <div 
      className={`${
        isDark 
          ? 'bg-primary-900 border-primary-700' 
          : 'bg-white border-gray-300'
      } border rounded-lg overflow-hidden`}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      {editable && <Toolbar editor={editor} isDark={isDark} />}
      <EditorContent 
        editor={editor}
        className={isDark ? 'text-gray-100' : 'text-gray-900'}
      />
    </div>
  )
}

