'use client'

import { useRef, useState, useCallback } from 'react'
import type { Editor } from '@tiptap/core'
import { clsx } from 'clsx'

interface ImageUploadButtonProps {
  editor: Editor
  buttonClass: (active: boolean) => string
}

export default function ImageUploadButton({ editor, buttonClass }: ImageUploadButtonProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const handleFileSelect = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file')
      return
    }

    setIsUploading(true)
    setError(null)
    setUploadProgress(0)

    try {
      const formData = new FormData()
      formData.append('file', file)

      // Use fetch with progress tracking (basic implementation)
      const xhr = new XMLHttpRequest()

      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const percentComplete = (e.loaded / e.total) * 100
          setUploadProgress(percentComplete)
        }
      })

      const response = await new Promise<{ url: string; filename: string }>((resolve, reject) => {
        xhr.addEventListener('load', () => {
          if (xhr.status === 200) {
            try {
              const data = JSON.parse(xhr.responseText)
              resolve(data)
            } catch {
              reject(new Error('Invalid response from server'))
            }
          } else {
            try {
              const error = JSON.parse(xhr.responseText)
              reject(new Error(error.error || 'Upload failed'))
            } catch {
              reject(new Error(`Upload failed with status ${xhr.status}`))
            }
          }
        })

        xhr.addEventListener('error', () => {
          reject(new Error('Network error during upload'))
        })

        xhr.open('POST', '/api/upload/image')
        xhr.send(formData)
      })

      // Insert image into editor
      editor.chain().focus().setImage({ src: response.url }).run()
      
      setUploadProgress(100)
      setTimeout(() => {
        setIsUploading(false)
        setUploadProgress(0)
      }, 500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
      setIsUploading(false)
      setUploadProgress(0)
    }
  }, [editor])

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
    // Reset input so same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()

    const file = e.dataTransfer.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  return (
    <div className="relative">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileInputChange}
        className="hidden"
        disabled={isUploading}
      />
      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={isUploading}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={clsx(
          buttonClass(editor.isActive('image')),
          isUploading && 'opacity-50 cursor-not-allowed'
        )}
        title={isUploading ? 'Uploading...' : 'Upload Image (or drag and drop)'}
      >
        {isUploading ? (
          <span className="flex items-center gap-1">
            <span className="animate-spin">⏳</span>
            {Math.round(uploadProgress)}%
          </span>
        ) : (
          '📤'
        )}
      </button>
      {error && (
        <div className="absolute top-full left-0 mt-1 p-2 bg-red-900 text-red-200 text-xs rounded z-50 whitespace-nowrap">
          {error}
          <button
            onClick={() => setError(null)}
            className="ml-2 text-red-400 hover:text-red-200"
          >
            ×
          </button>
        </div>
      )}
    </div>
  )
}

