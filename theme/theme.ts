// theme/theme.ts
// Chakra UI v3 uses Panda CSS - this file provides semantic color mappings

export const palette = {
  brandHue: "teal",
  accentHue: "cyan", 
  neutralHue: "gray",
  black: "#000000",
  white: "#ffffff",
} as const;

// Semantic color mappings for consistent usage throughout the app
export const semanticColors = {
  // App backgrounds and surfaces
  appBg: "white",
  appBgDark: "gray.900",
  surface: "gray.50",
  surfaceDark: "gray.800",
  muted: "gray.100",
  mutedDark: "gray.700",

  // Text
  text: "gray.800",
  textDark: "gray.100",
  textMuted: "gray.600",
  textMutedDark: "gray.400",
  heading: "gray.900",
  headingDark: "whiteAlpha.900",

  // Brand & Accent
  primary: "teal.600",
  primaryDark: "teal.300",
  primaryHover: "teal.700",
  primaryHoverDark: "teal.400",
  accent: "cyan.500",
  accentDark: "cyan.300",

  // Borders / outlines
  border: "gray.200",
  borderDark: "whiteAlpha.300",
  ring: "teal.400",
  ringDark: "teal.300",

  // Links
  link: "teal.600",
  linkDark: "teal.300",
  linkHover: "teal.700",
  linkHoverDark: "teal.400",
} as const;
