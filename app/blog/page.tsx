import { Metadata } from 'next'
import { getAllPostsUnified } from '@/lib/posts'
import PostCard from '@/components/PostCard'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Blog',
  description: 'Blog posts and articles',
  openGraph: {
    title: 'Blog | Matt Site',
    description: 'Blog posts and articles',
  },
}

// Force dynamic rendering to ensure posts list is always fresh
export const dynamic = 'force-dynamic'
export const revalidate = 0

// Check if editor is enabled
function isEditorEnabled(): boolean {
  return (
    process.env.NEXT_PUBLIC_ENABLE_EDITOR === 'true' ||
    process.env.NODE_ENV === 'development'
  )
}

export default async function BlogPage() {
  const posts = await getAllPostsUnified(isEditorEnabled())

  return (
    <div className="container-content py-12">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-accent mb-4">Blog</h1>
          <p className="text-gray-300 text-lg">
            Thoughts, tutorials, and updates
          </p>
        </div>
        {isEditorEnabled() && (
          <Link
            href="/admin/editor"
            className="btn btn-primary"
          >
            New Post
          </Link>
        )}
      </header>

      {posts.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-400">No blog posts yet. Check back soon!</p>
          {isEditorEnabled() && (
            <Link
              href="/admin/editor"
              className="btn btn-primary mt-4 inline-block"
            >
              Create Your First Post
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {posts.map((post) => (
            <PostCard 
              key={post.slug} 
              post={post} 
              showDelete={isEditorEnabled()}
            />
          ))}
        </div>
      )}
    </div>
  )
}

