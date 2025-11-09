# Application Architecture & Context

## Project Overview

**Matt Site** is a personal profile and blog platform built with Next.js 14 App Router. It combines a static blog (MDX-based) with a dynamic content management system (Supabase + Tiptap editor) for creating and managing blog posts. The site includes a profile section, mini interactive apps, and full SEO/accessibility support.

**Core Purpose**: Personal portfolio/blog with rich text editing capabilities, protected by password authentication for secure admin access.

---

## Tech Stack & Rationale

### Core Framework
- **Next.js 14** (App Router): Server components, API routes, static generation, built-in optimizations
- **TypeScript**: Type safety across the entire codebase
- **React 18**: Server and client components

### Styling
- **Tailwind CSS**: Utility-first, matches design system requirements
- **SCSS**: For Tiptap editor components and custom styling
- **Custom Color Palette**: Deep-blue theme (primary-900 through primary-600, accent #0EA5E9)
- **Responsive Design**: Mobile-first approach
- **FOUC Prevention**: Inline styles for critical components to eliminate flash of unstyled content

### Content Management
- **Dual Data Sources**: 
  - Filesystem (`.mdx` files) - Legacy/backup, static generation
  - Supabase (PostgreSQL) - Primary CMS, dynamic content
- **Content Format**: Markdown stored, HTML rendered
- **Editor**: Tiptap (headless, extensible, feature-rich)
- **Image Storage**: Supabase Storage with automatic WebP conversion and resizing

### Authentication & Security
- **Password Protection**: bcrypt-based hashing with Base64 encoding
- **Session Management**: JWT tokens in httpOnly cookies
- **Session Expiry**: Browser-session only (expires when browser closes)
- **Protected Routes**: All admin operations require authentication

### Key Libraries
- `bcryptjs`: Password hashing
- `jsonwebtoken`: Session token management
- `gray-matter`: Frontmatter parsing for MDX files
- `react-markdown`: Markdown rendering (with `remark-gfm`)
- `turndown` + `markdown-it`: HTML ↔ Markdown conversion
- `lowlight`: Syntax highlighting for code blocks
- `sharp`: Image processing and optimization
- `date-fns`: Date formatting
- `clsx`: Conditional className utility
- `@tiptap/*`: Rich text editor extensions

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
- Authentication checks (can access cookies)

**Client Components** (`'use client'`):
- Interactive UI (editor, mini apps, navigation)
- Forms and user input
- Real-time updates
- Browser-only APIs
- Modal dialogs

**Pattern**: Start with server components, add `'use client'` only when needed.

### 3. API Route Structure

**Location**: `app/api/`

```
/api
  /admin
    /auth              # POST - Admin login
  /posts
    /route.ts          # GET all posts
    /create/route.ts   # POST create (protected)
    /[id]/route.ts     # PUT/DELETE by ID (protected)
    /slug/[slug]/route.ts  # GET by slug (public)
  /upload
    /image/route.ts    # POST image upload (protected)
  /rss                 # GET RSS feed
  /debug
    /data-source       # GET data source info (dev only)
```

**Security**: All admin routes verify session via `verifyAdminSession()` middleware

**Note**: Avoid conflicting dynamic route names (`[id]` vs `[slug]`) - use nested paths.

### 4. Authentication System

**Architecture**: Password-based with session cookies

**Components**:
- `lib/auth/admin-auth.ts` - Core authentication logic
- `app/api/admin/auth/route.ts` - Login endpoint
- `components/AdminPasswordModal.tsx` - Password prompt UI
- `app/admin/editor/page.tsx` - Server component with auth check
- `app/admin/editor/EditorClient.tsx` - Client component with editor UI

**Flow**:
1. User visits `/admin/editor`
2. Server checks for valid session cookie
3. If not authenticated: Show password modal
4. User enters password → POST to `/api/admin/auth`
5. Server verifies password (bcrypt), creates JWT token
6. Token stored in httpOnly cookie (secure, sameSite=strict)
7. Session persists until browser closes

**Security Features**:
- Password hashed with bcrypt (10 rounds)
- Base64 encoding to avoid `$` symbol issues in env vars
- JWT tokens signed with `SESSION_SECRET`
- httpOnly cookies (not accessible via JavaScript)
- Secure flag in production (HTTPS only)
- sameSite=strict (CSRF protection)
- No session expiry time (browser-session only)

**Protected Routes**:
- `GET /admin/editor` - Editor page
- `POST /api/posts/create` - Create post
- `PUT /api/posts/[id]` - Update post
- `DELETE /api/posts/[id]` - Delete post
- `POST /api/upload/image` - Upload images

**Decision**: Simple password auth suitable for solo admin use. Can be upgraded to Supabase Auth later if needed.

### 5. FOUC (Flash of Unstyled Content) Prevention

**Problem**: Components briefly show with light backgrounds before CSS loads

**Solution**: Inline `backgroundColor` styles on critical components

**Components with Inline Styles**:
- `app/layout.tsx` - HTML/body tags (`#0f172a`)
- `components/Nav.tsx` - Navigation (`#08263C`)
- `components/Footer.tsx` - Footer (`#08263C`)
- `components/tiptap-templates/simple/simple-editor.tsx` - Editor container (`rgba(14, 14, 17, 1)`)
- `components/tiptap-ui-primitive/toolbar/toolbar.tsx` - Toolbar (`rgba(14, 14, 17, 1)`)
- `components/AdminPasswordModal.tsx` - Modal overlay and content
- `app/admin/editor/EditorClient.tsx` - Input fields
- `components/editor/TagInput.tsx` - Tag container and badges

**Why It Works**: Inline styles are part of HTML and applied instantly, before CSS files load

**Decision**: Hybrid approach - inline styles for critical first-paint elements, CSS classes for everything else

---

## Data Flow

### Blog Post Creation Flow

1. **Editor** (`app/admin/editor/EditorClient.tsx`)
   - User inputs: title, tags, content (Tiptap HTML)
   - Preview: HTML → Markdown → ReactMarkdown render
   - Submit: POST to `/api/posts/create`

2. **API Route** (`app/api/posts/create/route.ts`)
   - Verifies admin session
   - Generates slug from title
   - Converts HTML to Markdown (via `htmlToMarkdown`)
   - Stores both `content` (markdown) and `content_html` (HTML) in Supabase
   - Returns created post

3. **Storage** (Supabase `posts` table)
   - Markdown in `content` field (for portability)
   - HTML in `content_html` field (for quick rendering)
   - Metadata: slug, title, date, tags, published

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

### Image Upload Flow

1. **User Action**: Click image upload button in editor
2. **File Selection**: Browser file picker opens
3. **Upload**: POST to `/api/upload/image` with FormData
4. **Processing** (`app/api/upload/image/route.ts`):
   - Verify admin session
   - Validate file type and size (max 5MB)
   - Process with Sharp: resize to max 1200px width, convert to WebP
   - Generate unique filename with timestamp
   - Upload to Supabase Storage (`blog-images` bucket)
   - Return public URL
5. **Insertion**: Editor inserts image at cursor position
6. **Storage**: Image stored in Supabase Storage, URL in post content

### Post Deletion with Image Cleanup

1. **Delete Request**: DELETE to `/api/posts/[id]`
2. **Fetch Post**: Get post content to extract image URLs
3. **Parse Images**: Extract Supabase Storage paths from HTML
4. **Delete Images**: Remove images from `blog-images` bucket
5. **Delete Post**: Remove post record from database
6. **Response**: Success confirmation

### Authentication Flow

1. **Access Protected Route**: User visits `/admin/editor`
2. **Session Check**: Server verifies `admin_session` cookie
3. **Not Authenticated**: Show `AdminPasswordModal`
4. **Password Entry**: User enters password
5. **Verification**: POST to `/api/admin/auth`
   - Compare password with bcrypt hash
   - Generate JWT token
   - Set httpOnly cookie
6. **Authenticated**: Reload page, show editor
7. **Session Persists**: Until browser closes

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
  /admin
    /editor
      page.tsx          # Server component with auth check
      EditorClient.tsx  # Client component with editor UI
  /api
    /admin
      /auth/route.ts    # Admin login endpoint
    /posts              # CRUD API routes (all protected)
    /upload
      /image/route.ts   # Image upload (protected)
    /debug/data-source  # Dev-only data source info endpoint
    /rss                # RSS feed generation
  /apps                 # Mini interactive apps
  /blog                 # Blog pages (index + [slug])
  /profile              # Profile page
  layout.tsx            # Root layout (Nav, Footer, metadata)
  page.tsx              # Home page
  globals.scss          # Tailwind + custom styles

/components
  /editor               # Editor-specific components
    TiptapEditor.tsx    # Main editor wrapper
    TagInput.tsx        # Tag input with chips
    PreviewPane.tsx     # Markdown preview
    Toolbar.tsx         # Editor toolbar (legacy)
    ImageUploadButton.tsx  # Image upload button
  /tiptap-templates     # Tiptap editor templates
    /simple
      simple-editor.tsx # Full-featured Tiptap editor
      theme-toggle.tsx  # Light/dark theme toggle
  /tiptap-ui            # Tiptap UI components (buttons, menus)
  /tiptap-ui-primitive  # Base UI primitives (toolbar, button, etc.)
  /tiptap-node          # Custom Tiptap nodes (image upload, etc.)
  /tiptap-icons         # SVG icons for editor
  AdminPasswordModal.tsx  # Password prompt modal
  DataSourceIndicator.tsx # Dev-only data source indicator
  DeletePostButton.tsx    # Delete button with modal
  DeletePostModal.tsx     # Delete confirmation modal
  Nav.tsx                 # Navigation (client, uses usePathname)
  Footer.tsx              # Footer
  PostCard.tsx            # Blog post card
  MiniAppFrame.tsx        # Lazy-load wrapper for apps
  MDXComponents.tsx       # Custom MDX components

/lib
  /auth
    admin-auth.ts       # Authentication utilities
  /supabase
    client.ts           # Browser Supabase client
    server.ts           # Server Supabase clients (anon + admin)
  /tiptap
    extensions.ts       # Tiptap extension config
    utils.ts            # HTML↔Markdown conversion, slug generation
  /utils
    image-cleanup.ts    # Extract and delete images from content
  posts.ts              # Data abstraction layer
  tiptap-utils.ts       # Tiptap utility functions

/hooks                  # Custom React hooks
  use-composed-ref.ts   # Compose multiple refs
  use-cursor-visibility.ts  # Track cursor visibility
  use-element-rect.ts   # Get element dimensions
  use-menu-navigation.ts  # Keyboard navigation for menus
  use-mobile.ts         # Detect mobile devices
  use-scrolling.ts      # Track scroll state
  use-throttled-callback.ts  # Throttle callbacks
  use-tiptap-editor.ts  # Tiptap editor utilities
  use-unmount.ts        # Run cleanup on unmount
  use-window-size.ts    # Track window dimensions

/styles
  _variables.scss       # Tiptap CSS variables
  _keyframe-animations.scss  # Animation keyframes

/posts                  # Legacy MDX files (backup/migration source)
/scripts                # Utility scripts
  hash-password.js      # Generate password hash
  migrate-posts-to-supabase.ts  # Migration script
  new-post.js           # Create new MDX file (legacy)
/context                # Architectural documentation
  APP_INIT.md           # This file
  SUPABASE_STORAGE_SETUP.md  # Image storage setup guide
```

---

## Key Components

### Authentication Components

**AdminPasswordModal** (`components/AdminPasswordModal.tsx`):
- Modal overlay with password input
- POST to `/api/admin/auth` on submit
- Shows error messages
- Loading state during authentication
- Cannot be dismissed (no cancel button)

**EditorPage** (`app/admin/editor/page.tsx`):
- Server component
- Checks session with `verifyAdminSession()`
- Shows modal if not authenticated
- Renders `EditorClient` if authenticated

**EditorClient** (`app/admin/editor/EditorClient.tsx`):
- Client component with editor UI
- Title and tag inputs
- Tiptap editor integration
- Preview mode toggle
- Save draft / Publish buttons

### Editor System

**SimpleEditor** (`components/tiptap-templates/simple/simple-editor.tsx`):
- Full-featured Tiptap editor
- Extensive toolbar with formatting options
- Image upload support
- Theme toggle (light/dark)
- Mobile-responsive
- Keyboard navigation

**Toolbar Components**:
- Heading dropdown (H1-H6)
- List dropdown (bullet, ordered, task)
- Mark buttons (bold, italic, strike, code, underline)
- Text align buttons
- Color highlight popover
- Link popover
- Image upload button
- Undo/redo buttons
- Blockquote and code block buttons

**TiptapEditor** (`components/editor/TiptapEditor.tsx`):
- Wrapper component
- Integrates `SimpleEditor`
- Exposes `onChange` callback with HTML content

**TagInput** (`components/editor/TagInput.tsx`):
- Chip-based tag input
- Auto-lowercase, duplicate prevention
- Backspace to remove last tag
- Enter to add new tag

**PreviewPane** (`components/editor/PreviewPane.tsx`):
- Converts HTML → Markdown → ReactMarkdown render
- Matches blog post styling
- Used for preview mode

**ImageUploadButton** (`components/editor/ImageUploadButton.tsx`):
- File picker integration
- Upload progress tracking
- Error handling
- Inserts image at cursor position

### Blog Components

**PostCard** (`components/PostCard.tsx`):
- Displays: title, date, summary, tags
- Links to full post
- Delete button (if editor enabled)
- Responsive card layout

**DeletePostButton** (`components/DeletePostButton.tsx`):
- Small X button on post cards
- Opens delete confirmation modal
- Only visible when authenticated

**DeletePostModal** (`components/DeletePostModal.tsx`):
- Confirmation dialog
- Shows warning if post contains images
- DELETE request to `/api/posts/[id]`
- Hard refresh after deletion

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

# Data Source
NEXT_PUBLIC_DATA_SOURCE=supabase  # or 'filesystem'

# Authentication (Base64 encoded to avoid $ escaping issues)
ADMIN_PASSWORD_HASH=BASE64:encoded-bcrypt-hash
SESSION_SECRET=random-hex-string
```

### Generating Authentication Secrets

```bash
# Generate password hash and session secret
node scripts/hash-password.js "your-secure-password"

# Output will include both ADMIN_PASSWORD_HASH and SESSION_SECRET
# Copy to .env.local and deployment platform
```

### Supabase Setup

**Database Schema**: See `SUPABASE_SETUP.md` for SQL
- Table: `posts` with RLS policies
- Indexes on `slug`, `published`, `date`
- Auto-update trigger on `updated_at`

**Storage Setup**: See `SUPABASE_STORAGE_SETUP.md`
- Bucket: `blog-images` (public)
- RLS policies for read/write
- File size limit: 5MB
- Allowed types: JPEG, PNG, GIF, WebP

**Security**:
- Public read: Published posts only
- Write operations: Protected by session verification
- Service role key: Server-side only, bypasses RLS
- Image uploads: Protected by session verification

---

## Styling System

### Color Palette (Tailwind Config)

```javascript
primary: {
  900: '#071A2F',  // Darkest background (main bg)
  800: '#08263C',  // Nav/footer, secondary backgrounds
  700: '#0B3D91',  // Borders, hover states
  600: '#164E9D'   // Text accents
}
accent: '#0EA5E9'  // Links, highlights, buttons
```

### CSS Architecture

**Location**: `app/globals.scss`

- Tailwind directives (`@tailwind base/components/utilities`)
- Custom component classes (`.container-content`, `.btn`, `.link`)
- Tiptap editor styles (`.ProseMirror` and children)
- Accessibility (skip links, focus styles)

**Tiptap Styles**: `styles/_variables.scss`
- CSS custom properties for theming
- Light and dark mode support
- Color tokens for editor components

**Pattern**: Utility-first with component classes for repeated patterns + inline styles for FOUC prevention

### Inline Styles for FOUC Prevention

Critical components have inline `backgroundColor` to prevent flash:
- Main layout: `#0f172a`
- Nav/Footer: `#08263C`
- Editor components: `rgba(14, 14, 17, 1)`

**Maintenance**: If changing theme colors in `tailwind.config.js`, update corresponding inline styles

---

## Important Decisions & Rationale

### 1. Password Authentication Over OAuth

**Why**: 
- Simple solo-admin use case
- No third-party dependencies
- Works offline (no OAuth provider needed)
- Instant setup with environment variables

**Trade-off**: Less sophisticated than OAuth, but adequate for single-user scenario

**Future**: Can upgrade to Supabase Auth with Google OAuth if needed

### 2. Base64 Encoding for Password Hash

**Why**:
- Bcrypt hashes contain `$`, `.`, `/` characters
- These cause issues in `.env` files (interpreted as special chars)
- Base64 encoding converts to safe alphanumeric string
- Automatic decoding in `admin-auth.ts`

**Trade-off**: Slightly longer env var, but eliminates escaping issues

### 3. Session Cookies Without Expiry

**Why**:
- More secure (session ends when browser closes)
- Simpler implementation (no refresh token logic)
- Appropriate for admin-only access

**Trade-off**: Must re-authenticate after closing browser, but acceptable for security

### 4. Dual Data Source System

**Why**: 
- Gradual migration from filesystem to Supabase
- Zero downtime during transition
- Filesystem as backup/version control

**Trade-off**: Slightly more complex abstraction, but provides flexibility

### 5. Markdown + HTML Storage

**Why**:
- Markdown: Portable, version-control friendly, human-readable
- HTML: Fast rendering, preserves Tiptap formatting

**Storage**: Both in Supabase (`content` = markdown, `content_html` = HTML)

### 6. Tiptap Over MDXEditor

**Why**:
- Better Tailwind integration
- More flexible/extensible
- Headless architecture
- Active community
- Rich ecosystem of extensions

**Trade-off**: Requires more setup, but more control

### 7. Image Processing with Sharp

**Why**:
- Automatic WebP conversion (smaller files)
- Resize to max 1200px (performance)
- Consistent quality (85% WebP)
- Server-side processing (no client load)

**Trade-off**: Requires Sharp dependency, but significant performance benefit

### 8. Static Generation for Blog Posts

**Why**:
- Performance: Pre-rendered at build time
- SEO: Fully rendered HTML
- Cost: No server computation per request

**Note**: Can switch to ISR if needed for dynamic updates

### 9. Inline Styles for FOUC Prevention

**Why**:
- Eliminates jarring white flash on page load
- Instant dark theme application
- Better user experience
- Minimal code changes

**Trade-off**: Must maintain inline styles alongside CSS classes, but only for critical elements

---

## API Patterns

### Request/Response Format

**Create Post** (`POST /api/posts/create`):
```typescript
Request: {
  title: string
  slug?: string        // Auto-generated if not provided
  tags: string[]
  content: string      // HTML from Tiptap
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

**Upload Image** (`POST /api/upload/image`):
```typescript
Request: FormData with 'file' field

Response: {
  url: string        // Public URL
  filename: string   // Storage path
}
```

**Admin Login** (`POST /api/admin/auth`):
```typescript
Request: {
  password: string
}

Response: {
  success: boolean
}
// Sets admin_session cookie on success
```

### Error Handling

**Fail-Fast Strategy**: Errors throw exceptions rather than returning empty arrays/null
- Supabase connection errors: Throw with clear message
- Filesystem read errors: Throw with clear message
- Not found (404): Returns null (expected case)
- All errors logged with `[Posts]` or `[Auth]` prefix for easy filtering

**HTTP Status Codes**:
- 200: Success
- 201: Created
- 400: Validation errors (missing required fields)
- 401: Unauthorized (session invalid/missing)
- 403: Forbidden (editor not enabled - legacy)
- 404: Post not found
- 409: Slug conflict
- 500: Server errors (with details in dev mode)

**Logging**: Production logging enabled for all data operations
- Data source selection logged on each call
- Fetch operations log success/failure
- Auth operations log attempts and results
- Error details logged for debugging

---

## Security Considerations

### Authentication Security

- **Password Hashing**: bcrypt with 10 rounds (industry standard)
- **Base64 Encoding**: Prevents env var parsing issues
- **JWT Tokens**: Signed with `SESSION_SECRET`, no expiry
- **httpOnly Cookies**: Not accessible via JavaScript (XSS protection)
- **Secure Flag**: Enabled in production (HTTPS only)
- **sameSite=strict**: CSRF protection
- **Server-Side Verification**: All protected routes verify session server-side

### API Security

- **Protected Routes**: All admin operations require valid session
- **Input Validation**: File types, sizes, required fields
- **SQL Injection**: Prevented by Supabase parameterized queries
- **XSS**: React automatically escapes content
- **CSRF**: sameSite=strict cookies prevent CSRF attacks

### Image Upload Security

- **File Type Validation**: Only image types allowed
- **File Size Limit**: 5MB maximum
- **Server-Side Processing**: Sharp processes images server-side
- **Unique Filenames**: Timestamp + random string prevents collisions
- **Public Storage**: Images stored in public bucket (intentional for blog)

### Environment Variables

- **Service Role Key**: Server-side only, never exposed to client
- **Session Secret**: Strong random hex string
- **Password Hash**: Base64-encoded bcrypt hash
- **Git Ignored**: `.env.local` in `.gitignore`

---

## Development Workflow

### Adding a New Blog Post

1. **Via Editor** (recommended):
   - Visit `/admin/editor`
   - Enter password if not authenticated
   - Fill form, preview, publish
   - Post saved to Supabase

2. **Via Script** (legacy):
   - `npm run new:post "Title"`
   - Creates `.mdx` file in `/posts`
   - Migrate to Supabase if using filesystem

### Setting Up Authentication

1. **Generate secrets**:
   ```bash
   node scripts/hash-password.js "your-password"
   ```

2. **Add to `.env.local`**:
   ```env
   ADMIN_PASSWORD_HASH=BASE64:...
   SESSION_SECRET=...
   ```

3. **Restart dev server**:
   ```bash
   npm run dev
   ```

4. **Test**:
   - Visit `/admin/editor`
   - Enter password
   - Verify editor access

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

- Global: `app/globals.scss`
- Tailwind config: `tailwind.config.js`
- Component-specific: Inline Tailwind classes
- Editor styles: `styles/_variables.scss` and `.ProseMirror` classes
- FOUC prevention: Update inline styles in affected components

### Database Changes

1. Update Supabase schema
2. Update TypeScript interfaces in `lib/posts.ts`
3. Update API routes if needed
4. Run migration if changing structure

---

## Testing Strategy

### Manual Testing Checklist

**Authentication**:
- [ ] Password modal appears when not authenticated
- [ ] Wrong password shows error
- [ ] Correct password grants access
- [ ] Session persists during browser session
- [ ] Session expires when browser closes
- [ ] Protected API routes reject unauthenticated requests

**Editor**:
- [ ] Create post via editor
- [ ] Upload images
- [ ] Preview matches final render
- [ ] Save draft (published=false)
- [ ] Publish post (published=true)
- [ ] Edit existing post
- [ ] Delete post (with image cleanup)

**Blog**:
- [ ] View post on blog page
- [ ] RSS feed includes new post
- [ ] Home page shows latest posts
- [ ] "New Post" button hidden in production
- [ ] Delete button only visible when authenticated

**Data Source**:
- [ ] Migration script works
- [ ] Filesystem fallback works
- [ ] Data source switch works

**FOUC**:
- [ ] No white flash on page load
- [ ] Dark theme applied immediately
- [ ] All components load with correct colors

### Key Test Scenarios

1. **Data Source Switch**: Change `NEXT_PUBLIC_DATA_SOURCE`, verify posts load
2. **Authentication Flow**: Test login, session persistence, logout (browser close)
3. **Image Upload**: Upload image, verify storage, verify deletion on post delete
4. **Slug Conflicts**: Try creating duplicate slugs
5. **Migration**: Run migration script, verify all posts transferred

---

## Deployment Considerations

### Environment Variables

**Required in Production**:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (server-side only)
- `NEXT_PUBLIC_DATA_SOURCE` (set to `supabase`)
- `ADMIN_PASSWORD_HASH` (Base64 encoded)
- `SESSION_SECRET` (random hex string)

**Optional**:
- `NEXT_PUBLIC_SITE_URL` (for RSS feed, OG tags)

### Build Process

1. Static generation: Blog posts pre-rendered
2. API routes: Serverless functions
3. Editor: Included in build (protected by auth)
4. Tree-shaking: Unused code removed

### Vercel Deployment

1. **Connect Repository**: Import from GitHub
2. **Set Environment Variables**: Add all required vars
3. **Deploy**: Automatic on push to main
4. **Custom Domain**: Optional, configure in Vercel dashboard

### Supabase Setup

- RLS policies configured
- Storage bucket created (`blog-images`)
- Indexes created
- Service role key secured (never expose to client)

### Post-Deployment Verification

- [ ] Site loads at deployment URL
- [ ] Blog posts display correctly
- [ ] Data source is Supabase
- [ ] RSS feed works
- [ ] API routes respond correctly
- [ ] Authentication works
- [ ] Image uploads work
- [ ] Environment variables set correctly
- [ ] SSL certificate active (automatic with Vercel)

---

## Troubleshooting Guide

### Authentication Issues

**Password not working**:
- Verify `ADMIN_PASSWORD_HASH` is Base64 encoded with `BASE64:` prefix
- Regenerate hash: `node scripts/hash-password.js "password"`
- Check dev server was restarted after env var change
- Verify no extra spaces in env var value

**Session not persisting**:
- Check browser allows cookies
- Verify `SESSION_SECRET` is set
- Check browser console for errors

**401 Unauthorized errors**:
- Session expired (browser closed)
- Session cookie not being sent
- Server unable to verify JWT token

### Editor Not Showing

- Check authentication (enter password)
- Verify route `/admin/editor` exists
- Check browser console for errors
- Verify session cookie is set

### Posts Not Loading

- Verify `NEXT_PUBLIC_DATA_SOURCE` matches current setup
- Check Supabase connection (env vars)
- Verify RLS policies allow read access
- Check filesystem posts exist if using filesystem
- Check server logs for `[Posts]` prefix messages
- Verify data source indicator (dev mode) shows correct source
- Errors will throw (fail-fast) - check error boundaries

### Image Upload Issues

- Verify Supabase Storage bucket exists (`blog-images`)
- Check RLS policies allow uploads
- Verify file size under 5MB
- Check file type is allowed (JPEG, PNG, GIF, WebP)
- Check Sharp is installed (`npm list sharp`)
- Verify authentication (session valid)

### Migration Issues

- Ensure Supabase table exists
- Check service role key is set
- Verify posts directory has `.mdx` files
- Check for duplicate slugs

### Styling Issues

- Verify Tailwind config includes all paths
- Check `globals.scss` is imported in `layout.tsx`
- Ensure custom classes are in `@layer components`
- For FOUC: Check inline styles match Tailwind colors

### FOUC (Flash) Issues

- Hard refresh browser (Cmd+Shift+R / Ctrl+Shift+R)
- Check inline styles are present in components
- Verify inline style colors match theme colors
- Check browser dev tools for style application order

---

## Code Quality Standards

### TypeScript

- Strict mode enabled
- Interfaces for all data structures
- No `any` types (use `unknown` if needed)
- Proper error typing in try-catch blocks

### Component Structure

- Server components by default
- Client components only when needed
- Props typed with interfaces
- Proper separation of concerns (server auth check, client UI)

### File Naming

- Components: PascalCase (`PostCard.tsx`)
- Utilities: camelCase (`posts.ts`)
- Pages: Next.js conventions (`page.tsx`, `route.ts`)
- Hooks: camelCase with `use` prefix (`use-mobile.ts`)

### Error Handling

- **Fail-fast strategy**: Throw errors rather than silent failures
- Try-catch in async functions
- Meaningful error messages with context (`[Posts]`, `[Auth]` prefix for filtering)
- Production logging enabled (all data operations logged)
- User-friendly messages in production (errors caught by Next.js error boundaries)

### Security

- Never log sensitive data (passwords, tokens)
- Always verify sessions server-side
- Validate all user inputs
- Use parameterized queries (Supabase handles this)
- Keep service role key server-side only

---

## Summary

This application is a **hybrid static/dynamic blog platform** with:
- **Dual data sources** (filesystem + Supabase) for flexibility
- **Rich text editor** (Tiptap) for content creation with image upload
- **Password authentication** (bcrypt + JWT) for secure admin access
- **Session management** (httpOnly cookies) for security
- **Image processing** (Sharp + Supabase Storage) for optimization
- **FOUC prevention** (inline styles) for smooth UX
- **Static generation** for performance
- **Full TypeScript** for type safety
- **Tailwind CSS** + **SCSS** for styling
- **Accessibility** built-in

The architecture prioritizes **security** (password auth, session verification), **flexibility** (dual data sources), **performance** (static generation, image optimization), and **user experience** (FOUC prevention, smooth authentication) while maintaining **code quality** and **developer experience**.

For specific implementation details, refer to:
- `ADMIN_AUTH_SETUP.md` - Authentication setup guide
- `IMPLEMENTATION_SUMMARY.md` - Recent implementation details
- `FOUC_FIX_SUMMARY.md` - FOUC prevention details
- `SUPABASE_STORAGE_SETUP.md` - Image storage setup
- `README.md` - User-facing documentation
