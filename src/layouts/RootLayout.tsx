import { Outlet } from 'react-router-dom'
import { Toaster } from 'sonner'

export default function RootLayout() {
  return (
    <div className="h-full min-h-0 w-full overflow-x-hidden bg-background text-foreground antialiased">
      <Outlet />
      <Toaster
        position="bottom-right"
        richColors
        toastOptions={{
          classNames: {
            title: 'text-sm',
            toast: 'rounded-2xl',
          },
        }}
      />
    </div>
  )
}
