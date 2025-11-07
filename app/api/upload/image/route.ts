import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'

// Check if editor is enabled
function isEditorEnabled(): boolean {
  return (
    process.env.NEXT_PUBLIC_ENABLE_EDITOR === 'true' ||
    process.env.NODE_ENV === 'development'
  )
}

// Maximum file size: 5MB
const MAX_FILE_SIZE = 5 * 1024 * 1024
// Maximum image width: 1200px
const MAX_IMAGE_WIDTH = 1200
// Allowed image MIME types
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']

export async function POST(request: NextRequest) {
  if (!isEditorEnabled()) {
    return NextResponse.json(
      { error: 'Editor is not enabled' },
      { status: 403 }
    )
  }

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.' },
        { status: 400 }
      )
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File size exceeds maximum of ${MAX_FILE_SIZE / 1024 / 1024}MB` },
        { status: 400 }
      )
    }

    // Read file buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Process image: resize and convert to WebP
    let processedBuffer: Buffer
    let contentType = 'image/webp'
    let fileExtension = 'webp'

    try {
      // Try to use sharp if available, otherwise use original file
      const sharp = await import('sharp').catch(() => null)
      
      if (sharp) {
        // Resize and convert to WebP
        const image = sharp.default(buffer)
        const metadata = await image.metadata()
        
        // Calculate new dimensions if needed
        let width = metadata.width || MAX_IMAGE_WIDTH
        let height = metadata.height
        
        if (width > MAX_IMAGE_WIDTH) {
          height = Math.round((height || width) * (MAX_IMAGE_WIDTH / width))
          width = MAX_IMAGE_WIDTH
        }

        processedBuffer = await image
          .resize(width, height, {
            fit: 'inside',
            withoutEnlargement: true,
          })
          .webp({ quality: 85 })
          .toBuffer()
      } else {
        // Fallback: use original file if sharp is not available
        // In production, sharp should be installed
        console.warn('[Upload] sharp not available, using original file without processing')
        processedBuffer = buffer
        contentType = file.type
        fileExtension = file.name.split('.').pop() || 'jpg'
      }
    } catch (error) {
      console.error('[Upload] Error processing image:', error)
      return NextResponse.json(
        { error: 'Failed to process image' },
        { status: 500 }
      )
    }

    // Generate unique filename
    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(2, 15)
    const filename = `blog-images/${timestamp}-${randomString}.${fileExtension}`

    // Upload to Supabase Storage
    const { data, error } = await supabaseAdmin.storage
      .from('blog-images')
      .upload(filename, processedBuffer, {
        contentType,
        upsert: false,
      })

    if (error) {
      console.error('[Upload] Supabase storage error:', error)
      return NextResponse.json(
        { error: 'Failed to upload image to storage', details: error.message },
        { status: 500 }
      )
    }

    // Get public URL
    const { data: urlData } = supabaseAdmin.storage
      .from('blog-images')
      .getPublicUrl(filename)

    if (!urlData?.publicUrl) {
      return NextResponse.json(
        { error: 'Failed to get image URL' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      url: urlData.publicUrl,
      filename: data.path,
    })
  } catch (error) {
    console.error('[Upload] Error uploading image:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

