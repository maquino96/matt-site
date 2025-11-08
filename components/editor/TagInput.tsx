'use client'

import { useState, KeyboardEvent } from 'react'

interface TagInputProps {
  tags: string[]
  onChange: (tags: string[]) => void
}

export default function TagInput({ tags, onChange }: TagInputProps) {
  const [inputValue, setInputValue] = useState('')

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
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
    onChange(tags.filter(tag => tag !== tagToRemove))
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-300">
        Tags
      </label>
      <div className="flex flex-wrap gap-2 p-2 bg-primary-900 border border-primary-700 rounded-md min-h-[42px] focus-within:ring-2 focus-within:ring-accent">
        {tags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 px-2 py-1 bg-primary-800 text-accent rounded text-sm"
          >
            {tag}
            <button
              onClick={() => removeTag(tag)}
              className="text-accent hover:text-accent/80 focus:outline-none"
              aria-label={`Remove ${tag}`}
            >
              ×
            </button>
          </span>
        ))}
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={tags.length === 0 ? 'Add tags (press Enter)' : ''}
          className="flex-1 bg-transparent border-none outline-none text-gray-100 placeholder-gray-500 min-w-[120px]"
        />
      </div>
      <p className="text-xs text-gray-400">
        Press Enter to add a tag. Tags are automatically lowercased.
      </p>
    </div>
  )
}

