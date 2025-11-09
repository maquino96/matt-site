import Link from 'next/link'

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-primary-800 border-t border-primary-700 mt-auto" style={{ backgroundColor: '#08263C' }} role="contentinfo">
      <div className="container-content py-8">
        <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
          <p className="text-gray-400 text-sm">
            © {currentYear} Matt Site. All rights reserved.
          </p>
          <div className="flex space-x-6">
            {/* Add social links here */}
            <Link 
              href="/api/rss" 
              className="text-gray-400 hover:text-accent transition-colors text-sm focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-primary-800 rounded"
              aria-label="RSS Feed"
            >
              RSS
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}

