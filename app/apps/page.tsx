import { Metadata } from 'next'
import MiniAppFrame from '@/components/MiniAppFrame'

export const metadata: Metadata = {
  title: 'Apps',
  description: 'Mini applications and projects',
  openGraph: {
    title: 'Apps | Matt Site',
    description: 'Mini applications and projects',
  },
}

const miniApps = [
  {
    id: 'todo',
    title: 'Todo List',
    description: 'A simple todo list application to manage your tasks.',
  },
  {
    id: 'drawing-pad',
    title: 'Drawing Pad',
    description: 'A simple drawing pad for sketching and doodling.',
  },
]

export default function AppsPage() {
  return (
    <div className="container-content py-12">
      <header className="mb-8">
        <h1 className="text-4xl font-bold text-accent mb-4">Mini Apps</h1>
        <p className="text-gray-300 text-lg">
          Interactive applications and projects
        </p>
      </header>

      <div className="space-y-12">
        {miniApps.map((app) => (
          <section key={app.id} className="space-y-4">
            <div>
              <h2 className="text-2xl font-semibold text-gray-200 mb-2">
                {app.title}
              </h2>
              <p className="text-gray-400">{app.description}</p>
            </div>
            <MiniAppFrame appId={app.id} />
          </section>
        ))}
      </div>
    </div>
  )
}

