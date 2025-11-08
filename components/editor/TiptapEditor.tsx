'use client'

import { SimpleEditor } from '@/components/tiptap-templates/simple/simple-editor'

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
  return (
    <SimpleEditor 
      content={content}
      onChange={onChange}
      editable={editable}
    />
  )
}

