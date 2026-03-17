import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import UpdateBanner from './components/common/UpdateBanner';

// Homepage loaded eagerly (landing page)
import Homepage from './pages/public/Homepage';

// Everything else lazy-loaded
const Login = lazy(() => import('./pages/auth/Login'));
const RegisterLicense = lazy(() => import('./pages/auth/RegisterLicense'));
const Register = lazy(() => import('./pages/auth/Register'));
const VerifyKta = lazy(() => import('./pages/public/VerifyKta'));
const ApprovedTeams = lazy(() => import('./pages/public/ApprovedTeams'));
const AnggotaDashboard = lazy(() => import('./pages/dashboard/AnggotaDashboard'));
const PengcabDashboard = lazy(() => import('./pages/dashboard/PengcabDashboard'));
const PengdaDashboard = lazy(() => import('./pages/dashboard/PengdaDashboard'));
const PbDashboard = lazy(() => import('./pages/dashboard/PbDashboard'));
const SuperAdminDashboard = lazy(() => import('./pages/dashboard/SuperAdminDashboard'));
const LicenseUserDashboard = lazy(() => import('./pages/dashboard/LicenseUserDashboard'));
const KtaSubmitForm = lazy(() => import('./pages/kta/KtaSubmitForm'));
const KtaDetail = lazy(() => import('./pages/kta/KtaDetail'));
const ManageLicense = lazy(() => import('./pages/license/ManageLicense'));
const LicenseConfigPage = lazy(() => import('./pages/config/LicenseConfigPage'));
const KejurnasManage = lazy(() => import('./pages/kejurnas/KejurnasManage'));
const NotificationPanel = lazy(() => import('./pages/notifications/NotificationPanel'));
const KtaConfigPage = lazy(() => import('./pages/config/KtaConfigPage'));
const Reregistration = lazy(() => import('./pages/config/Reregistration'));
const ManageReregistration = lazy(() => import('./pages/config/ManageReregistration'));
const PenyelenggaraDashboard = lazy(() => import('./pages/dashboard/PenyelenggaraDashboard'));
const EventSubmitForm = lazy(() => import('./pages/event/EventSubmitForm'));
const EventDetail = lazy(() => import('./pages/event/EventDetail'));
const EventManage = lazy(() => import('./pages/event/EventManage'));
const KejurcabSubmitForm = lazy(() => import('./pages/event/KejurcabSubmitForm'));
const KejurdaManage = lazy(() => import('./pages/kejurda/KejurdaManage'));
const SSOCallback = lazy(() => import('./pages/auth/SSOCallback'));

