import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ErrorBoundary } from './components/ErrorBoundary'
import { AuthProvider } from './providers/AuthProvider'
import { PlatformOAuthProvider } from './providers/PlatformOAuthProvider'
import { QueryProvider } from './providers/QueryProvider'
import { SessionExpiredProvider } from './providers/SessionExpiredProvider'
import App from './App'
import './globals.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <QueryProvider>
          <AuthProvider>
            <SessionExpiredProvider>
              <PlatformOAuthProvider>
                <App />
              </PlatformOAuthProvider>
            </SessionExpiredProvider>
          </AuthProvider>
        </QueryProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>
)
