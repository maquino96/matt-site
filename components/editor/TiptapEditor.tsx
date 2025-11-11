'use client'

import { SimpleEditor } from '@/components/tiptap-templates/simple/simple-editor'

interface TiptapEditorProps {
  tags: string[]
  onTagsChange: (tags: string[]) => void
  content: string
  onChange: (content: string) => void
  editable?: boolean
}

export default function TiptapEditor({ 
  tags, // eslint-disable-line @typescript-eslint/no-unused-vars
  onTagsChange, // eslint-disable-line @typescript-eslint/no-unused-vars
  content, 
  onChange, 
  editable = true 
}: TiptapEditorProps) {
  return (
    <div className="flex flex-col gap-4 h-full relative">
      {/* The existing TipTap editor area */}
      <div className="flex-1 min-h-0 relative">
        <SimpleEditor 
          content={content}
          onChange={onChange}
          editable={editable}
          borderless={true}
          fullHeight={true}
        />
        
        {/* Loading overlay when not editable */}
        {!editable && (
          <div className="absolute inset-0 bg-primary-900/80 flex items-center justify-center z-50">
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
              <p className="mt-4 text-gray-300">Saving...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

