import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="container-content py-12 text-center">
      <h1 className="text-6xl font-bold text-accent mb-4">404</h1>
      <h2 className="text-2xl font-semibold text-gray-200 mb-4">Page Not Found</h2>
      <p className="text-gray-400 mb-8">
        The page you're looking for doesn't exist.
      </p>
      <Link
        href="/"
        className="btn btn-primary"
      >
        Go Home
      </Link>
    </div>
  )
}

