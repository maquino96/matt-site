import Link from 'next/link'
import { format } from 'date-fns'
import type { Post } from '@/lib/posts'

interface PostCardProps {
  post: Post
}

export default function PostCard({ post }: PostCardProps) {
  const formattedDate = post.date ? format(new Date(post.date), 'MMMM d, yyyy') : ''

  return (
    <article className="bg-primary-800 rounded-lg p-6 hover:bg-primary-700 transition-colors border border-primary-700">
      <Link 
        href={`/blog/${post.slug}`}
        className="block focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-primary-800 rounded"
      >
        <h2 className="text-2xl font-bold text-accent mb-2 hover:underline">
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
        {post.summary && (
          <p className="text-gray-300 mb-4 line-clamp-3">
            {post.summary}
          </p>
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

