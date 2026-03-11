import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/common/ProtectedRoute';
// import PwaInstallPrompt from './components/common/PwaInstallPrompt'; // Disabled

// Auth pages
import Login from './pages/auth/Login';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import RegisterLicense from './pages/auth/RegisterLicense';
import Register from './pages/auth/Register';

// Public pages
import Homepage from './pages/public/Homepage';
import VerifyKta from './pages/public/VerifyKta';
import ApprovedTeams from './pages/public/ApprovedTeams';

// Dashboards
import AnggotaDashboard from './pages/dashboard/AnggotaDashboard';
import PengcabDashboard from './pages/dashboard/PengcabDashboard';
import PengdaDashboard from './pages/dashboard/PengdaDashboard';
import PbDashboard from './pages/dashboard/PbDashboard';
import SuperAdminDashboard from './pages/dashboard/SuperAdminDashboard';
import LicenseUserDashboard from './pages/dashboard/LicenseUserDashboard';

// KTA
import KtaSubmitForm from './pages/kta/KtaSubmitForm';
import KtaDetail from './pages/kta/KtaDetail';

// License
import ManageLicense from './pages/license/ManageLicense';

// Kejurnas
import KejurnasManage from './pages/kejurnas/KejurnasManage';

// Notifications
import NotificationPanel from './pages/notifications/NotificationPanel';

// Config
import KtaConfigPage from './pages/config/KtaConfigPage';
import Reregistration from './pages/config/Reregistration';
import ManageReregistration from './pages/config/ManageReregistration';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
        {/* <PwaInstallPrompt /> */}
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
      </AuthProvider>
    </BrowserRouter>
  );
}
