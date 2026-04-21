import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useThemeStore } from './store';
import { Toaster } from './components/ui/sonner';
import { useEffect, useState } from 'react';
import PageLoader from './components/ui/PageLoader';
import { AnimatePresence } from 'framer-motion';

// Pages
import Login from './pages/Login';
import UserLayout from './layouts/UserLayout';
import AdminLayout from './layouts/AdminLayout';
import UserDashboard from './pages/user/Dashboard';
import UserDocuments from './pages/user/Documents';
import DocumentAnalysis from './pages/user/DocumentAnalysis';
import UserProfile from './pages/user/Profile';

// Super Admin Layout
import SuperAdminLayout from './layouts/SuperAdminLayout';

// Super Admin Pages
import SuperAdminDashboard from './pages/superadmin/Dashboard';
import SuperAdminUsers from './pages/superadmin/Users';
import SuperAdminDocuments from './pages/superadmin/Documents';
import SuperAdminKnowledgeBase from './pages/superadmin/KnowledgeBase';
import SuperAdminChunks from './pages/superadmin/Chunks';
import SuperAdminExtractionSchema from './pages/superadmin/ExtractionSchema';
import SuperAdminAgents from './pages/superadmin/Agents';
import SuperAdminClassifier from './pages/superadmin/Classifier';
import SuperAdminMapping from './pages/superadmin/Mapping';
import SuperAdminPrompts from './pages/superadmin/Prompts';
import SuperAdminDiseases from './pages/superadmin/Diseases';
import SuperAdminRules from './pages/superadmin/Rules';

import AdminDashboard from './pages/admin/Dashboard';
import AdminDocuments from './pages/admin/Documents';
import IntakeOrders from './pages/admin/intake/IntakeOrders';
import NewOrder from './pages/admin/intake/NewOrder';
import OrderDetail from './pages/admin/intake/OrderDetail';
import IntakePatients from './pages/admin/intake/IntakePatients';
import AdminProfile from './pages/admin/Profile';

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    if (user.role === 'superadmin') return <Navigate to="/superadmin" replace />;
    if (user.role === 'admin') return <Navigate to="/admin" replace />;
    return <Navigate to="/user" replace />;
  }
  return <>{children}</>;
};

// Route Transition Loader
const RouteTransitionLoader = () => {
  const location = useLocation();
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    // Show loader on route change
    setIsTransitioning(true);
    const timer = setTimeout(() => {
      setIsTransitioning(false);
    }, 600); // Quick transition for better UX
    return () => clearTimeout(timer);
  }, [location.pathname]);

  return (
    <AnimatePresence mode="wait">
      {isTransitioning && <PageLoader key="route-loader" />}
    </AnimatePresence>
  );
};

function App() {
  const { theme } = useThemeStore();
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  useEffect(() => {
    if (theme === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [theme]);

  useEffect(() => {
    // Artificial delay for high-quality loading feel
    const timer = setTimeout(() => {
      setIsInitialLoading(false);
    }, 1200);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <AnimatePresence mode="wait">
        {isInitialLoading && <PageLoader key="initial-loader" />}
      </AnimatePresence>

      {!isInitialLoading && (
        <Router>
          <RouteTransitionLoader />
          <Routes>
            <Route path="/login" element={<Login />} />

            {/* User Routes */}
            <Route path="/user" element={<ProtectedRoute allowedRoles={['user']}><UserLayout /></ProtectedRoute>}>
              <Route index element={<UserDashboard />} />
              <Route path="documents" element={<UserDocuments />} />
              <Route path="documents/:id/analysis" element={<DocumentAnalysis />} />
              <Route path="profile" element={<UserProfile />} />
            </Route>

            {/* Super Admin Routes */}
            <Route path="/superadmin" element={<ProtectedRoute allowedRoles={['superadmin']}><SuperAdminLayout /></ProtectedRoute>}>
              <Route index element={<SuperAdminDashboard />} />
              <Route path="users" element={<SuperAdminUsers />} />
              <Route path="documents" element={<SuperAdminDocuments />} />
              <Route path="knowledge-base" element={<SuperAdminKnowledgeBase />} />
              <Route path="rules" element={<SuperAdminRules />} />
              <Route path="chunks" element={<SuperAdminChunks />} />
              <Route path="extraction-schema" element={<SuperAdminExtractionSchema />} />
              <Route path="agents" element={<SuperAdminAgents />} />
              <Route path="classifier" element={<SuperAdminClassifier />} />
              <Route path="mapping" element={<SuperAdminMapping />} />
              <Route path="prompts" element={<SuperAdminPrompts />} />
              <Route path="diseases" element={<SuperAdminDiseases />} />
            </Route>

            {/* Admin Routes */}
            <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']}><AdminLayout /></ProtectedRoute>}>
              <Route index element={<AdminDashboard />} />
              <Route path="documents" element={<AdminDocuments />} />
              <Route path="intake" element={<IntakeOrders />} />
              <Route path="intake/new" element={<NewOrder />} />
              <Route path="intake/orders/:orderId" element={<OrderDetail />} />
              <Route path="intake/patients" element={<IntakePatients />} />
              <Route path="profile" element={<AdminProfile />} />
            </Route>

            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
          <Toaster 
            position="top-right" 
            expand={false} 
            richColors 
            closeButton
            theme={theme}
            toastOptions={{
              className: 'rounded-2xl border-border/50 backdrop-blur-xl bg-card/80 shadow-2xl',
              style: {
                padding: '1rem',
              }
            }}
          />
        </Router>
      )}
    </>
  );
}

export default App;
