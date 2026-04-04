import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useThemeStore } from './store';
import { Toaster } from './components/ui/sonner';
import { useEffect } from 'react';

// Pages
import Login from './pages/Login';
import UserLayout from './layouts/UserLayout';
import AdminLayout from './layouts/AdminLayout';
import UserDashboard from './pages/user/Dashboard';
import UserDocuments from './pages/user/Documents';
import DocumentAnalysis from './pages/user/DocumentAnalysis';
import UserProfile from './pages/user/Profile';
import AdminDashboard from './pages/admin/Dashboard';
import AdminUsers from './pages/admin/Users';
import AdminDocuments from './pages/admin/Documents';
import KnowledgeBase from './pages/admin/KnowledgeBase';

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, user } = useSelector((state) => state.auth);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to={user.role === 'admin' ? '/admin' : '/user'} replace />;
  }

  return <>{children}</>;
};

function App() {
  const { theme } = useThemeStore();

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  return (
    <Router>
      <Routes>
        {/* Public Route */}
        <Route path="/login" element={<Login />} />

        {/* User Routes */}
        <Route
          path="/user"
          element={
            <ProtectedRoute allowedRoles={['user']}>
              <UserLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<UserDashboard />} />
          <Route path="documents" element={<UserDocuments />} />
          <Route path="documents/:id/analysis" element={<DocumentAnalysis />} />
          <Route path="profile" element={<UserProfile />} />
        </Route>

        {/* Admin Routes */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="documents" element={<AdminDocuments />} />
          <Route path="knowledge-base" element={<KnowledgeBase />} />
        </Route>

        {/* Default Redirect */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
      <Toaster position="top-right" />
    </Router>
  );
}

export default App;
