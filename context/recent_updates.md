## Recent Architecture Updates

### Chakra UI Theming System (v3)

**Location**: `theme/theme.ts` and `components/ui/provider.tsx`

**Overview**: A scalable, single-source-of-truth color theming system using Chakra UI v3 with Panda CSS architecture. The system provides semantic color tokens and easy theme switching capabilities.

**Key Components**:
- `palette` object: Central configuration for brand/neutral/accent hues
- `semanticColors`: Mappings for consistent color usage throughout the app
- Scoped `ChakraProvider`: Theming applied only to app chrome, excluding editor content

**Theme Structure**:
```typescript
export const palette = {
  brandHue: "teal",      // Primary brand color
  accentHue: "cyan",     // Accent/interactive color  
  neutralHue: "gray",    // Neutral/background color
  black: "#000000",
  white: "#ffffff",
} as const;

export const semanticColors = {
  // App backgrounds and surfaces
  appBg: "white",
  appBgDark: "gray.900",
  surface: "gray.50", 
  surfaceDark: "gray.800",
  // Text colors
  text: "gray.800",
  textDark: "gray.100",
  // Brand colors
  primary: "teal.600",
  primaryDark: "teal.300",
  // ... additional semantic mappings
} as const;
```

**Usage in Components**:
- Use semantic tokens: `color={semanticColors.text}`, `bg={semanticColors.surface}`
- Use color scales: `colorScheme="teal"`, `color="teal.600"`
- Avoid hardcoded hex values in components

**Theme Switching**:
To change the entire theme (e.g., from Teal to Indigo):
1. Edit only the `palette` in `theme/theme.ts`:
   ```typescript
   export const palette = {
     brandHue: "indigo",   // Change from "teal"
     accentHue: "purple",  // Change from "cyan"
     // ... rest unchanged
   } as const;
   ```
2. No component changes needed - semantic tokens automatically update

**Integration**:
- Wrapped in `ChakraProvider` with `cssVarsRoot` scoping
- Editor component excluded from theme scope to maintain independence
- Tailwind colors updated to match Chakra theme (`tailwind.config.js`)

### Editor Functionality Updates

**Thin Side Navigation** (`components/nav/ThinSideNav.tsx`):
- Hover-activated sidebar for editor interface
- Fixed positioning with smooth expand/collapse transitions
- Navigation items for Home, Drafts, Settings
- Dark theme styling optimized for editor workspace
- Client component (`'use client'`) with React hooks

**Editor Page Composition** (`app/admin/editor/page.tsx`):
- Themed chrome (side nav) wrapped in Chakra provider
- Editor component rendered outside themed scope for independence
- Maintains authentication flow and password protection

**Theme Isolation**:
- Editor uses its own CSS/SASS styling (`components/tiptap-templates/simple/simple-editor.scss`)
- Chakra theme variables scoped to `#chakra-scope` element
- Global styles only affect themed portions of the app

### Updated Color Palette

The application now uses a teal/cyan color scheme:

**Tailwind Config** (`tailwind.config.js`):
- Primary: Teal palette (`#f0fdfa` to `#134e4a`)
- Accent: Cyan palette (`#ecfeff` to `#164e63`)

**Global Styles** (`app/globals.scss`):
- Updated all color references to use new palette
- Skip links, focus rings, buttons, links use `accent-500`, `accent-400`
- Editor elements use appropriate teal/cyan shades
- Maintained FOUC prevention with inline styles

### Benefits of New Architecture

1. **Single Source of Truth**: One `palette` object controls entire theme
2. **Semantic Usage**: Components use meaningful color names instead of raw values
3. **Easy Rebrading**: Change hues in one place, entire UI updates
4. **Editor Independence**: Rich text editor maintains its own styling
5. **Consistent Experience**: All UI elements follow the same color system
6. **Type Safety**: Full TypeScript support with proper interfaces

### Files Added/Modified

- `theme/theme.ts` - Central theme configuration
- `components/ui/provider.tsx` - Updated Chakra provider with scoping
- `components/nav/ThinSideNav.tsx` - New side navigation component
- `tailwind.config.js` - Updated color palettes
- `app/globals.scss` - Updated global styles to use new palette
- `app/admin/editor/page.tsx` - Updated editor page composition
- `components/demo/SemanticDemo.tsx` - Demo component showing semantic usage

### Migration Notes

When updating the theme:
1. Update both Tailwind config AND Chakra theme for consistency
2. Test both light and dark mode appearances
3. Verify editor remains unaffected by theme changes
4. Check FOUC prevention inline styles match new colors