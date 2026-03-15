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
const ForgotPassword = lazy(() => import('./pages/auth/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/auth/ResetPassword'));
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
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/register-license" element={<RegisterLicense />} />
          <Route path="/verify/:barcodeId" element={<VerifyKta />} />
          <Route path="/kejurnas/teams" element={<ApprovedTeams />} />

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

          {/* Pengda (role_id: 3) */}
          <Route path="/pengda" element={<ProtectedRoute allowedRoles={[3]}><PengdaDashboard /></ProtectedRoute>} />
          <Route path="/pengda/kta/:id" element={<ProtectedRoute allowedRoles={[3]}><KtaDetail /></ProtectedRoute>} />
          <Route path="/pengda/kejurnas" element={<ProtectedRoute allowedRoles={[3]}><KejurnasManage /></ProtectedRoute>} />
          <Route path="/pengda/kta-config" element={<ProtectedRoute allowedRoles={[3]}><KtaConfigPage /></ProtectedRoute>} />
          <Route path="/pengda/reregistrations" element={<ProtectedRoute allowedRoles={[3]}><ManageReregistration /></ProtectedRoute>} />

          {/* PB (role_id: 4) */}
          <Route path="/pb" element={<ProtectedRoute allowedRoles={[4]}><PbDashboard /></ProtectedRoute>} />
          <Route path="/pb/kta/:id" element={<ProtectedRoute allowedRoles={[4]}><KtaDetail /></ProtectedRoute>} />
          <Route path="/pb/license" element={<ProtectedRoute allowedRoles={[4]}><ManageLicense /></ProtectedRoute>} />
          <Route path="/pb/license-config" element={<ProtectedRoute allowedRoles={[4]}><LicenseConfigPage /></ProtectedRoute>} />
          <Route path="/pb/notifications" element={<ProtectedRoute allowedRoles={[4]}><NotificationPanel /></ProtectedRoute>} />
          <Route path="/pb/kejurnas" element={<ProtectedRoute allowedRoles={[4]}><KejurnasManage /></ProtectedRoute>} />
          <Route path="/pb/kta-config" element={<ProtectedRoute allowedRoles={[4]}><KtaConfigPage /></ProtectedRoute>} />
          <Route path="/pb/reregistrations" element={<ProtectedRoute allowedRoles={[4]}><ManageReregistration /></ProtectedRoute>} />

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
