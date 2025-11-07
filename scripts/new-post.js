const fs = require('fs')
const path = require('path')

const postsDir = path.join(process.cwd(), 'posts')

// Get the title from command line arguments
const title = process.argv[2]

if (!title) {
  console.error('Error: Please provide a title for the post')
  console.log('Usage: npm run new:post "Your Post Title"')
  process.exit(1)
}

// Create posts directory if it doesn't exist
if (!fs.existsSync(postsDir)) {
  fs.mkdirSync(postsDir, { recursive: true })
}

// Generate slug from title
const slug = title
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '')

// Generate filename with date
const date = new Date()
const dateStr = date.toISOString().split('T')[0]
const filename = `${dateStr}-${slug}.mdx`

// Generate frontmatter template
const frontmatter = `---
title: ${title}
date: ${dateStr}
tags:
  - example
summary: A brief summary of your post.
---

Write your post content here using Markdown.

## Introduction

Start writing...

`

const filePath = path.join(postsDir, filename)

// Check if file already exists
if (fs.existsSync(filePath)) {
  console.error(`Error: File ${filename} already exists`)
  process.exit(1)
}

// Write the file
fs.writeFileSync(filePath, frontmatter, 'utf8')

console.log(`✅ Created new post: ${filename}`)
console.log(`📝 Edit it at: ${filePath}`)

