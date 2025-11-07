'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import { extensions } from '@/lib/tiptap/extensions'
import Toolbar from './Toolbar'
import { useEffect } from 'react'

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

  if (!editor) {
    return (
      <div className="bg-primary-900 border border-primary-700 rounded-lg p-4 min-h-[400px] flex items-center justify-center">
        <div className="text-gray-400">Loading editor...</div>
      </div>
    )
  }

  return (
    <div className="bg-primary-900 border border-primary-700 rounded-lg overflow-hidden">
      {editable && <Toolbar editor={editor} />}
      <EditorContent 
        editor={editor}
        className="text-gray-100"
      />
    </div>
  )
}

