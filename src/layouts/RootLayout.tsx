import { Outlet } from 'react-router-dom'
import { Toaster } from 'sonner'
import { TooltipProvider } from '@/components/ui/tooltip'

export default function RootLayout() {
  return (
    <TooltipProvider delayDuration={300} skipDelayDuration={200}>
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
    </TooltipProvider>
  )
}
