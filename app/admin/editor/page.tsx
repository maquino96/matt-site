import { verifyAdminSession } from '@/lib/auth/admin-auth'
import EditorWorkspaceClient from './EditorWorkspaceClient'

export default async function EditorPage() {
  const isAuthenticated = await verifyAdminSession()

  if (!isAuthenticated) {
    return (
      <div>
        <p>Admin access is required. Please navigate to the admin login page.</p>
      </div>
    )
  }

  return (
    <>
      <EditorWorkspaceClient />
    </>
  )
}
