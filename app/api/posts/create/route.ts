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

export async function POST(request: NextRequest) {
  // Check if editor is enabled
  if (!isEditorEnabled()) {
    return NextResponse.json(
      { error: 'Editor is not enabled' },
      { status: 403 }
    )
  }

  try {
    const body = await request.json()
    const { title, slug: providedSlug, tags, summary, content, published } = body

    // Validate required fields
    if (!title || !content) {
      return NextResponse.json(
        { error: 'Title and content are required' },
        { status: 400 }
      )
    }

    // Generate slug if not provided
    const slug = providedSlug || generateSlug(title)

    // Check if slug already exists
    const { data: existingPost } = await supabaseAdmin
      .from('posts')
      .select('id')
      .eq('slug', slug)
      .single()

    if (existingPost) {
      return NextResponse.json(
        { error: 'A post with this slug already exists' },
        { status: 409 }
      )
    }

    // Convert HTML to markdown for storage
    const markdown = htmlToMarkdown(content)

    // Insert post into Supabase
    const { data, error } = await supabaseAdmin
      .from('posts')
      .insert({
        slug,
        title: title.trim(),
        tags: tags || [],
        summary: summary?.trim() || null,
        content: markdown, // Store as markdown
        content_html: content, // Also store HTML for quick rendering
        published: published || false,
        date: new Date().toISOString().split('T')[0],
      })
      .select()
      .single()

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json(
        { error: 'Failed to create post', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error('Error creating post:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

