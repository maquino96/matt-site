# Application Architecture & Context

## Project Overview

**Matt Site** is a personal profile and blog platform built with Next.js 14 App Router. It combines a static blog (MDX-based) with a dynamic content management system (Supabase + Tiptap editor) for creating and managing blog posts. The site includes a profile section, mini interactive apps, and full SEO/accessibility support.

**Core Purpose**: Personal portfolio/blog with rich text editing capabilities, accessible only in development mode by default, with production editing optional via environment variables.

---

## Tech Stack & Rationale

### Core Framework
- **Next.js 14** (App Router): Server components, API routes, static generation, built-in optimizations
- **TypeScript**: Type safety across the entire codebase
- **React 18**: Server and client components

### Styling
- **Tailwind CSS**: Utility-first, matches design system requirements
- **Custom Color Palette**: Deep-blue theme (primary-900 through primary-600, accent #0EA5E9)
- **Responsive Design**: Mobile-first approach

### Content Management
- **Dual Data Sources**: 
  - Filesystem (`.mdx` files) - Legacy/backup, static generation
  - Supabase (PostgreSQL) - Primary CMS, dynamic content
- **Content Format**: Markdown stored, HTML rendered
- **Editor**: Tiptap (headless, extensible, Tailwind-friendly)

### Key Libraries
- `gray-matter`: Frontmatter parsing for MDX files
- `react-markdown`: Markdown rendering (with `remark-gfm`)
- `turndown` + `markdown-it`: HTML ↔ Markdown conversion
- `lowlight`: Syntax highlighting for code blocks
- `date-fns`: Date formatting
- `clsx`: Conditional className utility

---

## Architecture Patterns

### 1. Data Source Abstraction

**Location**: `lib/posts.ts`

The app supports dual data sources via environment variable `NEXT_PUBLIC_DATA_SOURCE`:
- `filesystem`: Reads from `/posts/*.mdx` files
- `supabase`: Reads from Supabase `posts` table

**Unified Functions**: `getAllPostsUnified()`, `getPostBySlugUnified()`, `getLatestPostsUnified()`
- Dynamically resolve data source on each call (not cached)
- Automatically route to correct data source
- Maintain backward compatibility during migration
- Allow gradual transition from filesystem to Supabase

**Error Handling**: Fail-fast approach
- Supabase errors throw exceptions (no silent fallback)
- Filesystem errors throw exceptions (not found returns null)
- All operations log with `[Posts]` prefix for debugging
- Production logging enabled for monitoring

**Dev Indicator**: `DataSourceIndicator` component shows active data source (dev mode only)

**Decision**: This abstraction allows zero-downtime migration and keeps filesystem as backup. Fail-fast ensures errors are caught immediately rather than silently degraded.

### 2. Server vs Client Components

**Server Components** (default):
- All page components (`app/**/page.tsx`)
- Blog post rendering
- Data fetching
- SEO metadata generation

**Client Components** (`'use client'`):
- Interactive UI (editor, mini apps, navigation)
- Forms and user input
- Real-time updates
- Browser-only APIs

**Pattern**: Start with server components, add `'use client'` only when needed.

### 3. API Route Structure

**Location**: `app/api/posts/`

```
/api/posts
  ├── route.ts              # GET all posts
  ├── create/route.ts       # POST create (admin only)
  ├── [id]/route.ts        # PUT/DELETE by ID (admin only)
  └── slug/[slug]/route.ts # GET by slug (public)
```

**Security**: Editor routes check `NEXT_PUBLIC_ENABLE_EDITOR` or `NODE_ENV === 'development'`

**Note**: Avoid conflicting dynamic route names (`[id]` vs `[slug]`) - use nested paths.

### 4. Editor Access Control

**Visibility Logic**:
```typescript
const isEditorEnabled = () => 
  process.env.NEXT_PUBLIC_ENABLE_EDITOR === 'true' || 
  process.env.NODE_ENV === 'development'
```

**Routes**:
- `/admin/editor` - Main editor page (dev only by default)
- "New Post" button on blog page (conditional)
- API routes validate editor access

**Decision**: Environment variable provides flexibility to enable in production if needed.

---

## Data Flow

### Blog Post Creation Flow

1. **Editor** (`app/admin/editor/page.tsx`)
   - User inputs: title, tags, summary, content (Tiptap HTML)
   - Preview: HTML → Markdown → ReactMarkdown render
   - Submit: POST to `/api/posts/create`

2. **API Route** (`app/api/posts/create/route.ts`)
   - Validates editor access
   - Generates slug from title
   - Converts HTML to Markdown (via `htmlToMarkdown`)
   - Stores both `content` (markdown) and `content_html` (HTML) in Supabase
   - Returns created post

3. **Storage** (Supabase `posts` table)
   - Markdown in `content` field (for portability)
   - HTML in `content_html` field (for quick rendering)
   - Metadata: slug, title, date, tags, summary, published

### Blog Post Reading Flow

1. **Page Request** (e.g., `/blog/[slug]`)
   - Server component calls `getPostBySlugUnified(slug)`
   - Function dynamically resolves data source from env var
   - Fetches from Supabase or filesystem
   - Logs data source and operation (production logging enabled)
   - Returns `Post` interface or throws error (fail-fast)

2. **Rendering**
   - Markdown content → `ReactMarkdown` → Styled HTML
   - Metadata → SEO tags, JSON-LD
   - Static generation at build time (or ISR if needed)

### Migration Flow

**Script**: `scripts/migrate-posts-to-supabase.ts`
- Reads all `.mdx` files from `/posts`
- Parses frontmatter with `gray-matter`
- Inserts into Supabase (skips duplicates)
- Logs results

**Process**: Run migration → Test → Switch `NEXT_PUBLIC_DATA_SOURCE=supabase` → Keep filesystem as backup

---

## File Structure & Organization

```
/app                    # Next.js App Router
  /admin/editor        # Rich text editor (dev only)
  /api
    /posts             # CRUD API routes
    /debug/data-source # Dev-only data source info endpoint
  /apps                # Mini interactive apps
  /blog                # Blog pages (index + [slug])
  /profile             # Profile page
  layout.tsx           # Root layout (Nav, Footer, metadata, DataSourceIndicator)
  page.tsx             # Home page
  globals.css          # Tailwind + custom styles

/components
  /editor              # Tiptap editor components
  DataSourceIndicator.tsx  # Dev-only data source indicator
  Nav.tsx              # Navigation (client, uses usePathname)
  Footer.tsx           # Footer
  PostCard.tsx         # Blog post card
  MiniAppFrame.tsx    # Lazy-load wrapper for apps

/lib
  /supabase
    client.ts          # Browser Supabase client
    server.ts          # Server Supabase clients (anon + admin)
  /tiptap
    extensions.ts      # Tiptap extension config
    utils.ts           # HTML↔Markdown conversion, slug generation
  posts.ts             # Data abstraction layer

/posts                 # Legacy MDX files (backup/migration source)
/scripts               # Utility scripts (migration, new-post)
/context               # Architectural documentation
```

---

## Key Components

### Editor System

**TiptapEditor** (`components/editor/TiptapEditor.tsx`):
- Core editor component
- Uses extensions from `lib/tiptap/extensions.ts`
- Styled with Tailwind (matches color scheme)
- Exposes `onChange` callback with HTML content

**Toolbar** (`components/editor/Toolbar.tsx`):
- Formatting buttons (bold, italic, headings, lists, code, links)
- Active state management
- Accessible keyboard navigation

**PreviewPane** (`components/editor/PreviewPane.tsx`):
- Converts HTML → Markdown → ReactMarkdown render
- Matches blog post styling
- Split view or toggle mode

**TagInput** (`components/editor/TagInput.tsx`):
- Comma-separated or chip-based tag input
- Auto-lowercase, duplicate prevention

### Blog Components

**PostCard** (`components/PostCard.tsx`):
- Displays: title, date, summary, tags
- Links to full post
- Responsive card layout

**Blog Pages**:
- `app/blog/page.tsx`: Lists all posts, shows "New Post" button (dev only)
- `app/blog/[slug]/page.tsx`: Individual post with markdown rendering, SEO metadata

### Mini Apps

**Pattern**: Lazy-loaded client components
- Located in `app/apps/[app-name]/[AppName].tsx`
- Registered in `app/apps/page.tsx` with `next/dynamic`
- Wrapped in `MiniAppFrame` for loading states
- Examples: TodoApp, DrawingPad

---

## Environment Configuration

### Required Variables (`.env.local`)

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Editor Access
NEXT_PUBLIC_ENABLE_EDITOR=true  # or false to disable

# Data Source
NEXT_PUBLIC_DATA_SOURCE=supabase  # or 'filesystem'
```

### Supabase Setup

**Database Schema**: See `SUPABASE_SETUP.md` for SQL
- Table: `posts` with RLS policies
- Indexes on `slug`, `published`, `date`
- Auto-update trigger on `updated_at`

**Security**:
- Public read: Published posts only
- Write operations: Restricted in API routes (editor check)
- Service role key: Server-side only, bypasses RLS

---

## Styling System

### Color Palette (Tailwind Config)

```javascript
primary: {
  900: '#071A2F',  // Darkest background
  800: '#08263C',  // Nav/footer
  700: '#0B3D91',  // Borders, hover
  600: '#164E9D'   // Text accents
}
accent: '#0EA5E9'  // Links, highlights, buttons
```

### CSS Architecture

**Location**: `app/globals.css`

- Tailwind directives (`@tailwind base/components/utilities`)
- Custom component classes (`.container-content`, `.btn`, `.link`)
- Tiptap editor styles (`.ProseMirror` and children)
- Accessibility (skip links, focus styles)

**Pattern**: Utility-first with component classes for repeated patterns.

---

## Important Decisions & Rationale

### 1. Dual Data Source System

**Why**: 
- Gradual migration from filesystem to Supabase
- Zero downtime during transition
- Filesystem as backup/version control

**Trade-off**: Slightly more complex abstraction, but provides flexibility.

### 2. Markdown + HTML Storage

**Why**:
- Markdown: Portable, version-control friendly, human-readable
- HTML: Fast rendering, preserves Tiptap formatting

**Storage**: Both in Supabase (`content` = markdown, `content_html` = HTML)

### 3. Tiptap Over MDXEditor

**Why**:
- Better Tailwind integration
- More flexible/extensible
- Headless architecture
- Active community

**Trade-off**: Requires more setup, but more control.

### 4. Editor Dev-Only by Default

**Why**:
- Security: No accidental public access
- Simplicity: No auth required initially
- Flexibility: Can enable in production via env var

**Future**: Can add Supabase Auth for production editing.

### 5. Static Generation for Blog Posts

**Why**:
- Performance: Pre-rendered at build time
- SEO: Fully rendered HTML
- Cost: No server computation per request

**Note**: Can switch to ISR if needed for dynamic updates.

---

## API Patterns

### Request/Response Format

**Create Post** (`POST /api/posts/create`):
```typescript
Request: {
  title: string
  slug?: string        // Auto-generated if not provided
  tags: string[]
  summary?: string
  content: string     // HTML from Tiptap
  published: boolean
}

Response: Post (with id, created_at, etc.)
```

**Get Posts** (`GET /api/posts`):
- Query params: `?published=false` to include drafts
- Returns: Array of posts

**Get Post by Slug** (`GET /api/posts/slug/[slug]`):
- Returns: Single post (published only)
- 404 if not found

### Error Handling

**Fail-Fast Strategy**: Errors throw exceptions rather than returning empty arrays/null
- Supabase connection errors: Throw with clear message
- Filesystem read errors: Throw with clear message
- Not found (404): Returns null (expected case)
- All errors logged with `[Posts]` prefix for easy filtering

**HTTP Status Codes**:
- 400: Validation errors (missing required fields)
- 403: Editor not enabled
- 404: Post not found
- 409: Slug conflict
- 500: Server errors (with details in dev mode)

**Logging**: Production logging enabled for all data operations
- Data source selection logged on each call
- Fetch operations log success/failure
- Error details logged for debugging

---

## Future Considerations

### Authentication
- Add Supabase Auth for production editor access
- Role-based permissions (admin, editor, viewer)
- Protect `/admin/*` routes

### Image Upload
- Supabase Storage integration
- Image optimization (Next.js Image component)
- Upload API route (`/api/upload`)

### Draft System
- Separate `drafts` table
- Auto-save functionality
- Draft → Published workflow

### Search
- Full-text search in Supabase
- Tag filtering
- Search API route

### Analytics
- Post view tracking
- Popular posts
- Optional: Google Analytics, Plausible

### Performance
- ISR for blog posts (revalidate on update)
- Image optimization
- Code splitting for editor (only load in dev)

### Content Features
- Comments system (optional)
- Related posts
- Tag pages
- Archive by date

---

## Development Workflow

### Adding a New Blog Post

1. **Via Editor** (recommended):
   - Visit `/admin/editor` (dev mode)
   - Fill form, preview, publish
   - Post saved to Supabase

2. **Via Script** (legacy):
   - `npm run new:post "Title"`
   - Creates `.mdx` file in `/posts`
   - Migrate to Supabase if using filesystem

### Adding a Mini App

1. Create component: `app/apps/[name]/[Name]App.tsx`
2. Make it client component: `'use client'`
3. Register in `app/apps/page.tsx`:
   ```typescript
   const App = dynamic(() => import('@/app/apps/[name]/[Name]App'), {
     loading: () => <div>Loading...</div>
   })
   ```

### Modifying Styles

- Global: `app/globals.css`
- Tailwind config: `tailwind.config.js`
- Component-specific: Inline Tailwind classes
- Editor styles: `.ProseMirror` classes in `globals.css`

### Database Changes

1. Update Supabase schema
2. Update TypeScript interfaces in `lib/posts.ts`
3. Update API routes if needed
4. Run migration if changing structure

---

## Testing Strategy

### Manual Testing Checklist

- [ ] Create post via editor
- [ ] View post on blog page
- [ ] Preview matches final render
- [ ] RSS feed includes new post
- [ ] Home page shows latest posts
- [ ] Editor only visible in dev mode
- [ ] Migration script works
- [ ] Filesystem fallback works

### Key Test Scenarios

1. **Data Source Switch**: Change `NEXT_PUBLIC_DATA_SOURCE`, verify posts load
2. **Editor Access**: Toggle `NEXT_PUBLIC_ENABLE_EDITOR`, verify visibility
3. **Slug Conflicts**: Try creating duplicate slugs
4. **Migration**: Run migration script, verify all posts transferred

---

## Deployment Considerations

### Environment Variables

**Required in Production**:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (server-side only)
- `NEXT_PUBLIC_DATA_SOURCE` (set to `supabase`)

**Optional**:
- `NEXT_PUBLIC_ENABLE_EDITOR` (set to `false` for security)
- `NEXT_PUBLIC_SITE_URL` (for RSS feed, OG tags)

### Build Process

1. Static generation: Blog posts pre-rendered
2. API routes: Serverless functions
3. Editor: Only included if enabled (tree-shaking)

### Supabase Setup

- RLS policies configured
- Indexes created
- Service role key secured (never expose to client)

---

## Deployment

### GitHub Repository Setup

**Repository**: `matt-site`

#### Initial Setup

1. **Create GitHub Repository**:
   - Go to https://github.com/new
   - Repository name: `matt-site`
   - Visibility: Public (or Private)
   - Do NOT initialize with README, .gitignore, or license (already exists)
   - Click "Create repository"

2. **Add Remote and Push**:
   ```bash
   # Update remote URL with your GitHub username
   git remote set-url origin https://github.com/YOUR_USERNAME/matt-site.git
   
   # Or use SSH
   git remote set-url origin git@github.com:YOUR_USERNAME/matt-site.git
   
   # Push to GitHub
   git push -u origin master
   # Or if your default branch is main:
   git push -u origin main
   ```

3. **Alternative: Use Helper Script**:
   ```bash
   # Requires GitHub username and personal access token
   ./scripts/create-github-repo.sh YOUR_USERNAME [TOKEN]
   ```
   The script will create the repository via GitHub API and push the code automatically.

#### Branch Protection (Optional)

- Enable branch protection on `main`/`master` branch
- Require pull request reviews before merging
- Require status checks to pass

### Vercel Deployment

#### Prerequisites

- GitHub repository created and pushed
- Vercel account (sign up at https://vercel.com)

#### Deployment Steps

1. **Connect Repository to Vercel**:
   - Go to https://vercel.com/new
   - Import your `matt-site` repository
   - Vercel will auto-detect Next.js framework

2. **Configure Project Settings**:
   - **Framework Preset**: Next.js (auto-detected)
   - **Root Directory**: `./` (default)
   - **Build Command**: `npm run build` (default)
   - **Output Directory**: `.next` (default, auto-detected)
   - **Install Command**: `npm install` (default)

3. **Set Environment Variables**:
   
   Go to Project Settings → Environment Variables and add:
   
   **Required**:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   NEXT_PUBLIC_DATA_SOURCE=supabase
   ```
   
   **Recommended for Production**:
   ```
   NEXT_PUBLIC_ENABLE_EDITOR=false
   NEXT_PUBLIC_SITE_URL=https://your-domain.vercel.app
   ```
   
   **Note**: 
   - Set variables for "Production", "Preview", and "Development" environments
   - `SUPABASE_SERVICE_ROLE_KEY` should be marked as "Sensitive" (encrypted)
   - `NEXT_PUBLIC_SITE_URL` should match your Vercel deployment URL

4. **Deploy**:
   - Click "Deploy"
   - Vercel will build and deploy your application
   - First deployment may take 2-3 minutes

5. **Custom Domain (Optional)**:
   - Go to Project Settings → Domains
   - Add your custom domain
   - Follow DNS configuration instructions

#### Automatic Deployments

Vercel automatically deploys:
- **Production**: Pushes to `main`/`master` branch
- **Preview**: Pull requests and other branches
- Each deployment gets a unique URL

#### Environment-Specific Configuration

**Production**:
- `NEXT_PUBLIC_DATA_SOURCE=supabase` (use Supabase, not filesystem)
- `NEXT_PUBLIC_ENABLE_EDITOR=false` (disable editor for security)
- `NEXT_PUBLIC_SITE_URL=https://your-domain.vercel.app` (for RSS, OG tags)

**Preview/Development**:
- Can use `NEXT_PUBLIC_ENABLE_EDITOR=true` for testing
- Can use `NEXT_PUBLIC_DATA_SOURCE=filesystem` for local testing

### Post-Deployment Verification

#### Checklist

- [ ] Site loads at Vercel URL
- [ ] Blog posts display correctly
- [ ] Data source is Supabase (check DataSourceIndicator in dev mode)
- [ ] RSS feed works: `/api/rss` or `/rss.xml`
- [ ] API routes respond correctly
- [ ] Editor is disabled in production (if `NEXT_PUBLIC_ENABLE_EDITOR=false`)
- [ ] Environment variables are set correctly
- [ ] Custom domain works (if configured)
- [ ] SSL certificate is active (automatic with Vercel)

#### Testing Production Build Locally

```bash
# Build production version
npm run build

# Test production server
npm run start

# Verify environment variables
# Check that NEXT_PUBLIC_DATA_SOURCE=supabase works
```

#### Monitoring

- **Vercel Dashboard**: View deployments, logs, analytics
- **Function Logs**: Check API route execution in Vercel dashboard
- **Supabase Dashboard**: Monitor database queries and performance

### Deployment Troubleshooting

#### Build Failures

- Check build logs in Vercel dashboard
- Verify all environment variables are set
- Ensure `package.json` has correct dependencies
- Check for TypeScript errors: `npm run build` locally

#### Runtime Errors

- Check function logs in Vercel dashboard
- Verify Supabase connection (check env vars)
- Check RLS policies allow public read access
- Verify `NEXT_PUBLIC_DATA_SOURCE` matches your setup

#### Environment Variable Issues

- Ensure variables are set for correct environment (Production/Preview)
- Check variable names match exactly (case-sensitive)
- Verify `NEXT_PUBLIC_*` variables are accessible in browser
- Service role key should NOT be `NEXT_PUBLIC_*` (server-side only)

#### Database Connection Issues

- Verify Supabase URL and keys are correct
- Check Supabase project is active
- Verify RLS policies allow necessary operations
- Check network connectivity from Vercel to Supabase

### Continuous Deployment

Vercel automatically:
- Deploys on every push to `main`/`master`
- Creates preview deployments for pull requests
- Runs build checks before deployment
- Provides deployment URLs for each commit

#### Manual Deployment

If needed, trigger manual deployment:
- Vercel Dashboard → Deployments → "Redeploy"
- Or use Vercel CLI: `vercel --prod`

---

## Common Patterns

### Conditional Rendering (Dev Mode)

```typescript
const isEditorEnabled = () => 
  process.env.NEXT_PUBLIC_ENABLE_EDITOR === 'true' || 
  process.env.NODE_ENV === 'development'

// In component
{isEditorEnabled() && <EditorButton />}
```

### Data Fetching

```typescript
// Server component
const posts = await getAllPostsUnified()

// Client component (if needed)
const [posts, setPosts] = useState<Post[]>([])
useEffect(() => {
  fetch('/api/posts').then(r => r.json()).then(setPosts)
}, [])
```

### Markdown Rendering

```typescript
<ReactMarkdown remarkPlugins={[remarkGfm]}>
  {post.content} // Markdown string
</ReactMarkdown>
```

### HTML to Markdown Conversion

```typescript
import { htmlToMarkdown } from '@/lib/tiptap/utils'
const markdown = htmlToMarkdown(htmlString)
```

---

## Troubleshooting Guide

### Editor Not Showing
- Check `NEXT_PUBLIC_ENABLE_EDITOR=true` or dev mode
- Verify route `/admin/editor` exists
- Check browser console for errors

### Posts Not Loading
- Verify `NEXT_PUBLIC_DATA_SOURCE` matches current setup
- Check Supabase connection (env vars)
- Verify RLS policies allow read access
- Check filesystem posts exist if using filesystem
- Check server logs for `[Posts]` prefix messages
- Verify data source indicator (dev mode) shows correct source
- Errors will throw (fail-fast) - check error boundaries

### Migration Issues
- Ensure Supabase table exists
- Check service role key is set
- Verify posts directory has `.mdx` files
- Check for duplicate slugs

### Styling Issues
- Verify Tailwind config includes all paths
- Check `globals.css` is imported in `layout.tsx`
- Ensure custom classes are in `@layer components`

---

## Code Quality Standards

### TypeScript
- Strict mode enabled
- Interfaces for all data structures
- No `any` types (use `unknown` if needed)

### Component Structure
- Server components by default
- Client components only when needed
- Props typed with interfaces

### File Naming
- Components: PascalCase (`PostCard.tsx`)
- Utilities: camelCase (`posts.ts`)
- Pages: Next.js conventions (`page.tsx`, `route.ts`)

### Error Handling
- **Fail-fast strategy**: Throw errors rather than silent failures
- Try-catch in async functions
- Meaningful error messages with context (`[Posts]` prefix for filtering)
- Production logging enabled (all data operations logged)
- User-friendly messages in production (errors caught by Next.js error boundaries)

---

## Summary

This application is a **hybrid static/dynamic blog platform** with:
- **Dual data sources** (filesystem + Supabase) for flexibility
- **Rich text editor** (Tiptap) for content creation
- **Static generation** for performance
- **Dev-only editor** for security
- **Full TypeScript** for type safety
- **Tailwind CSS** for styling
- **Accessibility** built-in

The architecture prioritizes **flexibility** (dual data sources), **security** (editor access control), and **performance** (static generation) while maintaining **code quality** and **developer experience**.

For specific implementation details, refer to:
- `SUPABASE_SETUP.md` - Database setup
- `README.md` - User-facing documentation
- `prompts/editor.md` - Editor implementation plan

