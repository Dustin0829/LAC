import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { ProtectedRoute } from './components/guards/ProtectedRoute'
import RootLayout from './layouts/RootLayout'
import CreatorLayout from './layouts/CreatorLayout'
import BrandLayout from './layouts/BrandLayout'

import AuthPage from './pages/auth/AuthPage'
import RoleSelectionPage from './pages/onboarding/RoleSelectionPage'

import CreatorDashboardPage from './pages/creator/dashboard/DashboardPage'
import CreatorCampaignsPage from './pages/creator/campaigns/CampaignsPage'
import CreatorCampaignDetailPage from './pages/creator/campaigns/CampaignDetailPage'
import SubmissionsPage from './pages/creator/submissions/SubmissionsPage'
import CreatorAccountPage from './pages/creator/account/AccountPage'

import BrandDashboardPage from './pages/brand/dashboard/DashboardPage'
import BrandCampaignsPage from './pages/brand/campaigns/CampaignsPage'
import CreateCampaignPage from './pages/brand/campaigns/CreateCampaignPage'
import BrandCampaignDetailPage from './pages/brand/campaigns/CampaignDetailPage'
import BrandAccountPage from './pages/brand/account/AccountPage'

/** Old URLs used `/creator/...`; send them to the same path without the prefix. */
function LegacyCreatorPathRedirect() {
  const { pathname, search } = useLocation()
  if (pathname === '/creator' || pathname === '/creator/') {
    return <Navigate to={`/dashboard${search}`} replace />
  }
  const next = pathname.slice('/creator'.length)
  if (!next.startsWith('/')) {
    return <Navigate to={`/dashboard${search}`} replace />
  }
  return <Navigate to={`${next}${search}`} replace />
}

function App() {
  return (
    <Routes>
      <Route element={<RootLayout />}>
        <Route index element={<ProtectedRoute index />} />

        <Route
          path="auth"
          element={
            <ProtectedRoute guestOnly>
              <AuthPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="onboarding/role"
          element={
            <ProtectedRoute requireAuth>
              <RoleSelectionPage />
            </ProtectedRoute>
          }
        />

        {/* Creator area — `/dashboard`, `/campaigns`, … (no `/creator` prefix) */}
        <Route
          element={
            <ProtectedRoute requiredRole="creator">
              <CreatorLayout />
            </ProtectedRoute>
          }
        >
          <Route path="dashboard" element={<CreatorDashboardPage />} />
          <Route path="campaigns" element={<CreatorCampaignsPage />} />
          <Route path="campaigns/:id" element={<CreatorCampaignDetailPage />} />
          <Route path="submissions" element={<SubmissionsPage />} />
          <Route path="content" element={<Navigate to="/submissions" replace />} />
          <Route path="earnings" element={<Navigate to="/submissions" replace />} />
          <Route path="account" element={<CreatorAccountPage />} />
        </Route>

        <Route path="creator/*" element={<LegacyCreatorPathRedirect />} />

        {/* Brand area */}
        <Route
          path="brand"
          element={
            <ProtectedRoute requiredRole="brand">
              <BrandLayout />
            </ProtectedRoute>
          }
        >
          <Route path="dashboard" element={<BrandDashboardPage />} />
          <Route path="campaigns" element={<BrandCampaignsPage />} />
          <Route path="campaigns/new" element={<CreateCampaignPage />} />
          <Route path="campaigns/:id" element={<BrandCampaignDetailPage />} />
          <Route path="account" element={<BrandAccountPage />} />
        </Route>
      </Route>
    </Routes>
  )
}

export default App
