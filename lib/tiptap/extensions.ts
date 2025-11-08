import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'

export const extensions = [
  StarterKit,
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

