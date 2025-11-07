import TurndownService from 'turndown'
import MarkdownIt from 'markdown-it'

// Convert HTML (from Tiptap) to Markdown
export function htmlToMarkdown(html: string): string {
  const turndownService = new TurndownService({
    headingStyle: 'atx',
    codeBlockStyle: 'fenced',
    bulletListMarker: '-',
  })

  return turndownService.turndown(html)
}

// Convert Markdown to HTML (for Tiptap)
export function markdownToHtml(markdown: string): string {
  const md = new MarkdownIt({
    html: true,
    linkify: true,
    typographer: true,
  })

  return md.render(markdown)
}

// Generate slug from title
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
}

