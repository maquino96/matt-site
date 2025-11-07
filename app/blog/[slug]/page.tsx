import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getPostBySlugUnified, getPostSlugs, getAllPostsFromSupabase } from '@/lib/posts'
import { format } from 'date-fns'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface PageProps {
  params: {
    slug: string
  }
}

export async function generateStaticParams() {
  // Try to get slugs from both sources
  const DATA_SOURCE = process.env.NEXT_PUBLIC_DATA_SOURCE || 'filesystem'
  
  if (DATA_SOURCE === 'supabase') {
    try {
      const posts = await getAllPostsFromSupabase()
      return posts.map((post) => ({
        slug: post.slug,
      }))
    } catch (error) {
      console.error('Error generating static params from Supabase:', error)
      return []
    }
  }
  
  // Fallback to filesystem
  const slugs = getPostSlugs()
  return slugs.map((slug) => ({
    slug,
  }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const post = await getPostBySlugUnified(params.slug)

  if (!post) {
    return {
      title: 'Post Not Found',
    }
  }

  return {
    title: post.title,
    description: post.summary,
    openGraph: {
      title: post.title,
      description: post.summary,
      type: 'article',
      publishedTime: post.date,
      tags: post.tags,
    },
    alternates: {
      canonical: `/blog/${post.slug}`,
    },
  }
}

export default async function BlogPostPage({ params }: PageProps) {
  const post = await getPostBySlugUnified(params.slug)

  if (!post) {
    notFound()
  }

  const formattedDate = post.date ? format(new Date(post.date), 'MMMM d, yyyy') : ''

  return (
    <article className="container-content py-12">
      <header className="mb-8">
        <h1 className="text-4xl font-bold text-accent mb-4">{post.title}</h1>
        {formattedDate && (
          <time 
            dateTime={post.date} 
            className="text-sm text-gray-400 block mb-4"
          >
            {formattedDate}
          </time>
        )}
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="px-3 py-1 text-sm bg-primary-800 text-accent rounded border border-primary-700"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </header>

      <div className="prose prose-invert max-w-none">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            h1: ({ children }) => <h1 className="text-4xl font-bold text-accent mt-8 mb-4">{children}</h1>,
            h2: ({ children }) => <h2 className="text-3xl font-bold text-accent mt-6 mb-3">{children}</h2>,
            h3: ({ children }) => <h3 className="text-2xl font-semibold text-gray-200 mt-4 mb-2">{children}</h3>,
            p: ({ children }) => <p className="text-gray-300 mb-4 leading-relaxed">{children}</p>,
            a: ({ href, children }) => (
              <a
                href={href}
                className="text-accent hover:text-accent/80 underline underline-offset-4 transition-colors"
                target={href?.startsWith('http') ? '_blank' : undefined}
                rel={href?.startsWith('http') ? 'noopener noreferrer' : undefined}
              >
                {children}
              </a>
            ),
            ul: ({ children }) => <ul className="list-disc list-inside mb-4 text-gray-300 space-y-2">{children}</ul>,
            ol: ({ children }) => <ol className="list-decimal list-inside mb-4 text-gray-300 space-y-2">{children}</ol>,
            li: ({ children }) => <li className="ml-4">{children}</li>,
            code: ({ className, children }) => {
              const isInline = !className
              return isInline ? (
                <code className="bg-primary-800 text-accent px-1.5 py-0.5 rounded text-sm font-mono">
                  {children}
                </code>
              ) : (
                <code className={className}>{children}</code>
              )
            },
            pre: ({ children }) => (
              <pre className="bg-primary-800 rounded-lg p-4 mb-4 overflow-x-auto border border-primary-700">
                {children}
              </pre>
            ),
            blockquote: ({ children }) => (
              <blockquote className="border-l-4 border-accent pl-4 italic text-gray-400 my-4">
                {children}
              </blockquote>
            ),
            hr: () => <hr className="border-primary-700 my-8" />,
          }}
        >
          {post.content}
        </ReactMarkdown>
      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'BlogPosting',
            headline: post.title,
            datePublished: post.date,
            description: post.summary,
            author: {
              '@type': 'Person',
              name: 'Matt',
            },
          }),
        }}
      />
    </article>
  )
}

