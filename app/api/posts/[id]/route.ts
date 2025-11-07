import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import { generateSlug, htmlToMarkdown } from '@/lib/tiptap/utils'

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
    const { error } = await supabaseAdmin
      .from('posts')
      .delete()
      .eq('id', params.id)

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json(
        { error: 'Failed to delete post', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting post:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

