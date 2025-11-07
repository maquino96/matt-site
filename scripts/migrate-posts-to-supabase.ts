import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import { createClient } from '@supabase/supabase-js'
import { generateSlug } from '../lib/tiptap/utils'

// Load environment variables
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('Error: Missing Supabase environment variables')
  console.error('Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

const postsDirectory = path.join(process.cwd(), 'posts')

async function migratePosts() {
  console.log('Starting migration from filesystem to Supabase...\n')

  if (!fs.existsSync(postsDirectory)) {
    console.error('Error: Posts directory does not exist')
    process.exit(1)
  }

  const files = fs.readdirSync(postsDirectory).filter((file) => file.endsWith('.mdx'))

  if (files.length === 0) {
    console.log('No .mdx files found to migrate')
    return
  }

  console.log(`Found ${files.length} post(s) to migrate\n`)

  let successCount = 0
  let errorCount = 0
  const errors: Array<{ file: string; error: string }> = []

  for (const file of files) {
    try {
      const filePath = path.join(postsDirectory, file)
      const fileContents = fs.readFileSync(filePath, 'utf8')
      const { data, content } = matter(fileContents)

      const slug = file.replace(/\.mdx$/, '')
      const title = data.title || 'Untitled'
      const date = data.date || new Date().toISOString().split('T')[0]
      const tags = data.tags || []
      const summary = data.summary || null

      // Check if post already exists
      const { data: existingPost } = await supabase
        .from('posts')
        .select('id')
        .eq('slug', slug)
        .single()

      if (existingPost) {
        console.log(`⚠️  Skipping "${title}" - already exists in Supabase`)
        continue
      }

      // Insert post
      const { data: newPost, error } = await supabase
        .from('posts')
        .insert({
          slug,
          title,
          date,
          tags,
          summary,
          content, // Store markdown
          content_html: null, // Will be generated when edited in Tiptap
          published: true, // Migrate all as published
        })
        .select()
        .single()

      if (error) {
        throw new Error(error.message)
      }

      console.log(`✅ Migrated: "${title}" (${slug})`)
      successCount++
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      console.error(`❌ Error migrating ${file}:`, errorMessage)
      errors.push({ file, error: errorMessage })
      errorCount++
    }
  }

  console.log('\n' + '='.repeat(50))
  console.log('Migration Summary:')
  console.log(`✅ Successfully migrated: ${successCount}`)
  console.log(`❌ Errors: ${errorCount}`)

  if (errors.length > 0) {
    console.log('\nErrors:')
    errors.forEach(({ file, error }) => {
      console.log(`  - ${file}: ${error}`)
    })
  }

  console.log('\nMigration complete!')
  console.log('\nNext steps:')
  console.log('1. Update NEXT_PUBLIC_DATA_SOURCE=supabase in .env.local')
  console.log('2. Test your blog pages')
  console.log('3. Keep filesystem posts as backup')
}

migratePosts().catch((error) => {
  console.error('Fatal error:', error)
  process.exit(1)
})

