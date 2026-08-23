import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';

// Public & Shared Pages
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { NoticeBoard } from './pages/NoticeBoard';
import { Profile } from './pages/Profile';

// Resident Pages
import { ResidentDashboard } from './pages/resident/Dashboard';
import { NewComplaint } from './pages/resident/NewComplaint';
import { MyComplaints } from './pages/resident/MyComplaints';
import { ResidentComplaintDetail } from './pages/resident/ComplaintDetail';

// Staff Pages
import { StaffDashboard } from './pages/staff/StaffDashboard';
import { StaffComplaints } from './pages/staff/StaffComplaints';

// Admin Pages
import { AdminDashboard } from './pages/admin/Dashboard';
import { AllComplaints } from './pages/admin/AllComplaints';
import { NoticeManage } from './pages/admin/NoticeManage';
import { StaffManage } from './pages/admin/StaffManage';
import { CategorySlaManage } from './pages/admin/CategorySlaManage';
import { AuditLogs } from './pages/admin/AuditLogs';
import { AdminSettings } from './pages/admin/Settings';

const RootRedirect = () => {
  const { user, loading, isAuthenticated } = useAuth();
  if (loading) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.role === 'admin') return <Navigate to="/admin/dashboard" replace />;
  if (user?.role === 'staff') return <Navigate to="/staff/dashboard" replace />;
  return <Navigate to="/resident/dashboard" replace />;
};

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Auth Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Root Redirect */}
          <Route path="/" element={<RootRedirect />} />

          {/* Resident Routes */}
          <Route element={<ProtectedRoute requiredRole="resident" />}>
            <Route path="/resident/dashboard" element={<ResidentDashboard />} />
            <Route path="/resident/new-complaint" element={<NewComplaint />} />
            <Route path="/resident/my-complaints" element={<MyComplaints />} />
            <Route path="/resident/complaints/:id" element={<ResidentComplaintDetail />} />
          </Route>

          {/* Staff Routes */}
          <Route element={<ProtectedRoute requiredRole="staff" />}>
            <Route path="/staff/dashboard" element={<StaffDashboard />} />
            <Route path="/staff/my-assigned" element={<StaffComplaints />} />
          </Route>

          {/* Admin Routes */}
          <Route element={<ProtectedRoute requiredRole="admin" />}>
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/complaints" element={<AllComplaints />} />
            <Route path="/admin/notices" element={<NoticeManage />} />
            <Route path="/admin/staff" element={<StaffManage />} />
            <Route path="/admin/categories" element={<CategorySlaManage />} />
            <Route path="/admin/audit-logs" element={<AuditLogs />} />
            <Route path="/admin/settings" element={<AdminSettings />} />
          </Route>

          {/* Shared Authenticated Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/notices" element={<NoticeBoard />} />
            <Route path="/profile" element={<Profile />} />
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
