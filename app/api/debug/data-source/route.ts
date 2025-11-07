import { NextResponse } from 'next/server'
import { getDataSourceInfo } from '@/lib/posts'

// Only available in development
export async function GET() {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { error: 'Not available in production' },
      { status: 403 }
    )
  }

  const info = getDataSourceInfo()
  return NextResponse.json(info)
}

