# Supabase Setup Guide

## Quick Start

### 1. Create `.env.local` File

Create a `.env.local` file in the root directory with the following content:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://fxcmmarlaeazjqnrdqzs.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ4Y21tYXJsYWVhempxbnJkcXpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI1MjkxMTksImV4cCI6MjA3ODEwNTExOX0.QZedvKtY0hyMNPEUJaHp0QBU4RAaOLE2C0LtofZl_sY

# Service Role Key (get from Supabase Dashboard > Settings > API > service_role key)
# This is needed for server-side operations that bypass RLS
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Editor Access Control
NEXT_PUBLIC_ENABLE_EDITOR=true

# Data Source
# Set to 'supabase' to use Supabase, 'filesystem' to use .mdx files
NEXT_PUBLIC_DATA_SOURCE=filesystem
```

**Important:** Get your Service Role Key from:
1. Go to your Supabase Dashboard
2. Settings → API
3. Copy the `service_role` key (keep this secret!)

### 2. Create Database Table

Run this SQL in your Supabase SQL Editor:

```sql
-- Create posts table
CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  tags TEXT[] DEFAULT '{}',
  summary TEXT,
  content TEXT NOT NULL,
  content_html TEXT,
  published BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_posts_slug ON posts(slug);
CREATE INDEX idx_posts_published ON posts(published);
CREATE INDEX idx_posts_date ON posts(date DESC);

-- Enable Row Level Security
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- Policy: Allow public read access to published posts
CREATE POLICY "Public posts are viewable by everyone"
  ON posts FOR SELECT
  USING (published = true);

-- Policy: Allow insert (we'll restrict in API routes)
CREATE POLICY "Allow insert"
  ON posts FOR INSERT
  WITH CHECK (true);

-- Policy: Allow update
CREATE POLICY "Allow update"
  ON posts FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Policy: Allow delete
CREATE POLICY "Allow delete"
  ON posts FOR DELETE
  USING (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to auto-update updated_at
CREATE TRIGGER update_posts_updated_at
  BEFORE UPDATE ON posts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Migrate Existing Posts (Optional)

If you have existing `.mdx` files in the `/posts` directory:

```bash
npm run migrate:posts
```

This will migrate all your filesystem posts to Supabase.

### 5. Switch to Supabase

After migration, update `.env.local`:

```env
NEXT_PUBLIC_DATA_SOURCE=supabase
```

### 6. Start Development Server

```bash
npm run dev
```

## Editor Access

The editor is available at `/admin/editor` when:
- `NEXT_PUBLIC_ENABLE_EDITOR=true` in `.env.local`, OR
- Running in development mode (`NODE_ENV=development`)

## Testing

1. **Create a new post:**
   - Go to `/admin/editor` (or click "New Post" on blog page)
   - Fill in title, tags, summary, and content
   - Click "Publish"

2. **View posts:**
   - Blog page: `/blog`
   - Individual post: `/blog/[slug]`

3. **Verify Supabase:**
   - Check your Supabase dashboard → Table Editor → posts
   - You should see your new post there

## Troubleshooting

### "Missing Supabase environment variables"
- Make sure `.env.local` exists and has all required variables
- Restart your dev server after creating/updating `.env.local`

### "Editor is not enabled"
- Check `NEXT_PUBLIC_ENABLE_EDITOR=true` in `.env.local`
- Or ensure you're running in development mode

### Posts not showing
- Check `NEXT_PUBLIC_DATA_SOURCE` is set correctly
- Verify posts are published in Supabase (`published = true`)
- Check browser console for errors

### Migration errors
- Ensure Supabase table is created
- Check that service role key is set correctly
- Verify posts directory exists and has `.mdx` files

## Next Steps

- [ ] Add Service Role Key to `.env.local`
- [ ] Run SQL to create database table
- [ ] Test creating a post via editor
- [ ] Migrate existing posts (if any)
- [ ] Switch `NEXT_PUBLIC_DATA_SOURCE=supabase`
- [ ] Test blog pages work correctly

