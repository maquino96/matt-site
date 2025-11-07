import type { MDXComponents } from 'mdx/types'

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    h1: ({ children }) => (
      <h1 className="text-4xl font-bold text-accent mt-8 mb-4">{children}</h1>
    ),
    h2: ({ children }) => (
      <h2 className="text-3xl font-bold text-accent mt-6 mb-3">{children}</h2>
    ),
    h3: ({ children }) => (
      <h3 className="text-2xl font-semibold text-gray-200 mt-4 mb-2">{children}</h3>
    ),
    p: ({ children }) => (
      <p className="text-gray-300 mb-4 leading-relaxed">{children}</p>
    ),
    a: ({ href, children }) => (
      <a
        href={href}
        className="text-accent hover:text-accent/80 underline underline-offset-4 transition-colors"
        target={href?.startsWith('http') ? '_blank' : undefined}
        rel={href?.startsWith('http') ? 'noopener noreferrer' : undefined}
      >
        {children}
      </a>
    ),
    ul: ({ children }) => (
      <ul className="list-disc list-inside mb-4 text-gray-300 space-y-2">{children}</ul>
    ),
    ol: ({ children }) => (
      <ol className="list-decimal list-inside mb-4 text-gray-300 space-y-2">{children}</ol>
    ),
    li: ({ children }) => (
      <li className="ml-4">{children}</li>
    ),
    code: ({ children, className }) => {
      const isInline = !className
      return isInline ? (
        <code className="bg-primary-800 text-accent px-1.5 py-0.5 rounded text-sm font-mono">
          {children}
        </code>
      ) : (
        <code className={className}>{children}</code>
      )
    },
    pre: ({ children }) => (
      <pre className="bg-primary-800 rounded-lg p-4 mb-4 overflow-x-auto border border-primary-700">
        {children}
      </pre>
    ),
    blockquote: ({ children }) => (
      <blockquote className="border-l-4 border-accent pl-4 italic text-gray-400 my-4">
        {children}
      </blockquote>
    ),
    hr: () => (
      <hr className="border-primary-700 my-8" />
    ),
    ...components,
  }
}

