# Supabase Storage Setup for Image Uploads

This guide explains how to set up Supabase Storage for the blog image upload feature.

## Prerequisites

- Supabase project created
- Service role key configured in `.env.local`

## Steps

### 1. Create Storage Bucket

1. Go to your Supabase Dashboard
2. Navigate to **Storage** in the left sidebar
3. Click **New bucket**
4. Configure the bucket:
   - **Name**: `blog-images`
   - **Public bucket**: ✅ Enable (so images can be accessed via public URLs)
   - **File size limit**: 5 MB (or adjust as needed)
   - **Allowed MIME types**: `image/jpeg, image/jpg, image/png, image/gif, image/webp`

### 2. Set Up Storage Policies

After creating the bucket, set up Row Level Security (RLS) policies:

#### Policy 1: Allow Public Read Access

```sql
-- Allow anyone to read images
CREATE POLICY "Public images are viewable by everyone"
ON storage.objects FOR SELECT
USING (bucket_id = 'blog-images');
```

#### Policy 2: Allow Authenticated Uploads (Optional)

If you want to restrict uploads to authenticated users only:

```sql
-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'blog-images' 
  AND auth.role() = 'authenticated'
);
```

#### Policy 3: Allow Service Role Uploads (Recommended for Dev Mode)

Since the editor uses the service role key, allow service role to upload:

```sql
-- Allow service role to upload (for dev mode)
CREATE POLICY "Service role can upload images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'blog-images');
```

**Note**: The service role bypasses RLS, so this policy may not be strictly necessary, but it's good practice to define it.

### 3. Verify Setup

1. Test the upload functionality in the editor at `/admin/editor`
2. Check the Storage section in Supabase Dashboard to see uploaded images
3. Verify that uploaded images are accessible via public URLs

## Image Processing

The upload API automatically:
- Resizes images to a maximum width of 1200px (maintains aspect ratio)
- Converts images to WebP format for better compression
- Validates file type and size before upload

## Troubleshooting

### Images not uploading

- Check that the bucket name matches exactly: `blog-images`
- Verify the service role key is set in `.env.local`
- Check browser console for error messages
- Verify storage policies are set correctly

### Images not displaying

- Ensure the bucket is set to **Public**
- Check that the public URL is being returned correctly
- Verify CORS settings if accessing from a different domain

### Sharp not working

If you see warnings about `sharp` not being available:
- Run `npm install` to ensure sharp is installed
- Sharp is required for image resizing and format conversion
- Without sharp, images will be uploaded as-is (not recommended for production)

## File Structure

Uploaded images are stored with the following structure:
```
blog-images/
  ├── {timestamp}-{random}.webp
  ├── {timestamp}-{random}.webp
  └── ...
```

Each file has a unique name based on timestamp and random string to prevent collisions.

