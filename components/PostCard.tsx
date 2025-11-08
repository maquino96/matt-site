'use client'

import Link from 'next/link'
import { format } from 'date-fns'
import type { Post } from '@/lib/posts'
import DeletePostButton from './DeletePostButton'

interface PostCardProps {
  post: Post
  showDelete?: boolean
}

// Check if post content contains images
// Note: This is a simple check for UI purposes. The actual image cleanup
// in the API route uses content_html which has the full HTML with img tags.
function hasImages(post: Post): boolean {
  const content = post.content || ''
  // Check for HTML img tags
  if (/<img[^>]+src/i.test(content)) return true
  // Check for markdown image syntax ![alt](url)
  if (/!\[[^\]]*\]\([^)]+\)/.test(content)) return true
  return false
}

export default function PostCard({ post, showDelete = false }: PostCardProps) {
  const formattedDate = post.date ? format(new Date(post.date), 'MMMM d, yyyy') : ''
  const postHasImages = hasImages(post)

  return (
    <article className="bg-primary-800 rounded-lg p-6 hover:bg-primary-700 transition-colors border border-primary-700 relative">
      {showDelete && post.id && (
        <div className="absolute top-4 right-4">
          <DeletePostButton 
            postId={post.id} 
            postTitle={post.title}
            hasImages={postHasImages}
          />
        </div>
      )}
      <Link 
        href={`/blog/${post.slug}`}
        className="block focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-primary-800 rounded"
      >
        <h2 className="text-2xl font-bold text-accent mb-2 hover:underline pr-8">
          {post.title}
        </h2>
        {formattedDate && (
          <time 
            dateTime={post.date} 
            className="text-sm text-gray-400 block mb-3"
          >
            {formattedDate}
          </time>
        )}
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="px-2 py-1 text-xs bg-primary-700 text-accent rounded"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </Link>
    </article>
  )
}

