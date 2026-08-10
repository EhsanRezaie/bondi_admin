import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext';
import { ProtectedRoute } from './auth/ProtectedRoute';
import { AppLayout } from './components/AppLayout';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { UsersPage } from './pages/UsersPage';
import { PhotosPage } from './pages/PhotosPage';
import { ReportsPage } from './pages/ReportsPage';
import { TicketsPage } from './pages/TicketsPage';
import { AnnouncementsPage } from './pages/AnnouncementsPage';
import { AuditLogPage } from './pages/AuditLogPage';
import { SystemPage } from './pages/SystemPage';

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/users" element={<UsersPage />} />
          <Route path="/photos" element={<PhotosPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/tickets" element={<TicketsPage />} />
          <Route path="/announcements" element={<AnnouncementsPage />} />
          <Route path="/logs" element={<AuditLogPage />} />
          <Route path="/system" element={<SystemPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AuthProvider>
  );
}