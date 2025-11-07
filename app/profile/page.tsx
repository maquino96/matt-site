import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Profile',
  description: 'About me, skills, and contact information',
  openGraph: {
    title: 'Profile | Matt Site',
    description: 'About me, skills, and contact information',
  },
}

export default function ProfilePage() {
  return (
    <div className="container-content py-12">
      <header className="mb-8">
        <h1 className="text-4xl font-bold text-accent mb-4">Profile</h1>
      </header>

      <div className="space-y-8">
        <section>
          <h2 className="text-2xl font-semibold text-gray-200 mb-4">About</h2>
          <p className="text-gray-300 leading-relaxed mb-4">
            Welcome to my personal site! I'm a developer passionate about building
            web applications and sharing knowledge through writing.
          </p>
          <p className="text-gray-300 leading-relaxed">
            This site serves as both a portfolio and a blog where I document my
            journey, share tutorials, and showcase projects.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-gray-200 mb-4">Skills</h2>
          <div className="flex flex-wrap gap-2">
            {[
              'TypeScript',
              'JavaScript',
              'React',
              'Next.js',
              'Node.js',
              'Tailwind CSS',
              'Git',
            ].map((skill) => (
              <span
                key={skill}
                className="px-3 py-1 bg-primary-800 text-accent rounded border border-primary-700"
              >
                {skill}
              </span>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-gray-200 mb-4">Contact</h2>
          <div className="space-y-2 text-gray-300">
            <p>
              <strong className="text-accent">Email:</strong>{' '}
              <a
                href="mailto:your.email@example.com"
                className="link"
              >
                your.email@example.com
              </a>
            </p>
            <p>
              <strong className="text-accent">GitHub:</strong>{' '}
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="link"
              >
                github.com/username
              </a>
            </p>
            <p>
              <strong className="text-accent">LinkedIn:</strong>{' '}
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                className="link"
              >
                linkedin.com/in/username
              </a>
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold text-gray-200 mb-4">Links</h2>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              href="/blog"
              className="btn btn-primary inline-block text-center"
            >
              Read My Blog
            </Link>
            <Link
              href="/apps"
              className="btn btn-secondary inline-block text-center"
            >
              Try My Apps
            </Link>
          </div>
        </section>
      </div>
    </div>
  )
}

