/**
 * Utility functions for extracting and cleaning up images from blog posts
 */

/**
 * Extract image URLs from HTML content
 */
export function extractImageUrls(html: string): string[] {
  if (!html) return []

  const imgRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi
  const urls: string[] = []
  let match

  while ((match = imgRegex.exec(html)) !== null) {
    if (match[1]) {
      urls.push(match[1])
    }
  }

  return urls
}

/**
 * Check if a URL is from Supabase Storage blog-images bucket
 */
export function isSupabaseStorageUrl(url: string): boolean {
  if (!url) return false
  
  // Check if URL contains Supabase storage domain and blog-images bucket
  // Supabase storage URLs typically look like:
  // https://{project}.supabase.co/storage/v1/object/public/blog-images/{filename}
  const supabaseStoragePattern = /\/storage\/v1\/object\/public\/blog-images\//
  return supabaseStoragePattern.test(url)
}

/**
 * Extract file path from Supabase Storage URL
 * Example: https://xxx.supabase.co/storage/v1/object/public/blog-images/timestamp-random.webp
 * Returns: blog-images/timestamp-random.webp (full path as stored in bucket)
 */
export function extractStoragePath(url: string): string | null {
  if (!isSupabaseStorageUrl(url)) return null

  try {
    const urlObj = new URL(url)
    // Extract path after /public/
    const publicIndex = urlObj.pathname.indexOf('/public/')
    if (publicIndex === -1) return null
    
    // Return the full path including bucket name (as it was stored)
    const path = urlObj.pathname.substring(publicIndex + '/public/'.length)
    return path || null
  } catch {
    return null
  }
}

/**
 * Extract all Supabase Storage image paths from HTML content
 */
export function extractStorageImagePaths(html: string): string[] {
  const urls = extractImageUrls(html)
  const paths: string[] = []

  for (const url of urls) {
    if (isSupabaseStorageUrl(url)) {
      const path = extractStoragePath(url)
      if (path) {
        paths.push(path)
      }
    }
  }

  return paths
}

