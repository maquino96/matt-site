import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase/server'
import { verifyAdminSession } from '@/lib/auth/admin-auth'
import { supabaseAdmin } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const includeDrafts = searchParams.get('published')?.toLowerCase() === 'false'

    let query = supabaseServer
      .from('posts')
      .select('*')
      .order('date', { ascending: false })

    if (includeDrafts) {
      // Fetch only unpublished posts when published=false is specified
      // Admin authentication check for draft requests
      const isAdmin = await verifyAdminSession()
      if (!isAdmin) {
        return NextResponse.json(
          { error: 'Unauthorized: Only admins can access draft posts' },
          { status: 401 }
        )
      }
      query = supabaseAdmin
        .from('posts')
        .select('*')
        .eq('published', false)
        .order('date', { ascending: false })
    } else {
      // Default behavior: fetch only published posts
      query = query.eq('published', true)
    }

    const { data, error } = await query

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch posts', details: error.message },
        { status: 500 }
      )
    }
    return NextResponse.json(data || [])
  } catch (error) {
    console.error('Error fetching posts:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

