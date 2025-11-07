'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { clsx } from 'clsx'

const navItems = [
  { href: '/', label: 'Home' },
  { href: '/blog', label: 'Blog' },
  { href: '/profile', label: 'Profile' },
  { href: '/apps', label: 'Apps' },
]

export default function Nav() {
  const pathname = usePathname()

  return (
    <nav className="bg-primary-800 border-b border-primary-700" role="navigation" aria-label="Main navigation">
      <div className="container-content">
        <div className="flex items-center justify-between h-16">
          <Link 
            href="/" 
            className="text-xl font-bold text-accent hover:text-accent/80 transition-colors focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-primary-800 rounded"
            aria-label="Home page"
          >
            Matt Site
          </Link>
          <ul className="flex space-x-1 sm:space-x-4">
            {navItems.map((item) => {
              const isActive = pathname === item.href || 
                (item.href !== '/' && pathname?.startsWith(item.href))
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={clsx(
                      'px-3 py-2 rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-primary-800',
                      isActive
                        ? 'bg-primary-700 text-accent'
                        : 'text-gray-300 hover:bg-primary-700 hover:text-gray-100'
                    )}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    {item.label}
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>
      </div>
    </nav>
  )
}

