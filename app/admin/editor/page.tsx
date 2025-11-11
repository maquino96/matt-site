import { verifyAdminSession } from '@/lib/auth/admin-auth'
import AdminPasswordModal from '@/components/AdminPasswordModal'
import EditorClient from './EditorClient'

export default async function EditorPage() {
  const isAuthenticated = await verifyAdminSession()

  if (!isAuthenticated) {
    return (
      <div>
        <AdminPasswordModal />
      </div>
    )
  }

  return (
    <div className="h-screen overflow-hidden">
      <EditorClient />
    </div>
  )
}
