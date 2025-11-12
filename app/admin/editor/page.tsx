import { verifyAdminSession } from '@/lib/auth/admin-auth'
import AdminPasswordModal from '@/components/AdminPasswordModal'
import EditorClient from './EditorClient'
import { Provider } from '@/components/ui/provider'
import ThinSideNav from '@/components/nav/ThinSideNav'

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
    <>
      <Provider>
        <ThinSideNav />
        {/* Other themed chrome goes here */}
      </Provider>

      {/* Completely unthemed editor */}
      <EditorClient />
    </>
  )
}
