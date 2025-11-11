'use client'

import { useState, KeyboardEvent } from 'react'

interface TagInputProps {
  tags: string[]
  onChange: (tags: string[]) => void
  disabled?: boolean
}

export default function TagInput({ tags, onChange, disabled = false }: TagInputProps) {
  const [inputValue, setInputValue] = useState('')

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return
    
    if (e.key === 'Enter' && inputValue.trim()) {
      e.preventDefault()
      const newTag = inputValue.trim().toLowerCase()
      if (!tags.includes(newTag)) {
        onChange([...tags, newTag])
      }
      setInputValue('')
    } else if (e.key === 'Backspace' && inputValue === '' && tags.length > 0) {
      // Remove last tag when backspace is pressed on empty input
      onChange(tags.slice(0, -1))
    }
  }

  const removeTag = (tagToRemove: string) => {
    if (disabled) return
    onChange(tags.filter(tag => tag !== tagToRemove))
  }

  return (
    <div className="space-y-2">
      <label className="block text-lg font-semibold text-gray-300 mb-2">
        Tags
      </label>
      
      {/* Fixed-size input container */}
      <div className="p-2 bg-primary-800/30 rounded-md" style={{ backgroundColor: '#0A2138' }}>
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={tags.length === 0 ? 'Add tags (press Enter)' : ''}
          className="w-full bg-transparent border-none outline-none text-gray-100 placeholder-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={disabled}
        />
      </div>

      {/* Chips displayed below in their own row */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 px-2 py-1 bg-primary-800 text-accent rounded text-sm disabled:opacity-50"
              style={{ backgroundColor: '#08263C' }}
            >
              {tag}
              <button
                onClick={() => removeTag(tag)}
                className="text-accent hover:text-accent/80 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label={`Remove ${tag}`}
                disabled={disabled}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
      
      <p className="text-xs text-gray-400">
        Press Enter to add a tag. Tags are automatically lowercased.
      </p>
    </div>
  )
}

