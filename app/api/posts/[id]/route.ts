import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import { generateSlug, htmlToMarkdown } from '@/lib/tiptap/utils'
import { extractStorageImagePaths } from '@/lib/utils/image-cleanup'

// Check if editor is enabled
function isEditorEnabled(): boolean {
  return (
    process.env.NEXT_PUBLIC_ENABLE_EDITOR === 'true' ||
    process.env.NODE_ENV === 'development'
  )
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!isEditorEnabled()) {
    return NextResponse.json(
      { error: 'Editor is not enabled' },
      { status: 403 }
    )
  }

  try {
    const body = await request.json()
    const { title, slug: providedSlug, tags, summary, content, published } = body

    if (!title || !content) {
      return NextResponse.json(
        { error: 'Title and content are required' },
        { status: 400 }
      )
    }

    const slug = providedSlug || generateSlug(title)

    // Check if slug is taken by another post
    const { data: existingPost } = await supabaseAdmin
      .from('posts')
      .select('id')
      .eq('slug', slug)
      .neq('id', params.id)
      .single()

    if (existingPost) {
      return NextResponse.json(
        { error: 'A post with this slug already exists' },
        { status: 409 }
      )
    }

    const markdown = htmlToMarkdown(content)

    const { data, error } = await supabaseAdmin
      .from('posts')
      .update({
        slug,
        title: title.trim(),
        tags: tags || [],
        summary: summary?.trim() || null,
        content: markdown,
        content_html: content,
        published: published || false,
      })
      .eq('id', params.id)
      .select()
      .single()

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json(
        { error: 'Failed to update post', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error updating post:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!isEditorEnabled()) {
    return NextResponse.json(
      { error: 'Editor is not enabled' },
      { status: 403 }
    )
  }

  try {
    // First, fetch the post to get its content for image cleanup
    const { data: post, error: fetchError } = await supabaseAdmin
      .from('posts')
      .select('id, content_html')
      .eq('id', params.id)
      .single()

    if (fetchError) {
      console.error('[Delete] Error fetching post:', fetchError)
      return NextResponse.json(
        { error: 'Failed to fetch post', details: fetchError.message },
        { status: 500 }
      )
    }

    if (!post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      )
    }

    // Extract and delete associated images
    if (post.content_html) {
      const imagePaths = extractStorageImagePaths(post.content_html)
      
      if (imagePaths.length > 0) {
        console.log(`[Delete] Found ${imagePaths.length} images to delete for post ${params.id}`)
        
        // Delete images from storage
        const { error: storageError } = await supabaseAdmin.storage
          .from('blog-images')
          .remove(imagePaths)

        if (storageError) {
          // Log error but don't fail the post deletion
          console.error('[Delete] Error deleting images from storage:', storageError)
          console.error('[Delete] Image paths that failed:', imagePaths)
        } else {
          console.log(`[Delete] Successfully deleted ${imagePaths.length} images from storage`)
        }
      }
    }

    // Delete the post
    const { error: deleteError } = await supabaseAdmin
      .from('posts')
      .delete()
      .eq('id', params.id)

    if (deleteError) {
      console.error('[Delete] Supabase error deleting post:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete post', details: deleteError.message },
        { status: 500 }
      )
    }

    console.log(`[Delete] Successfully deleted post ${params.id}`)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Delete] Error deleting post:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

