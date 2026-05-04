import { Outlet } from 'react-router-dom'
import { AppSidebar } from '@/components/layout/AppSidebar'

export default function ClipperLayout() {
  return (
    <div className="min-h-dvh bg-background">
      <AppSidebar role="clipper" />
      <main className="min-w-0 pb-20 md:pb-0 md:pl-64">
        <div className="mx-auto max-w-7xl px-4 md:px-8 py-6 md:py-10">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
