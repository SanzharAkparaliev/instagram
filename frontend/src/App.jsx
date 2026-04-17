import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import useAuthStore from './store/auth.store';
import Layout from './components/Layout/Sidebar';
import LoginPage from './pages/Login';
import Dashboard from './pages/Dashboard';
import CommentsPage from './pages/Comments';
import LeadsPage from './pages/Leads';
import AccountsPage from './pages/Accounts';
import UsersPage from './pages/Users';
import SettingsPage from './pages/Settings';

function PrivateRoute({ children, adminOnly = false }) {
  const { token, user } = useAuthStore();
  if (!token) return <Navigate to="/login" replace />;
  if (adminOnly && user?.role !== 'admin') return <Navigate to="/" replace />;
  return <Layout>{children}</Layout>;
}

export default function App() {
  const { token, fetchMe } = useAuthStore();

  useEffect(() => {
    if (token) fetchMe();
  }, [token]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={token ? <Navigate to="/" replace /> : <LoginPage />} />

        <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/comments" element={<PrivateRoute><CommentsPage /></PrivateRoute>} />
        <Route path="/leads" element={<PrivateRoute><LeadsPage /></PrivateRoute>} />
        <Route path="/accounts" element={<PrivateRoute><AccountsPage /></PrivateRoute>} />
        <Route path="/users" element={<PrivateRoute adminOnly><UsersPage /></PrivateRoute>} />
        <Route path="/settings" element={<PrivateRoute adminOnly><SettingsPage /></PrivateRoute>} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
