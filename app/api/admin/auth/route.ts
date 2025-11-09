import { NextRequest, NextResponse } from 'next/server'
import { verifyPassword, createSessionToken } from '@/lib/auth/admin-auth'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { password } = body

    if (!password) {
      return NextResponse.json(
        { error: 'Password is required' },
        { status: 400 }
      )
    }

    // Verify password
    const isValid = await verifyPassword(password)

    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid password' },
        { status: 401 }
      )
    }

    // Create session token
    const token = createSessionToken()

    // Create response with session cookie
    const response = NextResponse.json(
      { success: true },
      { status: 200 }
    )

    // Set httpOnly cookie that expires when browser closes
    response.cookies.set('admin_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      // No maxAge = session cookie (expires when browser closes)
    })

    return response
  } catch (error) {
    console.error('[Auth API] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

