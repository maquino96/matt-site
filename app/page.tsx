import { Metadata } from 'next'
import Link from 'next/link'
import { getLatestPostsUnified } from '@/lib/posts'
import PostCard from '@/components/PostCard'

export const metadata: Metadata = {
  title: 'Home',
  description: 'Personal profile and blog site',
  openGraph: {
    title: 'Matt Site - Personal Profile & Blog',
    description: 'Personal profile and blog site',
  },
}

export default async function HomePage() {
  const latestPosts = await getLatestPostsUnified(3)

  return (
    <div className="container-content py-12">
      <section className="mb-16">
        <h1 className="text-5xl font-bold text-accent mb-6">
          Welcome to My Site
        </h1>
        <p className="text-xl text-gray-300 mb-6 leading-relaxed">
          {`I'm a developer passionate about building web applications and sharing
          knowledge. This site serves as both a portfolio and a blog.`}
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            href="/profile"
            className="btn btn-primary inline-block text-center"
          >
            Learn More About Me
          </Link>
          <Link
            href="/blog"
            className="btn btn-secondary inline-block text-center"
          >
            Read My Blog
          </Link>
        </div>
      </section>

      {latestPosts.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-3xl font-bold text-accent">Latest Posts</h2>
            <Link
              href="/blog"
              className="text-accent hover:text-accent/80 underline underline-offset-4 transition-colors"
            >
              View All →
            </Link>
          </div>
          <div className="space-y-6">
            {latestPosts.map((post) => (
              <PostCard key={post.slug} post={post} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

