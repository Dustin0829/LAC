import { Routes, Route } from 'react-router-dom'
import { ProtectedRoute } from './components/guards/ProtectedRoute'
import RootLayout from './layouts/RootLayout'
import ClipperLayout from './layouts/ClipperLayout'
import BrandLayout from './layouts/BrandLayout'

import AuthPage from './pages/auth/AuthPage'
import RoleSelectionPage from './pages/onboarding/RoleSelectionPage'

import ClipperDashboardPage from './pages/clipper/dashboard/DashboardPage'
import ClipperCampaignsPage from './pages/clipper/campaigns/CampaignsPage'
import ClipperCampaignDetailPage from './pages/clipper/campaigns/CampaignDetailPage'
import MyClipsPage from './pages/clipper/clips/MyClipsPage'
import ClipperEarningsPage from './pages/clipper/earnings/EarningsPage'
import ClipperAccountPage from './pages/clipper/account/AccountPage'

import BrandDashboardPage from './pages/brand/dashboard/DashboardPage'
import BrandCampaignsPage from './pages/brand/campaigns/CampaignsPage'
import CreateCampaignPage from './pages/brand/campaigns/CreateCampaignPage'
import BrandCampaignDetailPage from './pages/brand/campaigns/CampaignDetailPage'
import BrandAccountPage from './pages/brand/account/AccountPage'

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

        {/* Clipper area */}
        <Route
          path="clipper"
          element={
            <ProtectedRoute requiredRole="clipper">
              <ClipperLayout />
            </ProtectedRoute>
          }
        >
          <Route path="dashboard" element={<ClipperDashboardPage />} />
          <Route path="campaigns" element={<ClipperCampaignsPage />} />
          <Route path="campaigns/:id" element={<ClipperCampaignDetailPage />} />
          <Route path="clips" element={<MyClipsPage />} />
          <Route path="earnings" element={<ClipperEarningsPage />} />
          <Route path="account" element={<ClipperAccountPage />} />
        </Route>

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
