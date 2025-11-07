import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import { supabaseServer } from './supabase/server'

const postsDirectory = path.join(process.cwd(), 'posts')

// Determine data source dynamically
function getDataSource(): 'supabase' | 'filesystem' {
  const source = process.env.NEXT_PUBLIC_DATA_SOURCE || 'filesystem'
  const resolved = source === 'supabase' ? 'supabase' : 'filesystem'
  
  // Log in all environments (production included)
  console.log(`[Posts] Data source: ${resolved}`)
  
  return resolved
}

export interface Post {
  id?: string // Optional: only available for Supabase posts
  slug: string
  title: string
  date: string
  tags: string[]
  summary: string
  content: string
}

// Supabase Post interface (includes additional fields)
interface SupabasePost {
  id: string
  slug: string
  title: string
  date: string
  tags: string[]
  summary: string | null
  content: string
  content_html: string | null
  published: boolean
  created_at: string
  updated_at: string
}

export function getPostSlugs(): string[] {
  if (!fs.existsSync(postsDirectory)) {
    return []
  }
  return fs.readdirSync(postsDirectory)
    .filter((file) => file.endsWith('.mdx'))
    .map((file) => file.replace(/\.mdx$/, ''))
}

export function getPostBySlug(slug: string): Post | null {
  try {
    const fullPath = path.join(postsDirectory, `${slug}.mdx`)
    if (!fs.existsSync(fullPath)) {
      console.log(`[Posts] Post not found in filesystem: ${slug}`)
      return null
    }
    const fileContents = fs.readFileSync(fullPath, 'utf8')
    const { data, content } = matter(fileContents)

    console.log(`[Posts] Fetched post from filesystem: ${slug}`)
    return {
      slug,
      title: data.title || '',
      date: data.date || '',
      tags: data.tags || [],
      summary: data.summary || '',
      content,
    }
  } catch (error) {
    console.error(`[Posts] Error reading post ${slug} from filesystem:`, error)
    throw new Error(`Failed to read post from filesystem: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

export function getAllPosts(): Post[] {
  const slugs = getPostSlugs()
  const posts = slugs
    .map((slug) => getPostBySlug(slug))
    .filter((post): post is Post => post !== null)
    .sort((a, b) => {
      if (a.date < b.date) {
        return 1
      } else {
        return -1
      }
    })

  console.log(`[Posts] Fetched ${posts.length} posts from filesystem`)
  return posts
}

export function getLatestPosts(count: number = 5): Post[] {
  return getAllPosts().slice(0, count)
}

// Supabase functions
function convertSupabasePost(post: SupabasePost): Post {
  return {
    id: post.id,
    slug: post.slug,
    title: post.title,
    date: post.date,
    tags: post.tags || [],
    summary: post.summary || '',
    content: post.content, // Use markdown content
  }
}

export async function getAllPostsFromSupabase(includeUnpublished: boolean = false): Promise<Post[]> {
  let query = supabaseServer
    .from('posts')
    .select('*')
  
  if (!includeUnpublished) {
    query = query.eq('published', true)
  }
  
  const { data, error } = await query.order('date', { ascending: false })

  if (error) {
    console.error('[Posts] Supabase error fetching all posts:', error)
    throw new Error(`Failed to fetch posts from Supabase: ${error.message}`)
  }

  if (!data) {
    console.warn('[Posts] No data returned from Supabase')
    return []
  }

  console.log(`[Posts] Fetched ${data.length} posts from Supabase${includeUnpublished ? ' (including unpublished)' : ''}`)
  return data.map(convertSupabasePost)
}

export async function getPostBySlugFromSupabase(slug: string): Promise<Post | null> {
  const { data, error } = await supabaseServer
    .from('posts')
    .select('*')
    .eq('slug', slug)
    .eq('published', true)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      // No rows returned - post not found (this is expected, not an error)
      console.log(`[Posts] Post not found in Supabase: ${slug}`)
      return null
    }
    console.error(`[Posts] Supabase error fetching post '${slug}':`, error)
    throw new Error(`Failed to fetch post from Supabase: ${error.message}`)
  }

  if (!data) {
    return null
  }

  console.log(`[Posts] Fetched post from Supabase: ${slug}`)
  return convertSupabasePost(data)
}

export async function getLatestPostsFromSupabase(count: number = 5): Promise<Post[]> {
  // Query directly with limit for better performance and freshness
  // Sort by created_at for most recently created posts (when they were added to the database)
  let query = supabaseServer
    .from('posts')
    .select('*')
    .eq('published', true)
    .order('created_at', { ascending: false })
    .limit(count)

  const { data, error } = await query

  if (error) {
    console.error('[Posts] Supabase error fetching latest posts:', error)
    throw new Error(`Failed to fetch latest posts from Supabase: ${error.message}`)
  }

  if (!data) {
    console.warn('[Posts] No data returned from Supabase for latest posts')
    return []
  }

  console.log(`[Posts] Fetched ${data.length} latest posts from Supabase`)
  return data.map(convertSupabasePost)
}

// Unified functions that use the configured data source
export async function getAllPostsUnified(includeUnpublished: boolean = false): Promise<Post[]> {
  const source = getDataSource()
  if (source === 'supabase') {
    return getAllPostsFromSupabase(includeUnpublished)
  }
  return getAllPosts()
}

export async function getPostBySlugUnified(slug: string): Promise<Post | null> {
  const source = getDataSource()
  if (source === 'supabase') {
    return getPostBySlugFromSupabase(slug)
  }
  return getPostBySlug(slug)
}

export async function getLatestPostsUnified(count: number = 5): Promise<Post[]> {
  const source = getDataSource()
  if (source === 'supabase') {
    return getLatestPostsFromSupabase(count)
  }
  return getLatestPosts(count)
}

// Export data source for UI indicator (dev mode only)
export function getDataSourceInfo(): { source: 'supabase' | 'filesystem'; envVar: string | undefined } {
  return {
    source: getDataSource(),
    envVar: process.env.NEXT_PUBLIC_DATA_SOURCE,
  }
}

