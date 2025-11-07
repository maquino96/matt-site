'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import { extensions } from '@/lib/tiptap/extensions'
import Toolbar from './Toolbar'
import { useEffect, useCallback } from 'react'

interface TiptapEditorProps {
  content: string
  onChange: (content: string) => void
  editable?: boolean
}

export default function TiptapEditor({ 
  content, 
  onChange, 
  editable = true 
}: TiptapEditorProps) {
  const editor = useEditor({
    extensions,
    content,
    editable,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class: 'prose prose-invert max-w-none focus:outline-none min-h-[400px] p-4',
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
      <div className="bg-primary-900 border border-primary-700 rounded-lg p-4 min-h-[400px] flex items-center justify-center">
        <div className="text-gray-400">Loading editor...</div>
      </div>
    )
  }

  return (
    <div 
      className="bg-primary-900 border border-primary-700 rounded-lg overflow-hidden"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      {editable && <Toolbar editor={editor} />}
      <EditorContent 
        editor={editor}
        className="text-gray-100"
      />
    </div>
  )
}

