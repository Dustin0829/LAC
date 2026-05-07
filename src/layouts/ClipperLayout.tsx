import { Outlet } from 'react-router-dom'
import { AppSidebar } from '@/components/layout/AppSidebar'

export default function ClipperLayout() {
  return (
    <div className="min-h-dvh bg-background">
      <AppSidebar role="clipper" />
      <main className="min-w-0 pb-20 md:pb-0 md:pl-64">
        <div className="mx-auto max-w-[1200px] px-4 md:px-10 py-8 md:py-16">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