const PageLoader = () => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#0c1222' }}>
    <div style={{ width: 36, height: 36, border: '3px solid rgba(16,185,129,.3)', borderTopColor: '#10b981', borderRadius: '50%', animation: 'spin .7s linear infinite' }} />
    <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
  </div>
);

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
        <UpdateBanner />
        <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Homepage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/register-license" element={<RegisterLicense />} />
          <Route path="/verify/:barcodeId" element={<VerifyKta />} />
          <Route path="/kejurnas/teams" element={<ApprovedTeams />} />
          <Route path="/sso-callback" element={<SSOCallback />} />

          {/* Anggota (role_id: 1) */}
          <Route path="/anggota" element={<ProtectedRoute allowedRoles={[1]}><AnggotaDashboard /></ProtectedRoute>} />
          <Route path="/anggota/kta/submit" element={<ProtectedRoute allowedRoles={[1]}><KtaSubmitForm /></ProtectedRoute>} />
          <Route path="/anggota/kta/:id" element={<ProtectedRoute allowedRoles={[1]}><KtaDetail /></ProtectedRoute>} />
          <Route path="/anggota/reregistration" element={<ProtectedRoute allowedRoles={[1]}><Reregistration /></ProtectedRoute>} />

          {/* Pengcab (role_id: 2) */}
          <Route path="/pengcab" element={<ProtectedRoute allowedRoles={[2]}><PengcabDashboard /></ProtectedRoute>} />
          <Route path="/pengcab/kta/:id" element={<ProtectedRoute allowedRoles={[2]}><KtaDetail /></ProtectedRoute>} />
          <Route path="/pengcab/kta-config" element={<ProtectedRoute allowedRoles={[2]}><KtaConfigPage /></ProtectedRoute>} />
          <Route path="/pengcab/reregistrations" element={<ProtectedRoute allowedRoles={[2]}><ManageReregistration /></ProtectedRoute>} />
          <Route path="/pengcab/kejurcab/submit" element={<ProtectedRoute allowedRoles={[2]}><KejurcabSubmitForm /></ProtectedRoute>} />
          <Route path="/pengcab/events" element={<ProtectedRoute allowedRoles={[2]}><EventManage /></ProtectedRoute>} />
          <Route path="/pengcab/kejurda" element={<ProtectedRoute allowedRoles={[2]}><KejurdaManage /></ProtectedRoute>} />

          {/* Pengda (role_id: 3) */}
          <Route path="/pengda" element={<ProtectedRoute allowedRoles={[3]}><PengdaDashboard /></ProtectedRoute>} />
          <Route path="/pengda/kta/:id" element={<ProtectedRoute allowedRoles={[3]}><KtaDetail /></ProtectedRoute>} />
          <Route path="/pengda/kejurnas" element={<ProtectedRoute allowedRoles={[3]}><KejurnasManage /></ProtectedRoute>} />
          <Route path="/pengda/kejurda" element={<ProtectedRoute allowedRoles={[3]}><KejurdaManage /></ProtectedRoute>} />
          <Route path="/pengda/kta-config" element={<ProtectedRoute allowedRoles={[3]}><KtaConfigPage /></ProtectedRoute>} />
          <Route path="/pengda/reregistrations" element={<ProtectedRoute allowedRoles={[3]}><ManageReregistration /></ProtectedRoute>} />
          <Route path="/pengda/events" element={<ProtectedRoute allowedRoles={[3]}><EventManage /></ProtectedRoute>} />

          {/* PB (role_id: 4) */}
          <Route path="/pb" element={<ProtectedRoute allowedRoles={[4]}><PbDashboard /></ProtectedRoute>} />
          <Route path="/pb/kta/:id" element={<ProtectedRoute allowedRoles={[4]}><KtaDetail /></ProtectedRoute>} />
          <Route path="/pb/license" element={<ProtectedRoute allowedRoles={[4]}><ManageLicense /></ProtectedRoute>} />
          <Route path="/pb/license-config" element={<ProtectedRoute allowedRoles={[4]}><LicenseConfigPage /></ProtectedRoute>} />
          <Route path="/pb/notifications" element={<ProtectedRoute allowedRoles={[4]}><NotificationPanel /></ProtectedRoute>} />
          <Route path="/pb/kejurnas" element={<ProtectedRoute allowedRoles={[4]}><KejurnasManage /></ProtectedRoute>} />
          <Route path="/pb/kta-config" element={<ProtectedRoute allowedRoles={[4]}><KtaConfigPage /></ProtectedRoute>} />
          <Route path="/pb/reregistrations" element={<ProtectedRoute allowedRoles={[4]}><ManageReregistration /></ProtectedRoute>} />
          <Route path="/pb/events" element={<ProtectedRoute allowedRoles={[4]}><EventManage /></ProtectedRoute>} />

          {/* Penyelenggara (role_id: 5) */}
          <Route path="/penyelenggara" element={<ProtectedRoute allowedRoles={[5]}><PenyelenggaraDashboard /></ProtectedRoute>} />
          <Route path="/penyelenggara/event/submit" element={<ProtectedRoute allowedRoles={[5]}><EventSubmitForm /></ProtectedRoute>} />
          <Route path="/penyelenggara/event/:id" element={<ProtectedRoute allowedRoles={[5]}><EventDetail /></ProtectedRoute>} />

          {/* SuperAdmin */}
          <Route path="/superadmin" element={<ProtectedRoute allowedTypes={['super_admin']}><SuperAdminDashboard /></ProtectedRoute>} />

          {/* License Users (pelatih/juri) */}
          <Route path="/license-user" element={<ProtectedRoute allowedTypes={['license_user']}><LicenseUserDashboard /></ProtectedRoute>} />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  );
}
