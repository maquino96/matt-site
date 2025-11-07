import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import { CodeBlockLowlight } from '@tiptap/extension-code-block-lowlight'
import { createLowlight } from 'lowlight'
import javascript from 'highlight.js/lib/languages/javascript'
import typescript from 'highlight.js/lib/languages/typescript'
import css from 'highlight.js/lib/languages/css'
import xml from 'highlight.js/lib/languages/xml'
import json from 'highlight.js/lib/languages/json'
import python from 'highlight.js/lib/languages/python'
import bash from 'highlight.js/lib/languages/bash'
import markdown from 'highlight.js/lib/languages/markdown'

// Create lowlight instance and register common languages
const lowlight = createLowlight({
  javascript,
  js: javascript,
  typescript,
  ts: typescript,
  css,
  html: xml,
  xml,
  json,
  python,
  py: python,
  bash,
  sh: bash,
  shell: bash,
  markdown,
  md: markdown,
})

export const extensions = [
  StarterKit.configure({
    // Disable default code block, we'll use lowlight version
    codeBlock: false,
  }),
  CodeBlockLowlight.configure({
    lowlight,
    defaultLanguage: 'plaintext',
  }),
  Placeholder.configure({
    placeholder: 'Start writing your post...',
  }),
  Link.configure({
    openOnClick: false,
    HTMLAttributes: {
      class: 'text-accent hover:text-accent/80 underline underline-offset-4',
    },
  }),
  Image.configure({
    HTMLAttributes: {
      class: 'max-w-full h-auto rounded-lg my-4',
    },
  }),
]

