import { Outlet } from 'react-router-dom'
import { AppSidebarDesktop, AppSidebarMobile } from '@/components/layout/AppSidebar'

export default function BrandLayout() {
  return (
    <div className="fixed inset-0 flex flex-col md:flex-row bg-background">
      <AppSidebarDesktop role="brand" />
      <main className="flex-1 min-h-0 overflow-y-auto px-3 pt-4 pb-16 xl:px-24 md:pt-12 md:pb-0">
        <AppSidebarMobile role="brand" />
        <Outlet />
      </main>
    </div>
  )
}
